"use server"

import { db } from "@/db"
import {
  organizations, organizationMembers, users,
  appointments, clients, transactions, clientPhotos,
  adminChatMessages, chatSessions, procedures, packages, anamnesisAnswers,
  trialReactivationTokens, featureFlags, featureFlagOrgs,
} from "@/db/schema"
import { eq, count, sum, max, gte, lt, sql, or, and, desc, asc, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { nowBRT, todayBRT } from "@/lib/date"
import { syncFeatureRegistry, getFeatureRegistryEntry } from "@/lib/feature-flags"
import { requireAdmin, assertAdmin } from "@/lib/admin-guard"

export async function getAdminMetricsAction() {
  await assertAdmin()

  const nowBrt = nowBRT()
  const startOfMonth = new Date(nowBrt.getFullYear(), nowBrt.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(nowBrt.getFullYear(), nowBrt.getMonth() - 1, 1).toISOString()

  // 2 queries no total — evita saturar o pool de conexões do Supabase pgBouncer
  const [countsResult, orgsResult] = await Promise.all([
    db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM organizations)                                                              AS total_orgs,
        (SELECT COUNT(*)::int FROM organizations WHERE subscription_status = 'active')                        AS active_orgs,
        (SELECT COUNT(*)::int FROM organizations WHERE subscription_status IN ('trialing','incomplete'))      AS trialing_orgs,
        (SELECT COUNT(*)::int FROM organizations WHERE subscription_status = 'incomplete')                    AS incomplete_orgs,
        (SELECT COUNT(*)::int FROM organizations WHERE subscription_status = 'canceled')                      AS cancelled_orgs,
        (SELECT COUNT(*)::int FROM organizations WHERE created_at >= ${startOfMonth}::timestamptz)            AS new_this_month,
        (SELECT COUNT(*)::int FROM organizations WHERE created_at >= ${startOfLastMonth}::timestamptz)        AS new_last_month_total
    `),
    db.execute(sql`
      WITH
        client_counts   AS (SELECT organization_id, COUNT(*)::int AS cnt FROM clients GROUP BY organization_id),
        appt_counts     AS (SELECT organization_id, COUNT(*)::int AS cnt FROM appointments GROUP BY organization_id),
        photo_counts    AS (SELECT organization_id, COUNT(*)::int AS cnt FROM client_photos GROUP BY organization_id),
        revenue_totals  AS (SELECT organization_id, COALESCE(SUM(amount), 0)::bigint AS total FROM transactions GROUP BY organization_id),
        team_counts     AS (SELECT organization_id, COUNT(*)::int AS cnt FROM organization_members WHERE active = true GROUP BY organization_id),
        last_activity   AS (SELECT organization_id, MAX(date) AS last FROM appointments GROUP BY organization_id),
        owners          AS (
          SELECT om.organization_id, u.email AS owner_email, u.name AS owner_name
          FROM organization_members om
          JOIN users u ON u.id = om.user_id
          WHERE om.role = 'owner'
        )
      SELECT
        o.id, o.name, o.slug, o.subscription_status, o.trial_ends_at, o.created_at,
        COALESCE(c.cnt, 0)::int        AS clients,
        COALESCE(a.cnt, 0)::int        AS appointments,
        COALESCE(p.cnt, 0)::int        AS photos,
        COALESCE(r.total, 0)::bigint   AS revenue,
        COALESCE(t.cnt, 0)::int        AS team,
        la.last                        AS last_activity_at,
        own.owner_email,
        own.owner_name
      FROM organizations o
      LEFT JOIN client_counts  c   ON c.organization_id  = o.id
      LEFT JOIN appt_counts    a   ON a.organization_id  = o.id
      LEFT JOIN photo_counts   p   ON p.organization_id  = o.id
      LEFT JOIN revenue_totals r   ON r.organization_id  = o.id
      LEFT JOIN team_counts    t   ON t.organization_id  = o.id
      LEFT JOIN last_activity  la  ON la.organization_id = o.id
      LEFT JOIN owners         own ON own.organization_id = o.id
      ORDER BY o.created_at DESC
    `),
  ])

  const counts = (Array.isArray(countsResult) ? countsResult[0] : (countsResult as any).rows?.[0]) as any
  const orgsRaw = (Array.isArray(orgsResult) ? orgsResult : (orgsResult as any).rows ?? []) as any[]

  const totalOrgs   = Number(counts.total_orgs)
  const activeOrgs  = Number(counts.active_orgs)
  const newOrgsThisMonth = Number(counts.new_this_month)
  const mrr    = activeOrgs * 4990
  const netMrr = activeOrgs * (4990 - Math.round(4990 * 0.0399) - 39)

  return {
    totalOrgs,
    activeOrgs,
    trialingOrgs:         Number(counts.trialing_orgs),
    incompleteBoletoOrgs: Number(counts.incomplete_orgs),
    cancelledOrgs:        Number(counts.cancelled_orgs),
    newOrgsThisMonth,
    newOrgsLastMonth: Number(counts.new_last_month_total) - newOrgsThisMonth,
    mrr,
    netMrr,
    orgs: orgsRaw.map((o: any) => ({
      id:                 o.id,
      name:               o.name,
      slug:               o.slug,
      subscriptionStatus: o.subscription_status,
      trialEndsAt:        o.trial_ends_at,
      createdAt:          o.created_at,
      clients:            Number(o.clients),
      appointments:       Number(o.appointments),
      photos:             Number(o.photos),
      revenue:            Number(o.revenue),
      team:               Number(o.team),
      lastActivityAt:     o.last_activity_at ?? null,
      owner:              o.owner_email ? { email: o.owner_email, name: o.owner_name } : null,
    })),
  }
}

export async function getClinicDetailAction(orgId: string) {
  await assertAdmin()

  const nowBrt = nowBRT()
  const startOfMonth = new Date(nowBrt.getFullYear(), nowBrt.getMonth(), 1)
  const today = todayBRT()

  const [
    orgRow, ownerRow, teamRows,
    clientsTotalRow, recentClients,
    apptStatusRows, upcomingRow, recentAppts,
    photosRow, anamnesisRow, proceduresRow, packagesRow,
    revenueRow, monthRevenueRow, commissionRow, paymentRows,
    waTotalRow, waErrorRow,
  ] = await Promise.all([
    db.select({
      id: organizations.id, name: organizations.name, slug: organizations.slug,
      type: organizations.type, subscriptionStatus: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt, createdAt: organizations.createdAt,
      phone: organizations.phone, email: organizations.email,
      instagram: organizations.instagram, address: organizations.address,
    }).from(organizations).where(eq(organizations.id, orgId)).limit(1),
    db.select({ name: users.name, email: users.email })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(and(eq(organizationMembers.organizationId, orgId), eq(organizationMembers.role, "owner")))
      .limit(1),
    db.select({ name: users.name, role: organizationMembers.role, active: organizationMembers.active })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.organizationId, orgId)),
    db.select({ count: count() }).from(clients).where(eq(clients.organizationId, orgId)),
    db.select({ name: clients.name, createdAt: clients.createdAt })
      .from(clients).where(eq(clients.organizationId, orgId))
      .orderBy(desc(clients.createdAt)).limit(5),
    db.select({ status: appointments.status, count: count() })
      .from(appointments).where(eq(appointments.organizationId, orgId))
      .groupBy(appointments.status),
    db.select({ count: count() }).from(appointments)
      .where(and(eq(appointments.organizationId, orgId), gte(appointments.date, today))),
    db.select({
      date: appointments.date, startTime: appointments.startTime,
      clientName: clients.name, procedure: appointments.procedure, status: appointments.status,
    })
      .from(appointments)
      .innerJoin(clients, eq(clients.id, appointments.clientId))
      .where(eq(appointments.organizationId, orgId))
      .orderBy(desc(appointments.date), desc(appointments.startTime)).limit(6),
    db.select({ count: count() }).from(clientPhotos).where(eq(clientPhotos.organizationId, orgId)),
    db.select({ count: count() }).from(anamnesisAnswers).where(eq(anamnesisAnswers.organizationId, orgId)),
    db.select({ count: count() }).from(procedures).where(and(eq(procedures.organizationId, orgId), eq(procedures.active, true))),
    db.select({ count: count() }).from(packages).where(eq(packages.organizationId, orgId)),
    db.select({ total: sum(transactions.amount) }).from(transactions).where(eq(transactions.organizationId, orgId)),
    db.select({ total: sum(transactions.amount) }).from(transactions)
      .where(and(eq(transactions.organizationId, orgId), gte(transactions.date, startOfMonth.toISOString().slice(0, 10)))),
    db.select({ total: sum(transactions.commissionAmount) }).from(transactions).where(eq(transactions.organizationId, orgId)),
    db.select({ method: transactions.paymentMethod, total: sum(transactions.amount), count: count() })
      .from(transactions).where(eq(transactions.organizationId, orgId))
      .groupBy(transactions.paymentMethod),
    db.execute(sql`SELECT count(*)::int as total FROM whatsapp_message_logs WHERE organization_id = ${orgId}`),
    db.execute(sql`SELECT count(*)::int as total FROM whatsapp_message_logs WHERE organization_id = ${orgId} AND error IS NOT NULL`),
  ])

  if (!orgRow[0]) throw new Error("NOT_FOUND")

  const waRows = (Array.isArray(waTotalRow) ? waTotalRow : (waTotalRow as { rows?: unknown[] }).rows ?? []) as { total: number }[]
  const waErrRows = (Array.isArray(waErrorRow) ? waErrorRow : (waErrorRow as { rows?: unknown[] }).rows ?? []) as { total: number }[]

  const statusCounts: Record<string, number> = {}
  for (const r of apptStatusRows) statusCounts[r.status] = r.count
  const totalAppts = Object.values(statusCounts).reduce((a, b) => a + b, 0)
  const completed = statusCounts.completed ?? 0
  const missed = statusCounts.missed ?? 0
  const totalRevenue = Number(revenueRow[0]?.total ?? 0)

  return {
    org: orgRow[0],
    owner: ownerRow[0] ?? null,
    team: { total: teamRows.length, members: teamRows },
    clients: { total: clientsTotalRow[0].count, recent: recentClients },
    appointments: {
      total: totalAppts,
      byStatus: statusCounts,
      upcoming: upcomingRow[0].count,
      completionRate: totalAppts > 0 ? Math.round((completed / totalAppts) * 100) : 0,
      missRate: totalAppts > 0 ? Math.round((missed / totalAppts) * 100) : 0,
      recent: recentAppts,
    },
    photos: photosRow[0].count,
    anamnesisFilled: anamnesisRow[0].count,
    procedures: proceduresRow[0].count,
    packages: packagesRow[0].count,
    financial: {
      totalRevenue,
      monthRevenue: Number(monthRevenueRow[0]?.total ?? 0),
      commissions: Number(commissionRow[0]?.total ?? 0),
      avgTicket: completed > 0 ? Math.round(totalRevenue / completed) : 0,
      byPaymentMethod: paymentRows.map(r => ({ method: r.method, total: Number(r.total ?? 0), count: r.count })),
    },
    whatsapp: { sent: waRows[0]?.total ?? 0, errors: waErrRows[0]?.total ?? 0 },
  }
}

export type ClinicDetail = Awaited<ReturnType<typeof getClinicDetailAction>>

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

// ── Novas Features (launch control) ──────────────────────────────────────────
// Mecanismo genérico de rollout gradual: toda feature grande nova entra no
// registro (src/lib/feature-flags.ts, FEATURE_REGISTRY), liga-se org por org
// aqui no admin, e no final vira padrão pra todo mundo com um clique. O gatilho
// real (o que de fato bloqueia a feature) mora em isFeatureEnabled — isso aqui
// é só o painel de controle.

export async function getFeatureFlagsAction() {
  await assertAdmin()
  await syncFeatureRegistry()

  const rows = await db
    .select({
      id: featureFlags.id,
      key: featureFlags.key,
      label: featureFlags.label,
      description: featureFlags.description,
      enabledForAll: featureFlags.enabledForAll,
      enabledCount: sql<number>`count(${featureFlagOrgs.organizationId})`,
    })
    .from(featureFlags)
    .leftJoin(featureFlagOrgs, eq(featureFlagOrgs.featureFlagId, featureFlags.id))
    .groupBy(featureFlags.id)
    .orderBy(asc(featureFlags.createdAt))

  // changelogDraft mora no código (FEATURE_REGISTRY), não no banco — é copy
  // versionada junto do PR que traz a feature, não algo editável em runtime.
  return rows.map((r) => ({ ...r, changelogDraft: getFeatureRegistryEntry(r.key)?.changelogDraft ?? null }))
}

export async function getFeatureFlagOrgsAction(key: string) {
  await assertAdmin()

  const [feature] = await db.select({ id: featureFlags.id }).from(featureFlags).where(eq(featureFlags.key, key))
  if (!feature) return []

  const rows = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      ownerEmail: users.email,
      ownerName: users.name,
      enabled: sql<boolean>`(${featureFlagOrgs.organizationId} IS NOT NULL)`,
    })
    .from(organizations)
    .leftJoin(organizationMembers, and(eq(organizationMembers.organizationId, organizations.id), eq(organizationMembers.role, "owner")))
    .leftJoin(users, eq(users.id, organizationMembers.userId))
    .leftJoin(featureFlagOrgs, and(eq(featureFlagOrgs.organizationId, organizations.id), eq(featureFlagOrgs.featureFlagId, feature.id)))
    .orderBy(sql`(${featureFlagOrgs.organizationId} IS NOT NULL) DESC`, asc(organizations.name))

  return rows
}

export async function setFeatureFlagForOrgAction(key: string, orgId: string, enabled: boolean) {
  await requireAdmin()

  const [feature] = await db.select({ id: featureFlags.id }).from(featureFlags).where(eq(featureFlags.key, key))
  if (!feature) return

  if (enabled) {
    await db.insert(featureFlagOrgs).values({ featureFlagId: feature.id, organizationId: orgId }).onConflictDoNothing()
  } else {
    await db.delete(featureFlagOrgs).where(and(eq(featureFlagOrgs.featureFlagId, feature.id), eq(featureFlagOrgs.organizationId, orgId)))
  }

  revalidatePath("/admin")
}

export async function setFeatureFlagForAllAction(key: string, enabled: boolean) {
  await requireAdmin()

  await db.update(featureFlags).set({ enabledForAll: enabled, updatedAt: new Date() }).where(eq(featureFlags.key, key))

  revalidatePath("/admin")
}

// ── Admin Chat ────────────────────────────────────────────────────────────────

// Normaliza para "55XXXXXXXXXXX" — resolve divergência entre formato do webhook e digitação manual
function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  return digits.startsWith("55") ? digits : `55${digits}`
}

// Total de mensagens não lidas — pra badge no menu, sem carregar o histórico inteiro
export async function getAdminChatUnreadCountAction(): Promise<number> {
  await assertAdmin()

  const [row] = await db
    .select({ count: count() })
    .from(adminChatMessages)
    .where(and(eq(adminChatMessages.direction, "inbound"), isNull(adminChatMessages.readAt)))

  return row?.count ?? 0
}

export async function getAdminChatConversationsAction(showArchived = false) {
  await assertAdmin()

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

  // Agrupa por número normalizado mantendo a mensagem mais recente
  const seen = new Set<string>()
  const conversations: (typeof rows[0] & { normalizedPhone: string })[] = []
  for (const row of rows) {
    const key = normalizePhone(row.phone)
    if (!seen.has(key)) {
      seen.add(key)
      conversations.push({ ...row, normalizedPhone: key })
    }
  }

  const unreadRows = await db
    .select({ phone: adminChatMessages.phone, count: count() })
    .from(adminChatMessages)
    .where(and(eq(adminChatMessages.direction, "inbound"), isNull(adminChatMessages.readAt)))
    .groupBy(adminChatMessages.phone)

  // Unread agrupado por número normalizado
  const unreadMap: Record<string, number> = {}
  for (const r of unreadRows) {
    const key = normalizePhone(r.phone)
    unreadMap[key] = (unreadMap[key] ?? 0) + r.count
  }

  // Última mensagem INBOUND por número — define a janela de 24h de resposta livre do WhatsApp
  const lastInboundRows = await db
    .select({ phone: adminChatMessages.phone, lastInboundAt: max(adminChatMessages.createdAt) })
    .from(adminChatMessages)
    .where(eq(adminChatMessages.direction, "inbound"))
    .groupBy(adminChatMessages.phone)

  const lastInboundMap: Record<string, Date> = {}
  for (const r of lastInboundRows) {
    if (!r.lastInboundAt) continue
    const key = normalizePhone(r.phone)
    if (!lastInboundMap[key] || r.lastInboundAt > lastInboundMap[key]) lastInboundMap[key] = r.lastInboundAt
  }

  const sessions = await db.select().from(chatSessions)
  // Sessão lookup por número normalizado — garante match independente do formato salvo
  const sessionMap: Record<string, typeof sessions[0]> = {}
  for (const s of sessions) {
    const key = normalizePhone(s.phone)
    if (!sessionMap[key]) sessionMap[key] = s
    // Prefere a sessão com mais dados preenchidos
    else if (!sessionMap[key].userName && s.userName) sessionMap[key] = s
  }

  return conversations
    .map(c => {
      const session = sessionMap[c.normalizedPhone]
      return {
        phone: c.normalizedPhone,
        senderName: c.senderName,
        lastMessage: c.lastMessage,
        lastDirection: c.lastDirection,
        lastAt: c.lastAt,
        lastInboundAt: lastInboundMap[c.normalizedPhone] ?? null,
        unread: unreadMap[c.normalizedPhone] ?? 0,
        queue: session?.queue ?? null,
        userName: session?.userName ?? c.senderName ?? null,
        orgName: session?.orgName ?? null,
        archived: session?.archived ?? false,
      }
    })
    .filter(c => showArchived || !c.archived)
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

  // Normaliza o telefone recebido e compara pelos últimos 11 dígitos (sem código de país)
  // O banco tem formatos mistos: "(21) 99958-3894" e "5521999583894"
  const digitsOnly = phone.replace(/\D/g, "")

  const msgs = await db.execute(sql`
    SELECT * FROM admin_chat_messages
    WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 11) = RIGHT(${digitsOnly}, 11)
    ORDER BY created_at ASC
  `)

  const rawRows = (Array.isArray(msgs) ? msgs : (msgs as any).rows ?? []) as any[]

  await db.execute(sql`
    UPDATE admin_chat_messages
    SET read_at = NOW()
    WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 11) = RIGHT(${digitsOnly}, 11)
      AND direction = 'inbound'
      AND read_at IS NULL
  `)

  // Mapeia snake_case do banco para camelCase esperado pelo componente
  return rawRows.map((r: any) => ({
    id: r.id,
    phone: r.phone,
    senderName: r.sender_name ?? null,
    direction: r.direction,
    content: r.content,
    gupshupMessageId: r.gupshup_message_id ?? null,
    templateUsed: r.template_used ?? null,
    queue: r.queue ?? null,
    readAt: r.read_at ? new Date(r.read_at) : null,
    createdAt: new Date(r.created_at),
  }))
}

export async function sendAdminChatMessageAction(
  phone: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  const normalizedPhone = normalizePhone(phone)
  const { sendWhatsApp } = await import("@/lib/whatsapp-client")

  try {
    await sendWhatsApp(normalizedPhone, content)
  } catch (err) {
    console.error("[AdminChat] erro ao enviar mensagem", err)
    const message = err instanceof Error ? err.message : String(err)
    const windowClosed = /24|session|window/i.test(message)
    return {
      success: false,
      error: windowClosed
        ? "A janela de 24h do WhatsApp fechou — use um template pra reabrir a conversa."
        : "Não foi possível enviar. Tente de novo em instantes.",
    }
  }

  await db.insert(adminChatMessages).values({
    phone: normalizedPhone,
    direction: "outbound",
    content,
  })

  // Marca sessão como roteada para que respostas cheguem direto ao admin sem passar pelo bot
  await db
    .insert(chatSessions)
    .values({ phone: normalizedPhone, state: "routed", queue: null, lastActivityAt: new Date() })
    .onConflictDoUpdate({
      target: chatSessions.phone,
      set: { state: "routed", queue: null, lastActivityAt: new Date() },
    })

  return { success: true }
}

export async function sendAdminChatTemplateAction(
  phone: string,
  name: string,
  templateId: string,
  options?: { content?: string; templateUsed?: string; templateParams?: string[] }
) {
  await requireAdmin()

  const normalizedPhone = normalizePhone(phone)
  const { sendWhatsAppTemplate } = await import("@/lib/whatsapp-client")
  const params = options?.templateParams ?? [name]
  const result = await sendWhatsAppTemplate(normalizedPhone, templateId, params)

  const content = options?.content ?? `Oi ${name}, tudo bem? 😊\n\nAqui é o Lucas, do Kira. Vi que você está testando o sistema e queria bater um papo rápido pra saber como está sendo sua experiência.\n\nTem alguma dúvida ou algo que posso te ajudar? Me conta!`

  await db.insert(adminChatMessages).values({
    phone: normalizedPhone,
    senderName: name,
    direction: "outbound",
    content,
    gupshupMessageId: result?.messageId ?? null,
    templateUsed: options?.templateUsed ?? "kira_trial_outreach",
  })

  // Marca sessão como roteada para que respostas cheguem direto ao admin sem passar pelo bot
  await db
    .insert(chatSessions)
    .values({ phone: normalizedPhone, state: "routed", queue: null, lastActivityAt: new Date() })
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

export async function getActiveSubscribersForChatAction() {
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
    .where(eq(organizations.subscriptionStatus, "active"))
    .orderBy(desc(organizations.createdAt))

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
  testimonialOutreachTemplateId: string | null
  winbackOutreachTemplateId: string | null
  dailyAgendaTemplateId: string | null
  postVisitNoLinkTemplateId: string | null
  publicBookingRejectedTemplateId: string | null
  publicBookingManualRejectedTemplateId: string | null
  couponSendTemplateId: string | null
  giftVoucherSendTemplateId: string | null
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
        ,s.testimonial_outreach_template_id as "testimonialOutreachTemplateId"
        ,s.winback_outreach_template_id as "winbackOutreachTemplateId"
        ,s.daily_agenda_template_id as "dailyAgendaTemplateId"
        ,s.post_visit_no_link_template_id as "postVisitNoLinkTemplateId"
        ,s.public_booking_rejected_template_id as "publicBookingRejectedTemplateId"
        ,s.public_booking_manual_rejected_template_id as "publicBookingManualRejectedTemplateId"
        ,s.coupon_send_template_id as "couponSendTemplateId"
        ,s.gift_voucher_send_template_id as "giftVoucherSendTemplateId"
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
      testimonialOutreachTemplateId: one?.testimonialOutreachTemplateId ?? null,
      winbackOutreachTemplateId: one?.winbackOutreachTemplateId ?? null,
      dailyAgendaTemplateId: one?.dailyAgendaTemplateId ?? null,
      postVisitNoLinkTemplateId: one?.postVisitNoLinkTemplateId ?? null,
      publicBookingRejectedTemplateId: one?.publicBookingRejectedTemplateId ?? null,
      publicBookingManualRejectedTemplateId: one?.publicBookingManualRejectedTemplateId ?? null,
      couponSendTemplateId: one?.couponSendTemplateId ?? null,
      giftVoucherSendTemplateId: one?.giftVoucherSendTemplateId ?? null,
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
      testimonialOutreachTemplateId: null,
      winbackOutreachTemplateId: null,
      dailyAgendaTemplateId: null,
      postVisitNoLinkTemplateId: null,
      publicBookingRejectedTemplateId: null,
      publicBookingManualRejectedTemplateId: null,
      couponSendTemplateId: null,
      giftVoucherSendTemplateId: null,
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
  testimonialOutreachTemplateId: string
  winbackOutreachTemplateId: string
  dailyAgendaTemplateId: string
  postVisitNoLinkTemplateId: string
  publicBookingRejectedTemplateId: string
  publicBookingManualRejectedTemplateId: string
  couponSendTemplateId: string
  giftVoucherSendTemplateId: string
}) {
  await requireAdmin()
  const bookingTemplateId = input.bookingSummaryTemplateId.trim() || null
  const packageTemplateId = input.packageSummaryTemplateId.trim() || null
  const reminderTemplateId = input.reminderConfirmationTemplateId.trim() || null
  const postVisitTemplateId = input.postVisitTemplateId.trim() || null
  const trialOutreachTemplateId = input.trialOutreachTemplateId.trim() || null
  const trialExpiredOutreachTemplateId = input.trialExpiredOutreachTemplateId.trim() || null
  const testimonialOutreachTemplateId = input.testimonialOutreachTemplateId.trim() || null
  const winbackOutreachTemplateId = input.winbackOutreachTemplateId.trim() || null
  const dailyAgendaTemplateId = input.dailyAgendaTemplateId.trim() || null
  const postVisitNoLinkTemplateId = input.postVisitNoLinkTemplateId.trim() || null
  const publicBookingRejectedTemplateId = input.publicBookingRejectedTemplateId.trim() || null
  const publicBookingManualRejectedTemplateId = input.publicBookingManualRejectedTemplateId.trim() || null
  const couponSendTemplateId = input.couponSendTemplateId.trim() || null
  const giftVoucherSendTemplateId = input.giftVoucherSendTemplateId.trim() || null
  await db.execute(sql`
    INSERT INTO whatsapp_system_template_settings (
      id, singleton_key, booking_summary_template_id, package_summary_template_id, reminder_confirmation_template_id, post_visit_template_id, trial_outreach_template_id, trial_expired_outreach_template_id, testimonial_outreach_template_id, winback_outreach_template_id, daily_agenda_template_id, post_visit_no_link_template_id, public_booking_rejected_template_id, public_booking_manual_rejected_template_id, coupon_send_template_id, gift_voucher_send_template_id, created_at, updated_at
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
      ${testimonialOutreachTemplateId},
      ${winbackOutreachTemplateId},
      ${dailyAgendaTemplateId},
      ${postVisitNoLinkTemplateId},
      ${publicBookingRejectedTemplateId},
      ${publicBookingManualRejectedTemplateId},
      ${couponSendTemplateId},
      ${giftVoucherSendTemplateId},
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
      testimonial_outreach_template_id = EXCLUDED.testimonial_outreach_template_id,
      winback_outreach_template_id = EXCLUDED.winback_outreach_template_id,
      daily_agenda_template_id = EXCLUDED.daily_agenda_template_id,
      post_visit_no_link_template_id = EXCLUDED.post_visit_no_link_template_id,
      public_booking_rejected_template_id = EXCLUDED.public_booking_rejected_template_id,
      public_booking_manual_rejected_template_id = EXCLUDED.public_booking_manual_rejected_template_id,
      coupon_send_template_id = EXCLUDED.coupon_send_template_id,
      gift_voucher_send_template_id = EXCLUDED.gift_voucher_send_template_id,
      updated_at = now()
  `)
  revalidatePath("/admin")
}

export async function getWinbackOrgsForChatAction() {
  await assertAdmin()

  const now = new Date()
  const oneMonthAgo = new Date(now)
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

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
      lt(organizations.trialEndsAt, oneMonthAgo),
    ))
    .orderBy(desc(organizations.trialEndsAt))

  return rows.map(r => ({
    ...r,
    phone: r.ownerPhone ?? r.ownerPhoneFallback ?? null,
  }))
}

export async function generateReactivationTokenAction(orgId: string): Promise<string> {
  await assertAdmin()

  const token = crypto.randomUUID().replace(/-/g, "")
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await db.insert(trialReactivationTokens).values({
    token,
    organizationId: orgId,
    expiresAt,
  })

  return token
}

export async function reactivateTrialAction(token: string) {
  const now = new Date()

  const rows = await db
    .select()
    .from(trialReactivationTokens)
    .where(eq(trialReactivationTokens.token, token))
    .limit(1)

  const record = rows[0]
  if (!record) return { success: false, error: "Token inválido." }
  if (record.usedAt) return { success: false, error: "Este link já foi utilizado." }
  if (record.expiresAt < now) return { success: false, error: "Este link expirou." }

  const newTrialEnd = new Date(now)
  newTrialEnd.setDate(newTrialEnd.getDate() + 7)

  await db
    .update(organizations)
    .set({ subscriptionStatus: "trialing", trialEndsAt: newTrialEnd })
    .where(eq(organizations.id, record.organizationId))

  await db
    .update(trialReactivationTokens)
    .set({ usedAt: now })
    .where(eq(trialReactivationTokens.token, token))

  return { success: true }
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
