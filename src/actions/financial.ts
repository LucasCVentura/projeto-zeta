"use server"

import { db } from "@/db"
import { transactions, appointments, clientPackages, packages, supplies, procedureSupplies, procedures, users, organizationMembers, type PaymentMethod } from "@/db/schema"
import { eq, and, gte, lte, sum, sql, inArray } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { can } from "@/lib/permissions"
import { revalidatePath, revalidateTag } from "next/cache"
import type { ActionResult } from "./auth"

export async function completeAppointmentWithRevenueAction(data: {
  appointmentId: string
  amount: number // centavos
  description?: string
  date: string
  paymentMethod?: PaymentMethod | null
}): Promise<ActionResult> {
  const { userId, organizationId, role } = await requireSession()

  if (!can(role, "schedule:update")) {
    return { success: false, error: "Sem permissão." }
  }

  // Busca agendamento + commissionPct do procedimento
  const [appt] = await db
    .select({
      procedureId: appointments.procedureId,
      clientPackageId: appointments.clientPackageId,
      clientId: appointments.clientId,
      professionalId: appointments.professionalId,
      commissionPct: procedures.commissionPct,
    })
    .from(appointments)
    .leftJoin(procedures, eq(procedures.id, appointments.procedureId))
    .where(and(eq(appointments.id, data.appointmentId), eq(appointments.organizationId, organizationId)))

  // Profissional que realiza o atendimento (pode ser diferente de quem está logado)
  const performingProfessionalId = appt?.professionalId ?? userId

  // Calcula comissão para atendimentos avulsos
  let commissionAmount: number | null = null
  if (appt?.commissionPct && appt.commissionPct > 0 && !appt.clientPackageId) {
    commissionAmount = Math.round(data.amount * appt.commissionPct / 100)
  }

  // Para sessões de pacote: calcula comissão sobre o valor por sessão do pacote
  let packageCommissionAmount: number | null = null
  if (appt?.clientPackageId && appt.commissionPct && appt.commissionPct > 0) {
    const [pkg] = await db
      .select({ price: packages.price, totalSessions: packages.totalSessions })
      .from(clientPackages)
      .innerJoin(packages, eq(packages.id, clientPackages.packageId))
      .where(and(eq(clientPackages.id, appt.clientPackageId), eq(clientPackages.organizationId, organizationId)))
    if (pkg) {
      const perSession = Math.round(pkg.price / pkg.totalSessions)
      packageCommissionAmount = Math.round(perSession * appt.commissionPct / 100)
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(appointments)
      .set({ status: "completed", updatedAt: new Date() })
      .where(
        and(
          eq(appointments.id, data.appointmentId),
          eq(appointments.organizationId, organizationId)
        )
      )

    if (!appt?.clientPackageId) {
      // Atendimento avulso: registra receita bruta + comissão
      await tx.insert(transactions).values({
        organizationId,
        professionalId: performingProfessionalId,
        appointmentId: data.appointmentId,
        amount: data.amount,
        commissionAmount,
        description: data.description || null,
        date: data.date,
        paymentMethod: data.paymentMethod ?? null,
      })
    } else {
      // Sessão de pacote: receita já registrada na venda — cria transação zerada só para comissão
      await tx.insert(transactions).values({
        organizationId,
        professionalId: performingProfessionalId,
        appointmentId: data.appointmentId,
        clientPackageId: appt.clientPackageId,
        amount: 0,
        commissionAmount: packageCommissionAmount,
        description: data.description || null,
        date: data.date,
        paymentMethod: null,
      })

      await tx
        .update(clientPackages)
        .set({ sessionsUsed: sql`${clientPackages.sessionsUsed} + 1` })
        .where(
          and(
            eq(clientPackages.id, appt.clientPackageId),
            eq(clientPackages.organizationId, organizationId)
          )
        )
    }
  })

  // Baixa de estoque (fora da transação principal para não falhar tudo se não tiver insumos)
  if (appt?.procedureId) {
    const links = await db
      .select({
        supplyId: procedureSupplies.supplyId,
        quantityPerSession: procedureSupplies.quantityPerSession,
      })
      .from(procedureSupplies)
      .innerJoin(supplies, eq(supplies.id, procedureSupplies.supplyId))
      .where(
        and(
          eq(procedureSupplies.procedureId, appt.procedureId),
          eq(supplies.organizationId, organizationId)
        )
      )

    for (const link of links) {
      await db
        .update(supplies)
        .set({
          currentStock: sql`GREATEST(0, ${supplies.currentStock} - ${link.quantityPerSession})`,
          updatedAt: new Date(),
        })
        .where(eq(supplies.id, link.supplyId))
    }
  }

  revalidatePath("/agenda")
  revalidatePath("/dashboard")
  revalidatePath("/estoque")
  if (appt?.clientId) revalidateTag(`client-${appt.clientId}`)

  return { success: true }
}

