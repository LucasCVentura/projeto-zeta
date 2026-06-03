"use server"

import { db } from "@/db"
import {
  organizations, organizationMembers, users,
  appointments, clients, transactions, clientPhotos,
} from "@/db/schema"
import { eq, count, sum, gte, sql, or } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const ADMIN_EMAIL = "lucascv8525@gmail.com"

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard")
}

export async function getAdminMetricsAction() {
  await requireAdmin()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [
    totalOrgs,
    activeOrgs,
    trialingOrgs,
    incompleteBoletoOrgs,
    cancelledOrgs,
    newOrgsThisMonth,
    allOrgs,
  ] = await Promise.all([
    db.select({ count: count() }).from(organizations).then(r => r[0].count),
    db.select({ count: count() }).from(organizations).where(eq(organizations.subscriptionStatus, "active")).then(r => r[0].count),
    db.select({ count: count() }).from(organizations).where(or(eq(organizations.subscriptionStatus, "trialing"), eq(organizations.subscriptionStatus, "incomplete"))).then(r => r[0].count),
    db.select({ count: count() }).from(organizations).where(eq(organizations.subscriptionStatus, "incomplete")).then(r => r[0].count),
    db.select({ count: count() }).from(organizations).where(eq(organizations.subscriptionStatus, "canceled")).then(r => r[0].count),
    db.select({ count: count() }).from(organizations).where(gte(organizations.createdAt, startOfMonth)).then(r => r[0].count),
    db.select({
      id: organizations.id,
      name: organizations.name,
      slug: organizations.slug,
      subscriptionStatus: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt,
      createdAt: organizations.createdAt,
    }).from(organizations).orderBy(sql`${organizations.createdAt} desc`),
  ])

  // MRR: orgs ativas × R$49,90
  const mrr = activeOrgs * 4990
  // Net MRR após taxa Stripe: 3,99% + R$0,39 por cobrança (confirmado empiricamente)
  const stripeFeePerSub = Math.round(4990 * 0.0399) + 39
  const netMrr = activeOrgs * (4990 - stripeFeePerSub)

  // Novos no mês passado (para calcular crescimento)
  const newOrgsLastMonth = await db
    .select({ count: count() })
    .from(organizations)
    .where(gte(organizations.createdAt, startOfLastMonth))
    .then(r => r[0].count) - newOrgsThisMonth

  // Usage por org
  const orgIds = allOrgs.map(o => o.id)

  const [clientCounts, appointmentCounts, photoCounts, ownerMap] = await Promise.all([
    db.select({ orgId: clients.organizationId, count: count() })
      .from(clients).groupBy(clients.organizationId),
    db.select({ orgId: appointments.organizationId, count: count() })
      .from(appointments).groupBy(appointments.organizationId),
    db.select({ orgId: clientPhotos.organizationId, count: count() })
      .from(clientPhotos).groupBy(clientPhotos.organizationId),
    db.select({
      orgId: organizationMembers.organizationId,
      email: users.email,
      name: users.name,
    })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.role, "owner")),
  ])

  const clientMap = Object.fromEntries(clientCounts.map(r => [r.orgId, r.count]))
  const apptMap = Object.fromEntries(appointmentCounts.map(r => [r.orgId, r.count]))
  const photoMap = Object.fromEntries(photoCounts.map(r => [r.orgId, r.count]))
  const ownerByOrg = Object.fromEntries(ownerMap.map(r => [r.orgId, { email: r.email, name: r.name }]))

  const orgs = allOrgs.map(o => ({
    ...o,
    clients: clientMap[o.id] ?? 0,
    appointments: apptMap[o.id] ?? 0,
    photos: photoMap[o.id] ?? 0,
    owner: ownerByOrg[o.id] ?? null,
  }))

  return {
    totalOrgs,
    activeOrgs,
    trialingOrgs,
    incompleteBoletoOrgs,
    cancelledOrgs,
    newOrgsThisMonth,
    newOrgsLastMonth,
    mrr,
    netMrr,
    orgs,
  }
}

export async function extendTrialAction(orgId: string, days: number) {
  await requireAdmin()

  const [org] = await db
    .select({ trialEndsAt: organizations.trialEndsAt })
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1)

  const base = org?.trialEndsAt && org.trialEndsAt > new Date() ? org.trialEndsAt : new Date()
  const newDate = new Date(base)
  newDate.setDate(newDate.getDate() + days)

  await db
    .update(organizations)
    .set({ trialEndsAt: newDate, subscriptionStatus: "trialing" })
    .where(eq(organizations.id, orgId))

  revalidatePath("/admin")
}

export async function cancelOrgAction(orgId: string) {
  await requireAdmin()

  await db
    .update(organizations)
    .set({ subscriptionStatus: "canceled" })
    .where(eq(organizations.id, orgId))

  revalidatePath("/admin")
}

export async function setLifetimeAction(orgId: string) {
  await requireAdmin()

  await db
    .update(organizations)
    .set({ subscriptionStatus: "lifetime" })
    .where(eq(organizations.id, orgId))

  revalidatePath("/admin")
}

export async function getInboundEmailsAction() {
  await requireAdmin()
  const { inboundEmails } = await import("@/db/schema")
  const { desc } = await import("drizzle-orm")
  return db.select().from(inboundEmails).orderBy(desc(inboundEmails.receivedAt))
}

export type WhatsAppMessageLog = {
  id: string
  messageId: string | null
  organizationId: string | null
  organizationName: string | null
  destination: string | null
  templateId: string | null
  eventType: string
  error: string | null
  createdAt: Date
  updatedAt: Date
}

