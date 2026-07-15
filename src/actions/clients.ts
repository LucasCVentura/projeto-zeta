"use server"

import { db } from "@/db"
import { clients, clientAnamnesis, appointments, anamnesisQuestions, anamnesisAnswers } from "@/db/schema"
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

      const [anamnesis, anamnesisQuestionsList, anamnesisAnswersRow, history] = await Promise.all([
        // Só o consentimento de imagem (legado) ainda vem daqui — respostas da ficha em si vêm de anamnesis_answers abaixo
        db.select().from(clientAnamnesis).where(eq(clientAnamnesis.clientId, cId)).limit(1),
        db.select().from(anamnesisQuestions).where(eq(anamnesisQuestions.organizationId, orgId)).orderBy(asc(anamnesisQuestions.order)),
        db.select().from(anamnesisAnswers).where(eq(anamnesisAnswers.clientId, cId)).limit(1),
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

      return {
        client,
        anamnesis: anamnesis[0] ?? null,
        anamnesisQuestions: anamnesisQuestionsList,
        anamnesisAnswers: (anamnesisAnswersRow[0]?.answers ?? {}) as Record<string, unknown>,
        history,
      }
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
}): Promise<ActionResult & { clientId?: string }> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "clients:create")) {
    return { success: false, error: "Sem permissão para cadastrar clientes." }
  }

  const clientId = crypto.randomUUID()

  await db.insert(clients).values({
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

// ── Excluir cliente ───────────────────────────────────────────────────────────

export async function deleteClientAction(clientId: string): Promise<ActionResult> {
  const { organizationId } = await requireSession()

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)))
    .limit(1)

  if (!existing) return { success: false, error: "Cliente não encontrado." }

  // appointments.clientId é restrict — precisa apagar antes
  await db.delete(appointments).where(
    and(eq(appointments.clientId, clientId), eq(appointments.organizationId, organizationId))
  )

  // cascade cuida de: anamnese, fotos, pacotes, consentimentos, etc.
  await db.delete(clients).where(
    and(eq(clients.id, clientId), eq(clients.organizationId, organizationId))
  )

  revalidatePath("/clientes")
  return { success: true }
}