export async function getMonthlyRevenueAction(year: number, month: number): Promise<number> {
  const { userId, organizationId } = await requireSession()

  const start = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, "0")}-${lastDay}`

  const [result] = await db
    .select({ total: sum(transactions.amount) })
    .from(transactions)
    .where(
      and(
        eq(transactions.organizationId, organizationId),
        eq(transactions.professionalId, userId),
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )

  return Number(result?.total ?? 0)
}

export async function getTransactionsAction(year: number, month: number) {
  const { userId, organizationId, role } = await requireSession()

  const isProfessional = role === "professional"
  const isOwnerOrFinancial = role === "owner" || role === "financial"

  const start = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, "0")}-${lastDay}`

  // Professional: só vê as próprias comissões (transações com amount>0 ou commissionAmount>0)
  // Owner/financial: vê todas as transações da org com nome do profissional
  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      commissionAmount: transactions.commissionAmount,
      description: transactions.description,
      date: transactions.date,
      paymentMethod: transactions.paymentMethod,
      appointmentId: transactions.appointmentId,
      professionalId: transactions.professionalId,
      professionalName: users.name,
      txClientPackageId: transactions.clientPackageId,
      procedureId: appointments.procedureId,
      apptClientPackageId: appointments.clientPackageId,
    })
    .from(transactions)
    .leftJoin(appointments, eq(appointments.id, transactions.appointmentId))
    .innerJoin(users, eq(users.id, transactions.professionalId))
    .where(
      and(
        eq(transactions.organizationId, organizationId),
        isProfessional ? eq(transactions.professionalId, userId) : undefined,
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )
    .orderBy(transactions.date)

  // Custo de insumos (só relevante para owner/financial)
  const packageCostMap = new Map<string, { cost: number; totalSessions: number }>()
  const supplyCostMap = new Map<string, number>()

  if (isOwnerOrFinancial) {
    const allClientPackageIds = [...new Set([
      ...rows.map((r) => r.txClientPackageId).filter(Boolean) as string[],
      ...rows.map((r) => r.apptClientPackageId).filter(Boolean) as string[],
    ])]

    if (allClientPackageIds.length > 0) {
      const pkgRows = await db
        .select({ clientPackageId: clientPackages.id, cost: packages.cost, totalSessions: packages.totalSessions })
        .from(clientPackages)
        .innerJoin(packages, eq(packages.id, clientPackages.packageId))
        .where(eq(clientPackages.organizationId, organizationId))
      for (const pr of pkgRows) {
        packageCostMap.set(pr.clientPackageId, { cost: pr.cost, totalSessions: pr.totalSessions })
      }
    }

    const standaloneProcedureIds = [...new Set(
      rows.filter((r) => !r.txClientPackageId && !r.apptClientPackageId).map((r) => r.procedureId).filter(Boolean) as string[]
    )]
    if (standaloneProcedureIds.length > 0) {
      const costRows = await db
        .select({ procedureId: procedureSupplies.procedureId, quantityPerSession: procedureSupplies.quantityPerSession, costPerUnit: supplies.costPerUnit })
        .from(procedureSupplies)
        .innerJoin(supplies, eq(supplies.id, procedureSupplies.supplyId))
        .where(eq(supplies.organizationId, organizationId))
      for (const cr of costRows) {
        const prev = supplyCostMap.get(cr.procedureId) ?? 0
        supplyCostMap.set(cr.procedureId, prev + Math.round(Number(cr.quantityPerSession) * cr.costPerUnit))
      }
    }
  }

  const enriched = rows.map((r) => {
    let cost = 0
    if (isOwnerOrFinancial) {
      if (r.txClientPackageId) {
        cost = packageCostMap.get(r.txClientPackageId)?.cost ?? 0
      } else if (r.apptClientPackageId) {
        const pkg = packageCostMap.get(r.apptClientPackageId)
        if (pkg?.cost && pkg.totalSessions > 0) cost = Math.round(pkg.cost / pkg.totalSessions)
      } else if (r.procedureId) {
        cost = supplyCostMap.get(r.procedureId) ?? 0
      }
    }
    return {
      id: r.id,
      amount: r.amount,
      commissionAmount: r.commissionAmount ?? null,
      description: r.description,
      date: r.date,
      appointmentId: r.appointmentId,
      paymentMethod: r.paymentMethod ?? null,
      professionalId: r.professionalId,
      professionalName: r.professionalName,
      cost,
    }
  })

  if (isProfessional) {
    // Profissional vê apenas total de comissões
    const totalCommission = enriched.reduce((acc, r) => acc + (r.commissionAmount ?? 0), 0)
    return { rows: enriched, total: totalCommission, totalCost: 0, isProfessional: true }
  }

  const total = enriched.reduce((acc, r) => acc + r.amount, 0)
  const totalCost = enriched.reduce((acc, r) => acc + r.cost, 0)
  const totalCommissions = enriched.reduce((acc, r) => acc + (r.commissionAmount ?? 0), 0)
  return { rows: enriched, total, totalCost, totalCommissions, isProfessional: false }
}

