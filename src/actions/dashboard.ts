"use server"

import { db } from "@/db"
import { appointments, clients, transactions } from "@/db/schema"
import { eq, and, gte, lte, sum, count, sql, isNotNull, lt, isNull } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { unstable_cache } from "next/cache"
import { todayBRT, nowBRT } from "@/lib/date"

export async function getDashboardDataAction() {
  const { userId, organizationId } = await requireSession()
  const tag = `dashboard-${userId}-${organizationId}`
  return unstable_cache(
    async (uId: string, orgId: string) => _fetchDashboard(uId, orgId),
    [tag],
    { tags: [tag], revalidate: 60 }
  )(userId, organizationId)
}

async function _fetchDashboard(userId: string, organizationId: string) {
  const today = todayBRT()
  const now = nowBRT()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`

  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const thirtyDaysAgoStr = thirtyDaysAgo.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })

  const weekEnd = new Date(now)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndStr = weekEnd.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })

  const [
    todayAppointments,
    totalClients,
    monthRevenue,
    upcomingToday,
    weekAppointments,
    lostClients,
    birthdays,
  ] = await Promise.all([
    // Agendamentos de hoje (não cancelados)
    db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.organizationId, organizationId),
          eq(appointments.professionalId, userId),
          eq(appointments.date, today),
          sql`${appointments.status} != 'cancelled'`
        )
      )
      .then((r) => r[0]?.count ?? 0),

    // Total de clientes
    db
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.organizationId, organizationId))
      .then((r) => r[0]?.count ?? 0),

    // Receita do mês
    db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          eq(transactions.organizationId, organizationId),
          eq(transactions.professionalId, userId),
          gte(transactions.date, monthStart),
          lte(transactions.date, monthEnd)
        )
      )
      .then((r) => Number(r[0]?.total ?? 0)),

    // Próximos atendimentos de hoje (waiting ou confirmed)
    db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        procedure: appointments.procedure,
        status: appointments.status,
        clientName: clients.name,
      })
      .from(appointments)
      .innerJoin(clients, eq(clients.id, appointments.clientId))
      .where(
        and(
          eq(appointments.organizationId, organizationId),
          eq(appointments.professionalId, userId),
          eq(appointments.date, today),
          sql`${appointments.status} IN ('waiting', 'confirmed')`
        )
      )
      .orderBy(appointments.startTime),

    // Próximos agendamentos da semana (excluindo hoje)
    db
      .select({
        id: appointments.id,
        date: appointments.date,
        startTime: appointments.startTime,
        procedure: appointments.procedure,
        status: appointments.status,
        clientName: clients.name,
      })
      .from(appointments)
      .innerJoin(clients, eq(clients.id, appointments.clientId))
      .where(
        and(
          eq(appointments.organizationId, organizationId),
          eq(appointments.professionalId, userId),
          gte(appointments.date, tomorrowStr),
          lte(appointments.date, weekEndStr),
          sql`${appointments.status} IN ('waiting', 'confirmed')`
        )
      )
      .orderBy(appointments.date, appointments.startTime)
      .limit(10),

    // Clientes sem retorno há 30+ dias
    db.execute<{ id: string; name: string; lastDate: string }>(sql`
      SELECT c.id, c.name,
        MAX(a.date) as "lastDate"
      FROM clients c
      LEFT JOIN appointments a ON a.client_id = c.id
        AND a.organization_id = ${organizationId}
        AND a.status != 'cancelled'
      WHERE c.organization_id = ${organizationId}
      GROUP BY c.id, c.name
      HAVING MAX(a.date) < ${thirtyDaysAgoStr} OR MAX(a.date) IS NULL
      ORDER BY MAX(a.date) ASC NULLS FIRST
      LIMIT 5
    `).then(r => Array.isArray(r) ? r : (r as any).rows ?? []),

    // Aniversariantes dos próximos 7 dias
    db.execute<{ id: string; name: string; birthDate: string }>(sql`
      SELECT id, name, birth_date as "birthDate"
      FROM clients
      WHERE organization_id = ${organizationId}
        AND birth_date IS NOT NULL
        AND to_char(birth_date::date, 'MM-DD') BETWEEN
          to_char(NOW() AT TIME ZONE 'America/Sao_Paulo', 'MM-DD') AND
          to_char((NOW() AT TIME ZONE 'America/Sao_Paulo' + interval '7 days'), 'MM-DD')
      ORDER BY to_char(birth_date::date, 'MM-DD')
      LIMIT 5
    `).then(r => Array.isArray(r) ? r : (r as any).rows ?? []),
  ])

  const confirmedToday = upcomingToday.filter((a) => a.status === "confirmed").length

  // Receita dos últimos 6 meses
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const sixMonthsAgoStr = sixMonthsAgo.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })

  const revenueByMonth = await db
    .select({
      month: sql<string>`to_char(${transactions.date}::date, 'YYYY-MM')`,
      total: sum(transactions.amount),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.organizationId, organizationId),
        eq(transactions.professionalId, userId),
        gte(transactions.date, sixMonthsAgoStr),
      )
    )
    .groupBy(sql`to_char(${transactions.date}::date, 'YYYY-MM')`)
    .orderBy(sql`to_char(${transactions.date}::date, 'YYYY-MM')`)

  // Preenche meses sem receita
  const monthLabels: { key: string; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    const label = d.toLocaleDateString("pt-BR", { month: "short" })
    monthLabels.push({ key, label })
  }
  const revenueChart = monthLabels.map(({ key, label }) => {
    const found = revenueByMonth.find((r) => r.month === key)
    return { month: label, total: Number(found?.total ?? 0) }
  })

  // Top 5 procedimentos
  const topProcedures = await db
    .select({
      procedure: appointments.procedure,
      count: count(),
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.professionalId, userId),
        isNotNull(appointments.procedure),
        sql`${appointments.status} != 'cancelled'`,
        gte(appointments.date, sixMonthsAgoStr),
      )
    )
    .groupBy(appointments.procedure)
    .orderBy(sql`count(*) desc`)
    .limit(5)
    .then((r) => r.map((row) => ({ name: row.procedure ?? "", count: Number(row.count) })))

  // Agendamentos por status no mês
  const statusCounts = await db
    .select({
      status: appointments.status,
      count: count(),
    })
    .from(appointments)
    .where(
      and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.professionalId, userId),
        gte(appointments.date, monthStart),
        lte(appointments.date, monthEnd),
      )
    )
    .groupBy(appointments.status)
    .then((r) => r.map((row) => ({ status: row.status, count: Number(row.count) })))

  const confirmationRate = Number(todayAppointments) > 0
    ? Math.round((confirmedToday / Number(todayAppointments)) * 100)
    : null

  return {
    todayCount: Number(todayAppointments),
    totalClients: Number(totalClients),
    confirmedToday,
    confirmationRate,
    monthRevenue,
    upcomingToday,
    weekAppointments: weekAppointments as Array<{ id: string; date: string; startTime: string; procedure: string | null; status: string; clientName: string }>,
    lostClients: lostClients as Array<{ id: string; name: string; lastDate: string | null }>,
    birthdays: birthdays as Array<{ id: string; name: string; birthDate: string }>,
    today,
    revenueChart,
    topProcedures,
    statusCounts,
  }
}
