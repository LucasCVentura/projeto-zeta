"use server"

import { db } from "@/db"
import {
  appointments,
  scheduleConfig,
  scheduleBlocks,
  clients,
  procedures,
} from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { can } from "@/lib/permissions"
import { generateSlots } from "@/lib/schedule"
import { revalidatePath } from "next/cache"
import type { AppointmentStatus } from "@/db/schema"
import type { ActionResult } from "./auth"
import { sendAppointmentConfirmation } from "./whatsapp"
import { organizations } from "@/db/schema"


// ── Buscar slots do dia ───────────────────────────────────────────────────────

export async function getDaySlots(date: string) {
  const { userId, organizationId } = await requireSession()

  const [config] = await db
    .select()
    .from(scheduleConfig)
    .where(
      and(
        eq(scheduleConfig.organizationId, organizationId),
        eq(scheduleConfig.userId, userId)
      )
    )
    .limit(1)

  if (!config) return { slots: [], hasConfig: false }

  const blocks = await db
    .select()
    .from(scheduleBlocks)
    .where(
      and(
        eq(scheduleBlocks.organizationId, organizationId),
        eq(scheduleBlocks.userId, userId),
        eq(scheduleBlocks.date, date)
      )
    )

  const appts = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      endTime: appointments.endTime,
      procedure: appointments.procedure,
      procedureId: appointments.procedureId,
      notes: appointments.notes,
      status: appointments.status,
      clientName: clients.name,
      procedurePrice: procedures.price,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .leftJoin(procedures, eq(procedures.id, appointments.procedureId))
    .where(
      and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.professionalId, userId),
        eq(appointments.date, date)
      )
    )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const slots = generateSlots(config, date, blocks, appts as any)
  return { slots, hasConfig: true }
}

// ── Criar agendamento ─────────────────────────────────────────────────────────

export async function getProceduresForBookingAction() {
  const { organizationId } = await requireSession()

  return db
    .select({ id: procedures.id, name: procedures.name, price: procedures.price })
    .from(procedures)
    .where(and(eq(procedures.organizationId, organizationId), eq(procedures.active, true)))
    .orderBy(procedures.name)
}

export async function createAppointmentAction(data: {
  clientId: string
  date: string
  startTime: string
  procedureId?: string
  procedure?: string
  clientPackageId?: string
  notes?: string
  recurrence?: { frequency: "weekly" | "biweekly" | "monthly"; count: number }
}): Promise<ActionResult & { skipped?: number; appointmentIds?: string[] }> {
  const { userId, organizationId, role } = await requireSession()

  if (!can(role, "schedule:create")) {
    return { success: false, error: "Sem permissão para criar agendamentos." }
  }

  const [config] = await db
    .select()
    .from(scheduleConfig)
    .where(
      and(
        eq(scheduleConfig.organizationId, organizationId),
        eq(scheduleConfig.userId, userId)
      )
    )
    .limit(1)

  if (!config) {
    return { success: false, error: "Configure sua agenda antes de agendar." }
  }

  const startMins = data.startTime.split(":").reduce((acc, v, i) => acc + Number(v) * (i === 0 ? 60 : 1), 0)
  const endMins = startMins + config.slotDuration
  const endTime = `${Math.floor(endMins / 60).toString().padStart(2, "0")}:${(endMins % 60).toString().padStart(2, "0")}`

  // Gera lista de datas (primeira + recorrências)
  const dates: string[] = [data.date]
  if (data.recurrence) {
    const { frequency, count } = data.recurrence
    const intervalDays = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30
    for (let i = 1; i < count; i++) {
      const d = new Date(data.date + "T12:00:00")
      if (frequency === "monthly") {
        d.setMonth(d.getMonth() + i)
      } else {
        d.setDate(d.getDate() + intervalDays * i)
      }
      dates.push(d.toISOString().split("T")[0])
    }
  }

  // Verifica conflitos existentes em todas as datas
  const conflictChecks = await Promise.all(
    dates.map((date) =>
      db
        .select({ id: appointments.id })
        .from(appointments)
        .where(
          and(
            eq(appointments.organizationId, organizationId),
            eq(appointments.professionalId, userId),
            eq(appointments.date, date),
            eq(appointments.startTime, data.startTime)
          )
        )
        .limit(1)
        .then((rows) => ({ date, conflict: rows.length > 0 }))
    )
  )

  // Se é agendamento único e tem conflito, erro
  if (!data.recurrence && conflictChecks[0].conflict) {
    return { success: false, error: "Este horário já está ocupado." }
  }

  const freeDates = conflictChecks.filter((c) => !c.conflict).map((c) => c.date)
  const skipped = dates.length - freeDates.length

  if (freeDates.length === 0) {
    return { success: false, error: "Todos os horários selecionados já estão ocupados." }
  }

  const inserted = await db.insert(appointments).values(
    freeDates.map((date) => ({
      organizationId,
      professionalId: userId,
      clientId: data.clientId,
      date,
      startTime: data.startTime,
      endTime,
      procedureId: data.procedureId || null,
      procedure: data.procedure || null,
      clientPackageId: data.clientPackageId || null,
      notes: data.notes || null,
      status: "waiting" as const,
      createdById: userId,
    }))
  ).returning({ id: appointments.id })

  revalidatePath("/agenda")

  // Envia confirmação WhatsApp para o primeiro agendamento (fire-and-forget)
  try {
    const [clientData] = await db
      .select({ name: clients.name, phone: clients.phone })
      .from(clients)
      .where(eq(clients.id, data.clientId))
      .limit(1)

    const [org] = await db
      .select({ name: organizations.name, address: organizations.address })
      .from(organizations)
      .where(eq(organizations.id, organizationId))
      .limit(1)

    if (clientData?.phone && inserted[0]?.id) {
      await sendAppointmentConfirmation({
        appointmentId: inserted[0].id,
        clientPhone: clientData.phone,
        clientName: clientData.name,
        date: freeDates[0],
        startTime: data.startTime,
        procedure: data.procedure,
        orgName: org?.name ?? "Clínica",
        orgAddress: org?.address,
      })
    }
  } catch {
    // Falha silenciosa — não bloqueia o agendamento
  }

  return { success: true, skipped, appointmentIds: inserted.map((r) => r.id) }
}