export async function getFinanceiroSummaryAction(year: number, month: number) {
  const { organizationId, role } = await requireSession()
  if (role !== "owner" && role !== "financial") return null

  const pad = (n: number) => String(n).padStart(2, "0")
  const start = `${year}-${pad(month)}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${pad(month)}-${lastDay}`

  // Mês anterior
  const prevDate = new Date(year, month - 2, 1)
  const pY = prevDate.getFullYear()
  const pM = prevDate.getMonth() + 1
  const prevStart = `${pY}-${pad(pM)}-01`
  const prevEnd = `${pY}-${pad(pM)}-${new Date(pY, pM, 0).getDate()}`

  // Início dos últimos 6 meses
  const hist6 = new Date(year, month - 7, 1)
  const histStart = `${hist6.getFullYear()}-${pad(hist6.getMonth() + 1)}-01`

  const getRows = (r: unknown): unknown[] =>
    Array.isArray(r) ? r : ((r as { rows?: unknown[] }).rows ?? [])

  const [prevRes, histRes, procRes, clientRes, projRes] = await Promise.all([
    db.execute(sql`
      SELECT COALESCE(SUM(amount), 0)::bigint as total
      FROM transactions
      WHERE organization_id = ${organizationId}
        AND date >= ${prevStart} AND date <= ${prevEnd}
    `),
    db.execute(sql`
      SELECT
        EXTRACT(YEAR  FROM date::date)::int as year,
        EXTRACT(MONTH FROM date::date)::int as month,
        COALESCE(SUM(amount), 0)::bigint    as total
      FROM transactions
      WHERE organization_id = ${organizationId}
        AND date >= ${histStart} AND date <= ${end}
      GROUP BY 1, 2
      ORDER BY 1, 2
    `),
    db.execute(sql`
      SELECT
        COALESCE(p.name, 'Sem procedimento') as name,
        COALESCE(SUM(t.amount), 0)::bigint   as total,
        COUNT(t.id)::int                      as count
      FROM transactions t
      LEFT JOIN appointments a  ON a.id  = t.appointment_id
      LEFT JOIN procedures   p  ON p.id  = a.procedure_id
      WHERE t.organization_id = ${organizationId}
        AND t.date >= ${start} AND t.date <= ${end}
        AND t.amount > 0
      GROUP BY p.name
      ORDER BY total DESC
      LIMIT 6
    `),
    db.execute(sql`
      SELECT
        c.name                               as name,
        COALESCE(SUM(t.amount), 0)::bigint   as total,
        COUNT(t.id)::int                     as count
      FROM transactions t
      JOIN appointments a ON a.id  = t.appointment_id
      JOIN clients      c ON c.id  = a.client_id
      WHERE t.organization_id = ${organizationId}
        AND t.date >= ${start} AND t.date <= ${end}
        AND t.amount > 0
      GROUP BY c.id, c.name
      ORDER BY total DESC
      LIMIT 5
    `),
    db.execute(sql`
      SELECT COALESCE(SUM(p.price), 0)::bigint as projected
      FROM appointments a
      JOIN procedures p ON p.id = a.procedure_id
      WHERE a.organization_id = ${organizationId}
        AND a.date >= ${start} AND a.date <= ${end}
        AND a.status IN ('waiting', 'confirmed')
        AND a.client_package_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM transactions t WHERE t.appointment_id = a.id
        )
    `),
  ])

  const prevTotal = Number((getRows(prevRes)[0] as { total?: string })?.total ?? 0)

  const rawHistory = getRows(histRes) as { year: number; month: number; total: string }[]
  const history: { year: number; month: number; total: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - 1 - i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const found = rawHistory.find((h) => Number(h.year) === y && Number(h.month) === m)
    history.push({ year: y, month: m, total: Number(found?.total ?? 0) })
  }

  const procedures = (getRows(procRes) as { name: string; total: string; count: string }[]).map(
    (r) => ({ name: r.name, total: Number(r.total), count: Number(r.count) })
  )

  const topClients = (getRows(clientRes) as { name: string; total: string; count: string }[]).map(
    (r) => ({ name: r.name, total: Number(r.total), count: Number(r.count) })
  )

  const projected = Number((getRows(projRes)[0] as { projected?: string })?.projected ?? 0)

  const teamRes = await db.execute(sql`
    SELECT COUNT(*)::int as count FROM organization_members WHERE organization_id = ${organizationId}
  `)
  const hasTeam = Number((getRows(teamRes)[0] as { count?: string })?.count ?? 1) > 1

  return { prevTotal, history, procedures, topClients, projected, hasTeam }
}
