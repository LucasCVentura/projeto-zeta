"use server"

import { db } from "@/db"
import { clients, clientAnamnesis, appointments } from "@/db/schema"
import { eq, and, ilike, or, count, max, sql, desc, asc } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { can } from "@/lib/permissions"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import type { ActionResult } from "./auth"

// ── Listar clientes ───────────────────────────────────────────────────────────

export async function getClientsListAction(search?: string) {
  const { organizationId } = await requireSession()

  // Buscas com texto nunca são cacheadas (resultado altamente variável)
  if (search) {
    return db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        whatsapp: clients.whatsapp,
        email: clients.email,
        createdAt: clients.createdAt,
        totalAppointments: count(appointments.id),
        lastAppointment: max(appointments.date),
      })
      .from(clients)
      .leftJoin(appointments, eq(appointments.clientId, clients.id))
      .where(
        and(
          eq(clients.organizationId, organizationId),
          or(
            ilike(clients.name, `%${search}%`),
            ilike(clients.phone ?? "", `%${search}%`),
            ilike(clients.whatsapp ?? "", `%${search}%`)
          )
        )
      )
      .groupBy(clients.id)
      .orderBy(sql`lower(${clients.name})`)
  }

  const tag = `clients-${organizationId}`
  return unstable_cache(
    async (orgId: string) =>
      db
        .select({
          id: clients.id,
          name: clients.name,
          phone: clients.phone,
          whatsapp: clients.whatsapp,
          email: clients.email,
          createdAt: clients.createdAt,
          totalAppointments: count(appointments.id),
          lastAppointment: max(appointments.date),
        })
        .from(clients)
        .leftJoin(appointments, eq(appointments.clientId, clients.id))
        .where(eq(clients.organizationId, orgId))
        .groupBy(clients.id)
        .orderBy(sql`lower(${clients.name})`),
    [tag],
    { tags: [tag], revalidate: 3600 }
  )(organizationId)
}

// ── Buscar cliente por ID ─────────────────────────────────────────────────────

export async function getClientAction(clientId: string) {
  const { organizationId } = await requireSession()
  const tag = `client-${clientId}`
  return unstable_cache(
    async (cId: string, orgId: string) => {
      const [client] = await db
        .select()
        .from(clients)
        .where(and(eq(clients.id, cId), eq(clients.organizationId, orgId)))
        .limit(1)

      if (!client) return null

      const [anamnesis, history] = await Promise.all([
        db.select().from(clientAnamnesis).where(eq(clientAnamnesis.clientId, cId)).limit(1),
        db
          .select({
            id: appointments.id,
            date: appointments.date,
            startTime: appointments.startTime,
            endTime: appointments.endTime,
            procedure: appointments.procedure,
            status: appointments.status,
            notes: appointments.notes,
          })
          .from(appointments)
          .where(and(eq(appointments.clientId, cId), eq(appointments.organizationId, orgId)))
          .orderBy(desc(appointments.date), desc(appointments.startTime)),
      ])

      return { client, anamnesis: anamnesis[0] ?? null, history }
    },
    [tag],
    { tags: [tag], revalidate: 3600 }
  )(clientId, organizationId)
}

// ── Criar cliente ─────────────────────────────────────────────────────────────

