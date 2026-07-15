import { db } from "@/db"
import {
  appointments,
  appointmentProcedures,
  scheduleConfig,
  scheduleBlocks,
  clients,
  procedures,
  organizationMembers,
  organizations,
  users,
  publicBookingAttempts,
} from "@/db/schema"
import { eq, and, gte, lte, sql, count } from "drizzle-orm"
import { generateSlots, type TimeSlot } from "@/lib/schedule"
import { resolveProcedureSnapshots } from "@/actions/schedule"
import { notifyOrganizationProfessionals } from "@/actions/notifications"
import { revalidatePath, revalidateTag } from "next/cache"

// ── Organização pelo slug ─────────────────────────────────────────────────────

export async function getOrganizationBySlug(slug: string) {
  const [org] = await db
    .select({ id: organizations.id, name: organizations.name, type: organizations.type, phone: organizations.phone })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1)
  return org ?? null
}

// ── Profissionais com agenda configurada (aptas a receber agendamento público) ─

export async function getBookableProfessionals(organizationId: string) {
  const members = await db
    .select({ id: users.id, name: users.name })
    .from(organizationMembers)
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.active, true)
      )
    )
    .orderBy(users.name)

  if (members.length === 0) return []

  const configs = await db
    .select({ userId: scheduleConfig.userId })
    .from(scheduleConfig)
    .where(eq(scheduleConfig.organizationId, organizationId))

  const configuredIds = new Set(configs.map((c) => c.userId))
  return members.filter((m) => configuredIds.has(m.id))
}

// ── Procedimentos ativos (sem sessão) ─────────────────────────────────────────

export async function listActiveProceduresPublic(organizationId: string) {
  return db
    .select({ id: procedures.id, name: procedures.name, price: procedures.price })
    .from(procedures)
    .where(and(eq(procedures.organizationId, organizationId), eq(procedures.active, true)))
    .orderBy(procedures.name)
}

// ── Slots livres (sem sessão), projetados para não vazar dados de outras clientes ─

export type PublicTimeSlot = { time: string; available: boolean }

export async function getPublicWeekSlots(
  organizationId: string,
  professionalId: string,
  dates: string[]
): Promise<Record<string, PublicTimeSlot[]>> {
  const [config] = await db
    .select()
    .from(scheduleConfig)
    .where(and(eq(scheduleConfig.organizationId, organizationId), eq(scheduleConfig.userId, professionalId)))
    .limit(1)

  if (!config || dates.length === 0) return {}

  const startDate = dates[0]
  const endDate = dates[dates.length - 1]

  const [blocks, appts] = await Promise.all([
    db.select().from(scheduleBlocks).where(and(
      eq(scheduleBlocks.organizationId, organizationId),
      eq(scheduleBlocks.userId, professionalId),
      gte(scheduleBlocks.date, startDate),
      lte(scheduleBlocks.date, endDate)
    )),
    db.select({
      id: appointments.id,
      date: appointments.date,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      procedure: appointments.procedure,
      procedureId: appointments.procedureId,
      clientPackageId: appointments.clientPackageId,
      clientId: appointments.clientId,
      notes: appointments.notes,
      status: appointments.status,
      clientName: clients.name,
    })
      .from(appointments)
      .innerJoin(clients, eq(clients.id, appointments.clientId))
      .where(and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.professionalId, professionalId),
        gte(appointments.date, startDate),
        lte(appointments.date, endDate),
        sql`${appointments.status} != 'cancelled'`
      )),
  ])

  const result: Record<string, PublicTimeSlot[]> = {}
  for (const date of dates) {
    const dayBlocks = blocks.filter((b) => b.date === date)
    const dayAppts = appts.filter((a) => a.date === date)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const slots: TimeSlot[] = generateSlots(config, date, dayBlocks, dayAppts as any)
    // Projeção pública: nunca expor nome/observações de outras clientes
    result[date] = slots.map((s) => ({ time: s.time, available: s.available && !s.isBlocked }))
  }
  return result
}

// ── Encontra ou cria cliente pelo telefone ────────────────────────────────────

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "")
}

export async function findOrCreateClientByPhone(
  organizationId: string,
  data: { name: string; phone: string }
): Promise<string> {
  const phone = normalizePhone(data.phone)

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.organizationId, organizationId), eq(clients.phone, phone)))
    .limit(1)
  if (existing) return existing.id

  // O índice único em clients é parcial (organization_id, phone) WHERE phone IS NOT NULL —
  // o Postgres só casa o ON CONFLICT com um índice parcial se a mesma condição for repetida aqui.
  // onConflictDoNothing não aceita targetWhere, por isso usamos onConflictDoUpdate com um "set" inofensivo.
  const [created] = await db
    .insert(clients)
    .values({ organizationId, name: data.name.trim(), phone, whatsapp: phone })
    .onConflictDoUpdate({
      target: [clients.organizationId, clients.phone],
      targetWhere: sql`${clients.phone} is not null`,
      set: { updatedAt: new Date() },
    })
    .returning({ id: clients.id })
  if (created) return created.id

  // Corrida: outra requisição criou entre o select e o insert — busca de novo
  const [retry] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.organizationId, organizationId), eq(clients.phone, phone)))
    .limit(1)
  if (!retry) throw new Error("Não foi possível localizar ou criar a cliente.")
  return retry.id
}

