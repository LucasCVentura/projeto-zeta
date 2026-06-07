import { NextRequest, NextResponse } from "next/server"
import { verifyAnamnesisToken } from "@/lib/anamnesis-token"
import { db } from "@/db"
import { anamnesisQuestions, anamnesisAnswers, clients, organizations } from "@/db/schema"
import { eq, asc } from "drizzle-orm"
import { notifyOrganizationProfessionals } from "@/actions/notifications"
import { seedDefaultQuestionsForOrg } from "@/actions/anamnesis"

export async function GET(_: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const decoded = verifyAnamnesisToken(token)
  if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 400 })

  const { clientId, orgId } = decoded

  const [client, org, questions, answersRow] = await Promise.all([
    db.select({ name: clients.name }).from(clients).where(eq(clients.id, clientId)).limit(1),
    db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, orgId)).limit(1),
    db.select().from(anamnesisQuestions).where(eq(anamnesisQuestions.organizationId, orgId)).orderBy(asc(anamnesisQuestions.order)),
    db.select().from(anamnesisAnswers).where(eq(anamnesisAnswers.clientId, clientId)).limit(1),
  ])

  if (!client[0] || !org[0]) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  await seedDefaultQuestionsForOrg(orgId)

  return NextResponse.json({
    clientName: client[0].name,
    orgName: org[0].name,
    questions,
    answers: (answersRow[0]?.answers ?? {}) as Record<string, unknown>,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const decoded = verifyAnamnesisToken(token)
  if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 400 })

  const { clientId, orgId } = decoded
  const { answers } = await req.json()

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

  // Notifica profissionais no sininho
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
