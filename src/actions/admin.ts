"use server"

import { db } from "@/db"
import {
  organizations, organizationMembers, users,
  appointments, clients, transactions, clientPhotos,
  adminChatMessages, chatSessions,
} from "@/db/schema"
import { eq, count, sum, gte, lt, sql, or, and, desc, asc, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const ADMIN_EMAIL = "lucascv8525@gmail.com"

async function requireAdmin() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard")
}

async function assertAdmin() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) throw new Error("UNAUTHORIZED")
}

export async function getAdminMetricsAction() {
  await assertAdmin()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalOrgsRows, activeOrgsRows, trialingOrgsRows, incompleteBoletoOrgsRows,
    cancelledOrgsRows, newOrgsThisMonthRows, newOrgsLastMonthRows,
    allOrgs, clientCounts, appointmentCounts, photoCounts, ownerMap,
  ] = await Promise.all([
    db.select({ count: count() }).from(organizations),
    db.select({ count: count() }).from(organizations).where(eq(organizations.subscriptionStatus, "active")),
    db.select({ count: count() }).from(organizations).where(or(eq(organizations.subscriptionStatus, "trialing"), eq(organizations.subscriptionStatus, "incomplete"))),
    db.select({ count: count() }).from(organizations).where(eq(organizations.subscriptionStatus, "incomplete")),
    db.select({ count: count() }).from(organizations).where(eq(organizations.subscriptionStatus, "canceled")),
    db.select({ count: count() }).from(organizations).where(gte(organizations.createdAt, startOfMonth)),
    db.select({ count: count() }).from(organizations).where(gte(organizations.createdAt, startOfLastMonth)),
    db.select({
      id: organizations.id, name: organizations.name, slug: organizations.slug,
      subscriptionStatus: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt, createdAt: organizations.createdAt,
    }).from(organizations).orderBy(sql`${organizations.createdAt} desc`),
    db.select({ orgId: clients.organizationId, count: count() }).from(clients).groupBy(clients.organizationId),
    db.select({ orgId: appointments.organizationId, count: count() }).from(appointments).groupBy(appointments.organizationId),
    db.select({ orgId: clientPhotos.organizationId, count: count() }).from(clientPhotos).groupBy(clientPhotos.organizationId),
    db.select({ orgId: organizationMembers.organizationId, email: users.email, name: users.name })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.role, "owner")),
  ])

  const totalOrgs = totalOrgsRows[0].count
  const activeOrgs = activeOrgsRows[0].count
  const mrr = activeOrgs * 4990
  const netMrr = activeOrgs * (4990 - Math.round(4990 * 0.0399) - 39)
  const newOrgsThisMonth = newOrgsThisMonthRows[0].count
  const clientMap = Object.fromEntries(clientCounts.map(r => [r.orgId, r.count]))
  const apptMap = Object.fromEntries(appointmentCounts.map(r => [r.orgId, r.count]))
  const photoMap = Object.fromEntries(photoCounts.map(r => [r.orgId, r.count]))
  const ownerByOrg = Object.fromEntries(ownerMap.map(r => [r.orgId, { email: r.email, name: r.name }]))

  return {
    totalOrgs,
    activeOrgs,
    trialingOrgs: trialingOrgsRows[0].count,
    incompleteBoletoOrgs: incompleteBoletoOrgsRows[0].count,
    cancelledOrgs: cancelledOrgsRows[0].count,
    newOrgsThisMonth,
    newOrgsLastMonth: newOrgsLastMonthRows[0].count - newOrgsThisMonth,
    mrr,
    netMrr,
    orgs: allOrgs.map(o => ({
      ...o,
      clients: clientMap[o.id] ?? 0,
      appointments: apptMap[o.id] ?? 0,
      photos: photoMap[o.id] ?? 0,
      owner: ownerByOrg[o.id] ?? null,
    })),
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

// ── Admin Chat ────────────────────────────────────────────────────────────────

export async function getAdminChatConversationsAction(showArchived = false) {
  await assertAdmin()

  // Última mensagem por número de telefone
  const rows = await db
    .select({
      phone: adminChatMessages.phone,
      senderName: adminChatMessages.senderName,
      lastMessage: adminChatMessages.content,
      lastDirection: adminChatMessages.direction,
      lastAt: adminChatMessages.createdAt,
    })
    .from(adminChatMessages)
    .orderBy(desc(adminChatMessages.createdAt))

  // Agrupa por phone mantendo a mais recente
  const seen = new Set<string>()
  const conversations: typeof rows = []
  for (const row of rows) {
    if (!seen.has(row.phone)) {
      seen.add(row.phone)
      conversations.push(row)
    }
  }

  // Conta não lidas por conversa
  const unreadRows = await db
    .select({ phone: adminChatMessages.phone, count: count() })
    .from(adminChatMessages)
    .where(and(eq(adminChatMessages.direction, "inbound"), isNull(adminChatMessages.readAt)))
    .groupBy(adminChatMessages.phone)

  const unreadMap = Object.fromEntries(unreadRows.map(r => [r.phone, r.count]))

  // Sessões para pegar fila, nome e estado de arquivamento
  const sessions = await db.select().from(chatSessions)
  const sessionMap = Object.fromEntries(sessions.map(s => [s.phone, s]))

  return conversations
    .map(c => {
      const session = sessionMap[c.phone]
      return {
        ...c,
        unread: unreadMap[c.phone] ?? 0,
        queue: session?.queue ?? null,
        userName: session?.userName ?? c.senderName ?? null,
        orgName: session?.orgName ?? null,
        archived: session?.archived ?? false,
      }
    })
    .filter(c => showArchived ? c.archived : !c.archived)
}

export async function archiveConversationAction(phone: string, archived: boolean) {
  await requireAdmin()

  await db
    .insert(chatSessions)
    .values({ phone, state: "routed", queue: null, archived, lastActivityAt: new Date() })
    .onConflictDoUpdate({
      target: chatSessions.phone,
      set: { archived, lastActivityAt: new Date() },
    })
}

export async function getAdminChatMessagesAction(phone: string) {
  await assertAdmin()

  const msgs = await db
    .select()
    .from(adminChatMessages)
    .where(eq(adminChatMessages.phone, phone))
    .orderBy(asc(adminChatMessages.createdAt))

  // Marca como lidas
  await db
    .update(adminChatMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(adminChatMessages.phone, phone),
        eq(adminChatMessages.direction, "inbound")
      )
    )

  return msgs
}