// ── Criar agendamento a partir do link público ────────────────────────────────

export async function createPublicAppointment(params: {
  organizationId: string
  professionalId: string
  clientId: string
  clientName: string
  clientPhone: string
  date: string
  startTime: string
  procedureIds: string[]
}): Promise<{ success: true; appointmentId: string } | { success: false; error: string }> {
  const { organizationId, professionalId, clientId, date, startTime, procedureIds } = params

  const [config] = await db
    .select()
    .from(scheduleConfig)
    .where(and(eq(scheduleConfig.organizationId, organizationId), eq(scheduleConfig.userId, professionalId)))
    .limit(1)
  if (!config) return { success: false, error: "Esta profissional não está com a agenda configurada." }

  const snapshots = await resolveProcedureSnapshots(organizationId, procedureIds)
  if (snapshots.length === 0) return { success: false, error: "Selecione ao menos um procedimento." }
  const procedureString = snapshots.map((s) => s.name).join(", ")
  const primaryProcedureId = snapshots[0].procedureId

  const startMins = startTime.split(":").reduce((acc, v, i) => acc + Number(v) * (i === 0 ? 60 : 1), 0)
  const endMins = startMins + config.slotDuration
  const endTime = `${Math.floor(endMins / 60).toString().padStart(2, "0")}:${(endMins % 60).toString().padStart(2, "0")}`

  // Re-checa conflito no momento do insert (o slot pode ter sido preenchido entre a busca e o envio)
  const [conflict] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.professionalId, professionalId),
        eq(appointments.date, date),
        eq(appointments.startTime, startTime),
        sql`${appointments.status} != 'cancelled'`
      )
    )
    .limit(1)
  if (conflict) return { success: false, error: "Este horário acabou de ser preenchido. Escolha outro." }

  const [inserted] = await db
    .insert(appointments)
    .values({
      organizationId,
      professionalId,
      clientId,
      date,
      startTime,
      endTime,
      procedureId: primaryProcedureId,
      procedure: procedureString,
      status: "waiting",
      createdById: null,
    })
    .returning({ id: appointments.id })

  await db.insert(appointmentProcedures).values(
    snapshots.map((s, i) => ({
      organizationId,
      appointmentId: inserted.id,
      procedureId: s.procedureId,
      name: s.name,
      price: s.price,
      commissionPct: s.commissionPct,
      position: i,
    }))
  )

  revalidateTag(`dashboard-${professionalId}-${organizationId}`, {})
  revalidateTag(`clients-${organizationId}`, {})
  revalidateTag(`client-${clientId}`, {})
  revalidatePath("/agenda")

  // Notifica a profissional no sininho — não existe hoje pro fluxo manual (ela mesma criou),
  // mas aqui é essencial: foi a cliente quem agendou sozinha.
  try {
    await notifyOrganizationProfessionals({
      organizationId,
      type: "public_booking_created",
      title: `${params.clientName} agendou pelo link`,
      body: `${procedureString} — ${date.split("-").reverse().join("/")} às ${startTime.slice(0, 5)}. Aguardando confirmação.`,
      href: "/agenda",
    })
  } catch (err) {
    console.error("[PublicBooking] erro ao notificar profissional:", err)
  }

  // Nenhum WhatsApp de resumo é enviado aqui — o agendamento ainda está "waiting".
  // O resumo completo (com link de anamnese) só é enviado quando a profissional aprovar,
  // em updateAppointmentStatusAction (src/actions/schedule.ts).

  return { success: true, appointmentId: inserted.id }
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 3

export async function checkPublicBookingRateLimit(ip: string, phone: string | null): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)

  const [byIp] = await db
    .select({ n: count() })
    .from(publicBookingAttempts)
    .where(and(eq(publicBookingAttempts.ip, ip), gte(publicBookingAttempts.createdAt, since)))
  if (byIp.n >= RATE_LIMIT_MAX) return true

  if (phone) {
    const [byPhone] = await db
      .select({ n: count() })
      .from(publicBookingAttempts)
      .where(and(eq(publicBookingAttempts.phone, phone), gte(publicBookingAttempts.createdAt, since)))
    if (byPhone.n >= RATE_LIMIT_MAX) return true
  }

  return false
}

export async function recordPublicBookingAttempt(params: {
  organizationId: string
  ip: string
  phone: string | null
  success: boolean
}) {
  await db.insert(publicBookingAttempts).values(params)
}
