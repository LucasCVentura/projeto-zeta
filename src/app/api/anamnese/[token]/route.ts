import { NextRequest, NextResponse } from "next/server"
import { verifyAnamnesisToken } from "@/lib/anamnesis-token"
import { db } from "@/db"
import { anamnesisQuestions, anamnesisAnswers, clientAnamnesis, clients, organizations, consentTerms, consentTermRecords } from "@/db/schema"
import { eq, asc, and } from "drizzle-orm"
import { notifyOrganizationProfessionals } from "@/actions/notifications"
import { seedDefaultQuestionsForOrg } from "@/actions/anamnesis"

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const decoded = verifyAnamnesisToken(token)
  if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 400 })

  const { clientId, orgId } = decoded

  const [client, org, questions, answersRow, terms, existingRecords] = await Promise.all([
    db.select({ name: clients.name }).from(clients).where(eq(clients.id, clientId)).limit(1),
    db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, orgId)).limit(1),
    db.select().from(anamnesisQuestions).where(eq(anamnesisQuestions.organizationId, orgId)).orderBy(asc(anamnesisQuestions.order)),
    db.select().from(anamnesisAnswers).where(eq(anamnesisAnswers.clientId, clientId)).limit(1),
    db.select().from(consentTerms)
      .where(and(eq(consentTerms.orgId, orgId), eq(consentTerms.active, true)))
      .orderBy(asc(consentTerms.displayOrder), asc(consentTerms.createdAt)),
    db.select().from(consentTermRecords)
      .where(and(eq(consentTermRecords.clientId, clientId), eq(consentTermRecords.orgId, orgId))),
  ])

  if (!client[0] || !org[0]) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  await seedDefaultQuestionsForOrg(orgId)

  const recordMap = Object.fromEntries(existingRecords.map(r => [r.termId, r.accepted]))

  return NextResponse.json({
    clientName: client[0].name,
    orgName: org[0].name,
    questions,
    answers: (answersRow[0]?.answers ?? {}) as Record<string, unknown>,
    terms: terms.map(t => ({
      id: t.id,
      title: t.title,
      body: t.body,
      accepted: recordMap[t.id] ?? null,
    })),
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const decoded = verifyAnamnesisToken(token)
  if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 400 })

  const { clientId, orgId } = decoded
  const body = await req.json()
  const { answers, consentResponses, imageConsent } = body
  // consentResponses: Record<termId, boolean>

  const existing = await db.select({ id: anamnesisAnswers.id }).from(anamnesisAnswers)
    .where(eq(anamnesisAnswers.clientId, clientId)).limit(1)

  const isFirstTime = existing.length === 0

  if (!isFirstTime) {
    await db.update(anamnesisAnswers)
      .set({ answers, updatedAt: new Date() })
      .where(eq(anamnesisAnswers.clientId, clientId))
  } else {
    await db.insert(anamnesisAnswers).values({ clientId, organizationId: orgId, answers })
  }

  // Salva respostas dos termos de consentimento
  if (consentResponses && typeof consentResponses === "object") {
    for (const [termId, accepted] of Object.entries(consentResponses)) {
      if (typeof accepted !== "boolean") continue
      await db
        .insert(consentTermRecords)
        .values({ clientId, orgId, termId, accepted, respondedAt: new Date() })
        .onConflictDoUpdate({
          target: [consentTermRecords.clientId, consentTermRecords.termId],
          set: { accepted, respondedAt: new Date() },
        })
    }
  }

  if (typeof imageConsent === "boolean") {
    const [existingAnamnesis] = await db
      .select({ id: clientAnamnesis.id })
      .from(clientAnamnesis)
      .where(eq(clientAnamnesis.clientId, clientId))
      .limit(1)

    if (existingAnamnesis) {
      await db.update(clientAnamnesis)
        .set({ imageConsent, imageConsentAt: new Date(), updatedAt: new Date() })
        .where(eq(clientAnamnesis.clientId, clientId))
    } else {
      await db.insert(clientAnamnesis).values({ clientId, imageConsent, imageConsentAt: new Date() })
    }
  }

  const [client] = await db.select({ name: clients.name }).from(clients).where(eq(clients.id, clientId)).limit(1)
  const clientName = client?.name ?? "Cliente"

  await notifyOrganizationProfessionals({
    organizationId: orgId,
    type: "anamnesis_filled",
    title: `${clientName} preencheu a ficha de anamnese`,
    body: isFirstTime
      ? `${clientName} preencheu a ficha pela primeira vez.`
      : `${clientName} atualizou a ficha de anamnese.`,
    href: `/clientes/${clientId}/anamnese`,
  })

  return NextResponse.json({ ok: true })
}