export async function sendAdminChatMessageAction(phone: string, content: string) {
  await requireAdmin()

  const { sendWhatsApp } = await import("@/lib/whatsapp-client")
  await sendWhatsApp(phone, content)

  await db.insert(adminChatMessages).values({
    phone,
    direction: "outbound",
    content,
  })

  // Marca sessão como roteada para que respostas cheguem direto ao admin sem passar pelo bot
  await db
    .insert(chatSessions)
    .values({ phone, state: "routed", queue: null, lastActivityAt: new Date() })
    .onConflictDoUpdate({
      target: chatSessions.phone,
      set: { state: "routed", queue: null, lastActivityAt: new Date() },
    })
}

export async function sendAdminChatTemplateAction(
  phone: string,
  name: string,
  templateId: string,
  options?: { content?: string; templateUsed?: string }
) {
  await requireAdmin()

  const { sendWhatsAppTemplate } = await import("@/lib/whatsapp-client")
  const firstName = name.split(" ")[0]
  const result = await sendWhatsAppTemplate(phone, templateId, [firstName])

  const content = options?.content ?? `Oi ${firstName}, tudo bem? 😊\n\nAqui é o Lucas, do Kira. Vi que você está testando o sistema e queria bater um papo rápido pra saber como está sendo sua experiência.\n\nTem alguma dúvida ou algo que posso te ajudar? Me conta!`

  await db.insert(adminChatMessages).values({
    phone,
    senderName: name,
    direction: "outbound",
    content,
    gupshupMessageId: result?.messageId ?? null,
    templateUsed: options?.templateUsed ?? "kira_trial_outreach",
  })

  // Marca sessão como roteada para que respostas cheguem direto ao admin sem passar pelo bot
  await db
    .insert(chatSessions)
    .values({ phone, state: "routed", queue: null, lastActivityAt: new Date() })
    .onConflictDoUpdate({
      target: chatSessions.phone,
      set: { state: "routed", queue: null, lastActivityAt: new Date() },
    })
}