export async function createClientAction(data: {
  name: string
  phone?: string
  whatsapp?: string
  email?: string
  cpf?: string
  birthDate?: string
  notes?: string
  anamnesis?: {
    hasAllergies: boolean
    allergiesDetail?: string
    hasContraindications: boolean
    contraindicationsDetail?: string
    usesMedication: boolean
    medicationDetail?: string
    hasChronicCondition: boolean
    chronicConditionDetail?: string
    isPregnant: boolean
    skinType?: string
    aestheticGoal?: string
    skinComplaints?: string
    previousProcedures?: string
    extraNotes?: string
  }
}): Promise<ActionResult & { clientId?: string }> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "clients:create")) {
    return { success: false, error: "Sem permissão para cadastrar clientes." }
  }

  const clientId = crypto.randomUUID()

  await db.transaction(async (tx) => {
    await tx.insert(clients).values({
      id: clientId,
      organizationId,
      name: data.name,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      cpf: data.cpf || null,
      birthDate: data.birthDate || null,
      notes: data.notes || null,
    })

    if (data.anamnesis) {
      await tx.insert(clientAnamnesis).values({
        clientId,
        ...data.anamnesis,
        allergiesDetail: data.anamnesis.allergiesDetail || null,
        contraindicationsDetail: data.anamnesis.contraindicationsDetail || null,
        medicationDetail: data.anamnesis.medicationDetail || null,
        chronicConditionDetail: data.anamnesis.chronicConditionDetail || null,
        skinType: data.anamnesis.skinType || null,
        aestheticGoal: data.anamnesis.aestheticGoal || null,
        skinComplaints: data.anamnesis.skinComplaints || null,
        previousProcedures: data.anamnesis.previousProcedures || null,
        extraNotes: data.anamnesis.extraNotes || null,
      })
    }
  })

  revalidateTag(`clients-${organizationId}`, {})
  revalidatePath("/clientes")
  return { success: true, clientId }
}

// ── Atualizar cliente ─────────────────────────────────────────────────────────

export async function updateClientAction(
  clientId: string,
  data: {
    name?: string
    phone?: string
    whatsapp?: string
    email?: string
    cpf?: string
    birthDate?: string
    notes?: string
  }
): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "clients:update")) {
    return { success: false, error: "Sem permissão." }
  }

  await db
    .update(clients)
    .set({ ...data, updatedAt: new Date() })
    .where(
      and(
        eq(clients.id, clientId),
        eq(clients.organizationId, organizationId)
      )
    )

  revalidateTag(`clients-${organizationId}`, {})
  revalidateTag(`client-${clientId}`, {})
  revalidatePath(`/clientes/${clientId}`)
  return { success: true }
}

// ── Atualizar anamnese ────────────────────────────────────────────────────────

export async function upsertAnamnesisAction(
  clientId: string,
  data: Partial<typeof clientAnamnesis.$inferInsert>
): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "clients:update")) {
    return { success: false, error: "Sem permissão." }
  }

  // Verifica se o cliente pertence à org
  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(
      and(
        eq(clients.id, clientId),
        eq(clients.organizationId, organizationId)
      )
    )
    .limit(1)

  if (!client) return { success: false, error: "Cliente não encontrado." }

  const [existing] = await db
    .select({ id: clientAnamnesis.id })
    .from(clientAnamnesis)
    .where(eq(clientAnamnesis.clientId, clientId))
    .limit(1)

  if (existing) {
    await db
      .update(clientAnamnesis)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientAnamnesis.clientId, clientId))
  } else {
    await db.insert(clientAnamnesis).values({ clientId, ...data })
  }

  revalidateTag(`client-${clientId}`, {})
  revalidatePath(`/clientes/${clientId}`)
  return { success: true }
}

// ── Atualizar consentimento de imagem ─────────────────────────────────────────

export async function updateImageConsentAction(clientId: string, consent: boolean | null) {
  const { organizationId } = await requireSession()

  const [existing] = await db
    .select({ id: clientAnamnesis.id })
    .from(clientAnamnesis)
    .where(eq(clientAnamnesis.clientId, clientId))
    .limit(1)

  const now = consent !== null ? new Date() : null

  if (existing) {
    await db
      .update(clientAnamnesis)
      .set({ imageConsent: consent, imageConsentAt: now, updatedAt: new Date() })
      .where(eq(clientAnamnesis.clientId, clientId))
  } else {
    await db.insert(clientAnamnesis).values({
      clientId,
      imageConsent: consent,
      imageConsentAt: now,
    })
  }

  revalidateTag(`client-${clientId}`, {})
  revalidatePath(`/clientes/${clientId}`)
}