export async function getWhatsAppMessageLogsAction(limit = 200): Promise<WhatsAppMessageLog[]> {
  await requireAdmin()
  const rows = await db.execute(sql<WhatsAppMessageLog>`
    SELECT
      l.id,
      l.message_id as "messageId",
      l.organization_id as "organizationId",
      o.name as "organizationName",
      l.destination,
      l.template_id as "templateId",
      l.event_type as "eventType",
      l.error,
      l.created_at as "createdAt",
      l.updated_at as "updatedAt"
    FROM whatsapp_message_logs l
    LEFT JOIN organizations o ON o.id = l.organization_id
    ORDER BY l.updated_at DESC
    LIMIT ${limit}
  `)
  if (Array.isArray(rows)) return rows as WhatsAppMessageLog[]
  const withRows = rows as { rows?: WhatsAppMessageLog[] }
  return withRows.rows ?? []
}

export async function markInboundEmailReadAction(id: string) {
  await requireAdmin()
  const { inboundEmails } = await import("@/db/schema")
  const { eq } = await import("drizzle-orm")
  await db.update(inboundEmails).set({ read: true }).where(eq(inboundEmails.id, id))
}

export type AdminWhatsAppTemplateSetting = {
  bookingSummaryTemplateId: string | null
  packageSummaryTemplateId: string | null
  reminderConfirmationTemplateId: string | null
  postVisitTemplateId: string | null
}

export async function getWhatsAppTemplateSettingsAction(): Promise<AdminWhatsAppTemplateSetting> {
  await requireAdmin()
  try {
    const rows = await db.execute(sql<AdminWhatsAppTemplateSetting>`
      SELECT
        s.booking_summary_template_id as "bookingSummaryTemplateId"
        ,s.package_summary_template_id as "packageSummaryTemplateId"
        ,s.reminder_confirmation_template_id as "reminderConfirmationTemplateId"
        ,s.post_visit_template_id as "postVisitTemplateId"
      FROM whatsapp_system_template_settings s
      WHERE s.singleton_key = 'default'
      LIMIT 1
    `)
    const one = Array.isArray(rows) ? rows[0] : rows.rows?.[0]
    return {
      bookingSummaryTemplateId: one?.bookingSummaryTemplateId ?? null,
      packageSummaryTemplateId: one?.packageSummaryTemplateId ?? null,
      reminderConfirmationTemplateId: one?.reminderConfirmationTemplateId ?? null,
      postVisitTemplateId: one?.postVisitTemplateId ?? null,
    }
  } catch (err) {
    console.error("[Admin] Falha ao carregar config global de template WhatsApp:", err)
    return {
      bookingSummaryTemplateId: null,
      packageSummaryTemplateId: null,
      reminderConfirmationTemplateId: null,
      postVisitTemplateId: null,
    }
  }
}

export async function saveWhatsAppTemplateSettingAction(input: {
  bookingSummaryTemplateId: string
  packageSummaryTemplateId: string
  reminderConfirmationTemplateId: string
  postVisitTemplateId: string
}) {
  await requireAdmin()
  const bookingTemplateId = input.bookingSummaryTemplateId.trim() || null
  const packageTemplateId = input.packageSummaryTemplateId.trim() || null
  const reminderTemplateId = input.reminderConfirmationTemplateId.trim() || null
  const postVisitTemplateId = input.postVisitTemplateId.trim() || null
  await db.execute(sql`
    INSERT INTO whatsapp_system_template_settings (
      id, singleton_key, booking_summary_template_id, package_summary_template_id, reminder_confirmation_template_id, post_visit_template_id, created_at, updated_at
    )
    VALUES (
      ${crypto.randomUUID()},
      'default',
      ${bookingTemplateId},
      ${packageTemplateId},
      ${reminderTemplateId},
      ${postVisitTemplateId},
      now(),
      now()
    )
    ON CONFLICT (singleton_key) DO UPDATE SET
      booking_summary_template_id = EXCLUDED.booking_summary_template_id,
      package_summary_template_id = EXCLUDED.package_summary_template_id,
      reminder_confirmation_template_id = EXCLUDED.reminder_confirmation_template_id,
      post_visit_template_id = EXCLUDED.post_visit_template_id,
      updated_at = now()
  `)
  revalidatePath("/admin")
}

export async function adminChatAction(messages: { role: "user" | "assistant"; content: string }[], metricsContext: string) {
  await requireAdmin()

  const Groq = (await import("groq-sdk")).default
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

  const system = `Você é um consultor estratégico de growth e marketing para o Kira, um SaaS B2B de gestão de clínicas de estética no Brasil (esteticistas e biomédicos estetas).

Você tem acesso às métricas atuais da plataforma:
${metricsContext}

Seu papel é analisar esses dados e dar sugestões concretas e acionáveis de crescimento, focando principalmente em:
- Estratégias de marketing e divulgação (Instagram, TikTok, grupos de Facebook, comunidades de estética)
- Conversão de trials em pagantes
- Retenção e engajamento de clientes ativos
- Posicionamento e mensagem de venda

Seja direto, prático e específico para o nicho de estética no Brasil. Quando não tiver certeza de algo, pode pedir mais dados ao usuário.`

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: system },
      ...messages,
    ],
    temperature: 0.7,
    max_tokens: 1024,
  })

  return completion.choices[0].message.content ?? ""
}