// ── Atualizar status ──────────────────────────────────────────────────────────

export async function updateAppointmentStatusAction(
  appointmentId: string,
  status: AppointmentStatus
): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "schedule:update")) {
    return { success: false, error: "Sem permissão." }
  }

  await db
    .update(appointments)
    .set({ status, updatedAt: new Date() })
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.organizationId, organizationId)
      )
    )

  revalidatePath("/agenda")
  return { success: true }
}

// ── Editar agendamento ────────────────────────────────────────────────────────

export async function updateAppointmentAction(
  appointmentId: string,
  data: { procedureId?: string | null; procedure?: string | null; notes?: string | null }
): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "schedule:update")) {
    return { success: false, error: "Sem permissão." }
  }

  const [appt] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.organizationId, organizationId)))
    .limit(1)

  if (!appt) return { success: false, error: "Agendamento não encontrado." }

  let procedureName = data.procedure ?? null
  if (data.procedureId) {
    const [proc] = await db
      .select({ name: procedures.name, price: procedures.price })
      .from(procedures)
      .where(and(eq(procedures.id, data.procedureId), eq(procedures.organizationId, organizationId)))
      .limit(1)
    if (proc) procedureName = proc.name
  }

  await db
    .update(appointments)
    .set({
      procedureId: data.procedureId ?? null,
      procedure: procedureName,
      notes: data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(appointments.id, appointmentId))

  revalidatePath("/agenda")
  return { success: true }
}

// ── Cancelar agendamento ──────────────────────────────────────────────────────

export async function cancelAppointmentAction(appointmentId: string): Promise<ActionResult> {
  return updateAppointmentStatusAction(appointmentId, "cancelled")
}

// ── Bloquear intervalo ────────────────────────────────────────────────────────

export async function createBlockAction(data: {
  date: string
  startTime: string
  endTime: string
  reason?: string
}): Promise<ActionResult> {
  const { userId, organizationId, role } = await requireSession()

  if (!can(role, "schedule:update")) {
    return { success: false, error: "Sem permissão para bloquear agenda." }
  }

  await db.insert(scheduleBlocks).values({
    organizationId,
    userId,
    date: data.date,
    startTime: data.startTime,
    endTime: data.endTime,
    reason: data.reason || null,
  })

  revalidatePath("/agenda")
  return { success: true }
}

export async function deleteBlockAction(blockId: string): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "schedule:update")) {
    return { success: false, error: "Sem permissão." }
  }

  await db
    .delete(scheduleBlocks)
    .where(
      and(
        eq(scheduleBlocks.id, blockId),
        eq(scheduleBlocks.organizationId, organizationId)
      )
    )

  revalidatePath("/agenda")
  return { success: true }
}

// ── Salvar configuração da agenda ─────────────────────────────────────────────

export async function saveScheduleConfigAction(data: {
  workDays: string
  startTime: string
  endTime: string
  slotDuration: number
  breakStart?: string
  breakEnd?: string
}): Promise<ActionResult> {
  const { userId, organizationId, role } = await requireSession()

  if (!can(role, "schedule:update")) {
    return { success: false, error: "Sem permissão." }
  }

  const [existing] = await db
    .select({ id: scheduleConfig.id })
    .from(scheduleConfig)
    .where(
      and(
        eq(scheduleConfig.organizationId, organizationId),
        eq(scheduleConfig.userId, userId)
      )
    )
    .limit(1)

  const payload = {
    ...data,
    breakStart: data.breakStart || null,
    breakEnd: data.breakEnd || null,
  }

  if (existing) {
    await db
      .update(scheduleConfig)
      .set({ ...payload, updatedAt: new Date() })
      .where(eq(scheduleConfig.id, existing.id))
  } else {
    await db.insert(scheduleConfig).values({
      organizationId,
      userId,
      ...payload,
    })
  }

  revalidatePath("/agenda")
  return { success: true }
}

// ── Buscar clientes da org ────────────────────────────────────────────────────

export async function getClientsAction() {
  const { organizationId } = await requireSession()

  return db
    .select({ id: clients.id, name: clients.name, phone: clients.phone })
    .from(clients)
    .where(eq(clients.organizationId, organizationId))
    .orderBy(clients.name)
}
