"use server"

import { db } from "@/db"
import { anamnesisQuestions, anamnesisAnswers, organizations } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

// ── Perguntas padrão ──────────────────────────────────────────────────────────

const DEFAULT_QUESTIONS = [
  { label: "Tipo de pele", type: "select", options: JSON.stringify(["Normal", "Oleosa", "Seca", "Mista", "Sensível"]), order: 0 },
  { label: "Possui alergias?", type: "boolean", placeholder: "Ex: látex, penicilina...", order: 1 },
  { label: "Possui contraindicações?", type: "boolean", placeholder: "Ex: marca-passo, gestante...", order: 2 },
  { label: "Faz uso de medicamentos?", type: "boolean", placeholder: "Ex: anticoagulante, isotretinoína...", order: 3 },
  { label: "Possui doença crônica?", type: "boolean", placeholder: "Ex: diabetes, hipertensão...", order: 4 },
  { label: "Gestante?", type: "boolean", order: 5 },
  { label: "Objetivo estético", type: "text", placeholder: "Ex: reduzir manchas, uniformizar o tom...", order: 6 },
  { label: "Queixas da pele", type: "text", placeholder: "Ex: manchas, acne, oleosidade...", order: 7 },
  { label: "Procedimentos anteriores", type: "text", placeholder: "Ex: peeling, botox, microagulhamento...", order: 8 },
  { label: "Observações extras", type: "text", placeholder: "Informações adicionais...", order: 9 },
] as const

// ── Seed perguntas padrão para nova org ───────────────────────────────────────

export async function seedDefaultQuestionsForOrg(organizationId: string) {
  const existing = await db
    .select({ id: anamnesisQuestions.id })
    .from(anamnesisQuestions)
    .where(eq(anamnesisQuestions.organizationId, organizationId))
    .limit(1)

  if (existing.length > 0) return

  await db.insert(anamnesisQuestions).values(
    DEFAULT_QUESTIONS.map(q => ({
      organizationId,
      label: q.label,
      type: q.type,
      options: "options" in q ? q.options : null,
      placeholder: "placeholder" in q ? q.placeholder : null,
      order: q.order,
      required: false,
      isDefault: true,
    }))
  )
}

// ── Listar perguntas da org ───────────────────────────────────────────────────

export async function getAnamnesisQuestionsAction() {
  const { organizationId } = await requireSession()

  // Seed automático se ainda não tiver perguntas
  await seedDefaultQuestionsForOrg(organizationId)

  return db
    .select()
    .from(anamnesisQuestions)
    .where(eq(anamnesisQuestions.organizationId, organizationId))
    .orderBy(asc(anamnesisQuestions.order))
}

// ── Criar pergunta ────────────────────────────────────────────────────────────

export async function createAnamnesisQuestionAction(data: {
  label: string
  type: string
  options?: string | null
  placeholder?: string | null
  required?: boolean
}) {
  const { organizationId } = await requireSession()

  const existing = await db
    .select({ order: anamnesisQuestions.order })
    .from(anamnesisQuestions)
    .where(eq(anamnesisQuestions.organizationId, organizationId))
    .orderBy(asc(anamnesisQuestions.order))

  const maxOrder = existing.length > 0 ? Math.max(...existing.map(q => q.order)) + 1 : 0

  await db.insert(anamnesisQuestions).values({
    organizationId,
    label: data.label,
    type: data.type,
    options: data.options ?? null,
    placeholder: data.placeholder ?? null,
    required: data.required ?? false,
    order: maxOrder,
    isDefault: false,
  })

  revalidatePath("/configuracoes")
}

// ── Atualizar pergunta ────────────────────────────────────────────────────────

export async function updateAnamnesisQuestionAction(id: string, data: {
  label?: string
  placeholder?: string | null
  options?: string | null
  required?: boolean
}) {
  const { organizationId } = await requireSession()

  await db
    .update(anamnesisQuestions)
    .set(data)
    .where(eq(anamnesisQuestions.id, id))

  revalidatePath("/configuracoes")
  revalidatePath("/clientes")
}

// ── Reordenar perguntas ───────────────────────────────────────────────────────

export async function reorderAnamnesisQuestionsAction(orderedIds: string[]) {
  const { organizationId } = await requireSession()

  await Promise.all(
    orderedIds.map((id, index) =>
      db
        .update(anamnesisQuestions)
        .set({ order: index })
        .where(eq(anamnesisQuestions.id, id))
    )
  )

  revalidatePath("/configuracoes")
}

// ── Deletar pergunta ──────────────────────────────────────────────────────────

export async function deleteAnamnesisQuestionAction(id: string) {
  const { organizationId } = await requireSession()

  await db
    .delete(anamnesisQuestions)
    .where(eq(anamnesisQuestions.id, id))

  revalidatePath("/configuracoes")
}

// ── Buscar respostas de um cliente ────────────────────────────────────────────

export async function getAnamnesisAnswersAction(clientId: string) {
  const { organizationId } = await requireSession()

  await seedDefaultQuestionsForOrg(organizationId)

  const [questions, answersRow] = await Promise.all([
    db
      .select()
      .from(anamnesisQuestions)
      .where(eq(anamnesisQuestions.organizationId, organizationId))
      .orderBy(asc(anamnesisQuestions.order)),
    db
      .select()
      .from(anamnesisAnswers)
      .where(eq(anamnesisAnswers.clientId, clientId))
      .limit(1),
  ])

  const answers = (answersRow[0]?.answers ?? {}) as Record<string, unknown>
  return { questions, answers }
}

// ── Salvar respostas ──────────────────────────────────────────────────────────

export async function saveAnamnesisAnswersAction(
  clientId: string,
  answers: Record<string, unknown>
) {
  const { organizationId } = await requireSession()

  const existing = await db
    .select({ id: anamnesisAnswers.id })
    .from(anamnesisAnswers)
    .where(eq(anamnesisAnswers.clientId, clientId))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(anamnesisAnswers)
      .set({ answers, updatedAt: new Date() })
      .where(eq(anamnesisAnswers.clientId, clientId))
  } else {
    await db.insert(anamnesisAnswers).values({
      clientId,
      organizationId,
      answers,
    })
  }

  revalidatePath(`/clientes/${clientId}`)
}

// ── Texto do termo de autorização de imagem ───────────────────────────────────

export async function getImageConsentTextAction(): Promise<string> {
  const { organizationId } = await requireSession()
  const [org] = await db
    .select({ imageConsentText: organizations.imageConsentText })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)
  return org?.imageConsentText ?? ""
}

export async function saveImageConsentTextAction(text: string) {
  const { organizationId } = await requireSession()
  await db
    .update(organizations)
    .set({ imageConsentText: text.trim() || null })
    .where(eq(organizations.id, organizationId))
  revalidatePath("/configuracoes/anamnese")
}