export async function getTrialOrgsForChatAction() {
  await assertAdmin()

  const rows = await db
    .select({
      orgId: organizations.id,
      orgName: organizations.name,
      ownerName: users.name,
      ownerPhone: users.whatsapp,
      ownerPhoneFallback: users.phone,
      status: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt,
    })
    .from(organizations)
    .innerJoin(organizationMembers, and(
      eq(organizationMembers.organizationId, organizations.id),
      eq(organizationMembers.role, "owner")
    ))
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(or(
      eq(organizations.subscriptionStatus, "trialing"),
      eq(organizations.subscriptionStatus, "active"),
    ))
    .orderBy(desc(organizations.createdAt))

  return rows.map(r => ({
    ...r,
    phone: r.ownerPhone ?? r.ownerPhoneFallback ?? null,
  }))
}

export async function getExpiredTrialOrgsForChatAction() {
  await assertAdmin()

  const now = new Date()
  const rows = await db
    .select({
      orgId: organizations.id,
      orgName: organizations.name,
      ownerName: users.name,
      ownerPhone: users.whatsapp,
      ownerPhoneFallback: users.phone,
      status: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt,
    })
    .from(organizations)
    .innerJoin(organizationMembers, and(
      eq(organizationMembers.organizationId, organizations.id),
      eq(organizationMembers.role, "owner")
    ))
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(and(
      eq(organizations.subscriptionStatus, "trialing"),
      lt(organizations.trialEndsAt, now),
    ))
    .orderBy(desc(organizations.trialEndsAt))

  return rows.map(r => ({
    ...r,
    phone: r.ownerPhone ?? r.ownerPhoneFallback ?? null,
  }))
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
  await assertAdmin()
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

export type WhatsAppLogsParams = {
  page?: number
  pageSize?: number
  orgName?: string
  eventType?: string
  errorOnly?: boolean
  period?: "today" | "7d" | "30d" | "all"
}

export async function getWhatsAppMessageLogsAction(
  params: WhatsAppLogsParams = {}
): Promise<{ logs: WhatsAppMessageLog[]; total: number }> {
  await assertAdmin()
  const { page = 1, pageSize = 25, orgName, eventType, errorOnly, period = "7d" } = params
  const offset = (page - 1) * pageSize

  const periodFilter =
    period === "today" ? sql`AND l.updated_at >= now() - interval '1 day'` :
    period === "7d"    ? sql`AND l.updated_at >= now() - interval '7 days'` :
    period === "30d"   ? sql`AND l.updated_at >= now() - interval '30 days'` :
    sql``

  const orgFilter    = orgName    ? sql`AND o.name = ${orgName}`      : sql``
  const eventFilter  = eventType  ? sql`AND l.event_type = ${eventType}` : sql``
  const errorFilter  = errorOnly  ? sql`AND l.error IS NOT NULL`      : sql``

  const [dataRows, countRows] = await Promise.all([
    db.execute(sql`
      SELECT
        l.id,
        l.message_id     as "messageId",
        l.organization_id as "organizationId",
        o.name           as "organizationName",
        l.destination,
        l.template_id    as "templateId",
        l.event_type     as "eventType",
        l.error,
        l.created_at     as "createdAt",
        l.updated_at     as "updatedAt"
      FROM whatsapp_message_logs l
      LEFT JOIN organizations o ON o.id = l.organization_id
      WHERE 1=1
      ${periodFilter}
      ${orgFilter}
      ${eventFilter}
      ${errorFilter}
      ORDER BY l.updated_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `),
    db.execute(sql`
      SELECT count(*)::int as total
      FROM whatsapp_message_logs l
      LEFT JOIN organizations o ON o.id = l.organization_id
      WHERE 1=1
      ${periodFilter}
      ${orgFilter}
      ${eventFilter}
      ${errorFilter}
    `),
  ])

  const logs = (Array.isArray(dataRows) ? dataRows : (dataRows as { rows?: unknown[] }).rows ?? []) as WhatsAppMessageLog[]
  const countArr = (Array.isArray(countRows) ? countRows : (countRows as { rows?: unknown[] }).rows ?? []) as { total: number }[]
  const total = countArr[0]?.total ?? 0

  return { logs, total }
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
  trialOutreachTemplateId: string | null
  trialExpiredOutreachTemplateId: string | null
}

export async function getWhatsAppTemplateSettingsAction(): Promise<AdminWhatsAppTemplateSetting> {
  await assertAdmin()
  try {
    const rows = await db.execute(sql<AdminWhatsAppTemplateSetting>`
      SELECT
        s.booking_summary_template_id as "bookingSummaryTemplateId"
        ,s.package_summary_template_id as "packageSummaryTemplateId"
        ,s.reminder_confirmation_template_id as "reminderConfirmationTemplateId"
        ,s.post_visit_template_id as "postVisitTemplateId"
        ,s.trial_outreach_template_id as "trialOutreachTemplateId"
        ,s.trial_expired_outreach_template_id as "trialExpiredOutreachTemplateId"
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
      trialOutreachTemplateId: one?.trialOutreachTemplateId ?? null,
      trialExpiredOutreachTemplateId: one?.trialExpiredOutreachTemplateId ?? null,
    }
  } catch (err) {
    console.error("[Admin] Falha ao carregar config global de template WhatsApp:", err)
    return {
      bookingSummaryTemplateId: null,
      packageSummaryTemplateId: null,
      reminderConfirmationTemplateId: null,
      postVisitTemplateId: null,
      trialOutreachTemplateId: null,
      trialExpiredOutreachTemplateId: null,
    }
  }
}

export async function saveWhatsAppTemplateSettingAction(input: {
  bookingSummaryTemplateId: string
  packageSummaryTemplateId: string
  reminderConfirmationTemplateId: string
  postVisitTemplateId: string
  trialOutreachTemplateId: string
  trialExpiredOutreachTemplateId: string
}) {
  await requireAdmin()
  const bookingTemplateId = input.bookingSummaryTemplateId.trim() || null
  const packageTemplateId = input.packageSummaryTemplateId.trim() || null
  const reminderTemplateId = input.reminderConfirmationTemplateId.trim() || null
  const postVisitTemplateId = input.postVisitTemplateId.trim() || null
  const trialOutreachTemplateId = input.trialOutreachTemplateId.trim() || null
  const trialExpiredOutreachTemplateId = input.trialExpiredOutreachTemplateId.trim() || null
  await db.execute(sql`
    INSERT INTO whatsapp_system_template_settings (
      id, singleton_key, booking_summary_template_id, package_summary_template_id, reminder_confirmation_template_id, post_visit_template_id, trial_outreach_template_id, trial_expired_outreach_template_id, created_at, updated_at
    )
    VALUES (
      ${crypto.randomUUID()},
      'default',
      ${bookingTemplateId},
      ${packageTemplateId},
      ${reminderTemplateId},
      ${postVisitTemplateId},
      ${trialOutreachTemplateId},
      ${trialExpiredOutreachTemplateId},
      now(),
      now()
    )
    ON CONFLICT (singleton_key) DO UPDATE SET
      booking_summary_template_id = EXCLUDED.booking_summary_template_id,
      package_summary_template_id = EXCLUDED.package_summary_template_id,
      reminder_confirmation_template_id = EXCLUDED.reminder_confirmation_template_id,
      post_visit_template_id = EXCLUDED.post_visit_template_id,
      trial_outreach_template_id = EXCLUDED.trial_outreach_template_id,
      trial_expired_outreach_template_id = EXCLUDED.trial_expired_outreach_template_id,
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
