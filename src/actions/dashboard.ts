"use server"

import { db } from "@/db"
import { appointments, clients, transactions } from "@/db/schema"
import { eq, and, gte, lte, sum, count, sql } from "drizzle-orm"
import { requireSession } from "@/lib/session"

export async function getDashboardDataAction() {
  const { userId, organizationId } = await requireSession()

  const today = new Date().toISOString().split("T")[0]
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`

  const [
    todayAppointments,
    totalClients,
    monthRevenue,
    upcomingToday,
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
  ])

  const confirmedToday = upcomingToday.filter((a) => a.status === "confirmed").length

  return {
    todayCount: Number(todayAppointments),
    totalClients: Number(totalClients),
    confirmedToday,
    monthRevenue,
    upcomingToday,
    today,
  }
}
