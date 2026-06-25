"use server"

import { db } from "@/db"
import { transactions, appointments, appointmentProcedures, clientPackages, packages, supplies, procedureSupplies, procedures, users, organizationMembers, type PaymentMethod } from "@/db/schema"
import { eq, and, gte, lte, sum, sql, inArray } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { can } from "@/lib/permissions"
import { revalidatePath, revalidateTag } from "next/cache"
import type { ActionResult } from "./auth"

export async function completeAppointmentWithRevenueAction(data: {
  appointmentId: string
  amount: number // centavos (total dos procedimentos avulsos)
  description?: string
  date: string
  paymentMethod?: PaymentMethod | null
}): Promise<ActionResult> {
  const { userId, organizationId, role } = await requireSession()

  if (!can(role, "schedule:update")) {
    return { success: false, error: "Sem permissão." }
  }

  const [appt] = await db
    .select({
      clientPackageId: appointments.clientPackageId,
      clientId: appointments.clientId,
      professionalId: appointments.professionalId,
    })
    .from(appointments)
    .where(and(eq(appointments.id, data.appointmentId), eq(appointments.organizationId, organizationId)))

  if (!appt) return { success: false, error: "Agendamento não encontrado." }

  // Procedimentos do atendimento (snapshots de preço/comissão na ordem de seleção)
  const procs = await db
    .select({
      procedureId: appointmentProcedures.procedureId,
      price: appointmentProcedures.price,
      commissionPct: appointmentProcedures.commissionPct,
    })
    .from(appointmentProcedures)
    .where(eq(appointmentProcedures.appointmentId, data.appointmentId))
    .orderBy(appointmentProcedures.position)

  // Profissional que realiza o atendimento (pode ser diferente de quem está logado)
  const performingProfessionalId = appt.professionalId ?? userId

  // Se há sessão de pacote, identifica qual procedimento ela cobre (procedimento do pacote)
  let coveredIndex = -1
  let packageCommissionAmount: number | null = null
  if (appt.clientPackageId) {
    const [pkg] = await db
      .select({ price: packages.price, totalSessions: packages.totalSessions, procedureId: packages.procedureId })
      .from(clientPackages)
      .innerJoin(packages, eq(packages.id, clientPackages.packageId))
      .where(and(eq(clientPackages.id, appt.clientPackageId), eq(clientPackages.organizationId, organizationId)))
    if (pkg) {
      coveredIndex = procs.findIndex((p) => p.procedureId === pkg.procedureId)
      const coveredProc = coveredIndex >= 0 ? procs[coveredIndex] : null
      if (coveredProc && coveredProc.commissionPct > 0 && pkg.totalSessions > 0) {
        const perSession = Math.round(pkg.price / pkg.totalSessions)
        packageCommissionAmount = Math.round(perSession * coveredProc.commissionPct / 100)
      }
    }
  }

  // Procedimentos avulsos = todos menos o coberto pelo pacote.
  // Comissão somada por procedimento, sobre o preço de tabela (snapshot) de cada um.
  const avulso = procs.filter((_, i) => i !== coveredIndex)
  const avulsoCommissionSum = avulso.reduce(
    (sum, p) => sum + Math.round(p.price * p.commissionPct / 100),
    0
  )
  const standaloneCommission = avulsoCommissionSum > 0 ? avulsoCommissionSum : null

  // Cria transação avulsa quando não é sessão de pacote, ou quando há procedimentos avulsos além do pacote.
  const createStandalone = !appt.clientPackageId || avulso.length > 0

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

    if (createStandalone) {
      await tx.insert(transactions).values({
        organizationId,
        professionalId: performingProfessionalId,
        appointmentId: data.appointmentId,
        amount: data.amount,
        commissionAmount: standaloneCommission,
        description: data.description || null,
        date: data.date,
        paymentMethod: data.paymentMethod ?? null,
      })
    }

    if (appt.clientPackageId) {
      // Sessão de pacote: receita já registrada na venda — transação zerada só para comissão
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

  // Baixa de estoque para TODOS os procedimentos do atendimento (fora da transação principal)
  const procedureIds = [...new Set(procs.map((p) => p.procedureId).filter((id): id is string => Boolean(id)))]
  if (procedureIds.length > 0) {
    const links = await db
      .select({
        supplyId: procedureSupplies.supplyId,
        quantityPerSession: procedureSupplies.quantityPerSession,
      })
      .from(procedureSupplies)
      .innerJoin(supplies, eq(supplies.id, procedureSupplies.supplyId))
      .where(
        and(
          inArray(procedureSupplies.procedureId, procedureIds),
          eq(supplies.organizationId, organizationId)
        )
      )

    // Soma a quantidade por insumo (um insumo pode aparecer em vários procedimentos)
    const perSupply = new Map<string, number>()
    for (const link of links) {
      perSupply.set(link.supplyId, (perSupply.get(link.supplyId) ?? 0) + Number(link.quantityPerSession))
    }

    for (const [supplyId, qty] of perSupply) {
      await db
        .update(supplies)
        .set({
          currentStock: sql`GREATEST(0, ${supplies.currentStock} - ${qty})`,
          updatedAt: new Date(),
        })
        .where(eq(supplies.id, supplyId))
    }
  }

  revalidatePath("/agenda")
  revalidatePath("/dashboard")
  revalidatePath("/estoque")
  if (appt.clientId) revalidateTag(`client-${appt.clientId}`, {})

  return { success: true }
}

// Dados estruturados para o modal de conclusão (procedimentos, pacote, comissão prevista, retorno)
export async function getAppointmentCompletionDataAction(appointmentId: string) {
  const { organizationId } = await requireSession()

  const [appt] = await db
    .select({ clientPackageId: appointments.clientPackageId })
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.organizationId, organizationId)))
    .limit(1)

  if (!appt) return null

  // Junção com procedures para metadados atuais (retorno)
  const rows = await db
    .select({
      procedureId: appointmentProcedures.procedureId,
      name: appointmentProcedures.name,
      price: appointmentProcedures.price,
      commissionPct: appointmentProcedures.commissionPct,
      hasReturn: procedures.hasReturn,
      returnIntervalDays: procedures.returnIntervalDays,
    })
    .from(appointmentProcedures)
    .leftJoin(procedures, eq(procedures.id, appointmentProcedures.procedureId))
    .where(eq(appointmentProcedures.appointmentId, appointmentId))
    .orderBy(appointmentProcedures.position)

  // Identifica o procedimento coberto pelo pacote (se houver)
  let coveredProcedureId: string | null = null
  let packageName: string | null = null
  if (appt.clientPackageId) {
    const [pkg] = await db
      .select({ procedureId: packages.procedureId, name: packages.name })
      .from(clientPackages)
      .innerJoin(packages, eq(packages.id, clientPackages.packageId))
      .where(and(eq(clientPackages.id, appt.clientPackageId), eq(clientPackages.organizationId, organizationId)))
      .limit(1)
    if (pkg) {
      coveredProcedureId = pkg.procedureId
      packageName = pkg.name
    }
  }

  let coveredMatched = false
  const procs = rows.map((r) => {
    const coveredByPackage = !coveredMatched && coveredProcedureId != null && r.procedureId === coveredProcedureId
    if (coveredByPackage) coveredMatched = true
    return {
      procedureId: r.procedureId,
      name: r.name,
      price: r.price,
      commissionPct: r.commissionPct,
      hasReturn: r.hasReturn ?? false,
      returnIntervalDays: r.returnIntervalDays ?? null,
      coveredByPackage,
    }
  })

  const avulso = procs.filter((p) => !p.coveredByPackage)
  const defaultAmount = avulso.reduce((sum, p) => sum + p.price, 0)
  const estimatedCommission = avulso.reduce((sum, p) => sum + Math.round(p.price * p.commissionPct / 100), 0)
  const firstReturn = procs.find((p) => p.hasReturn) ?? null

  return {
    procedures: procs,
    clientPackageId: appt.clientPackageId,
    packageName,
    defaultAmount,
    estimatedCommission,
    returnIntervalDays: firstReturn?.returnIntervalDays ?? null,
    returnProcedureName: firstReturn?.name ?? null,
    returnProcedureId: firstReturn?.procedureId ?? null,
  }
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
  const packageCostMap = new Map<string, { cost: number; totalSessions: number; procedureId: string }>()
  const supplyCostMap = new Map<string, number>()
  // Procedimentos (estruturados) por agendamento, para somar custo de insumos de todos
  const apptProcMap = new Map<string, string[]>()

  if (isOwnerOrFinancial) {
    const allClientPackageIds = [...new Set([
      ...rows.map((r) => r.txClientPackageId).filter(Boolean) as string[],
      ...rows.map((r) => r.apptClientPackageId).filter(Boolean) as string[],
    ])]

    if (allClientPackageIds.length > 0) {
      const pkgRows = await db
        .select({ clientPackageId: clientPackages.id, cost: packages.cost, totalSessions: packages.totalSessions, procedureId: packages.procedureId })
        .from(clientPackages)
        .innerJoin(packages, eq(packages.id, clientPackages.packageId))
        .where(eq(clientPackages.organizationId, organizationId))
      for (const pr of pkgRows) {
        packageCostMap.set(pr.clientPackageId, { cost: pr.cost, totalSessions: pr.totalSessions, procedureId: pr.procedureId })
      }
    }

    // custo de insumos por procedimento (toda a org)
    const costRows = await db
      .select({ procedureId: procedureSupplies.procedureId, quantityPerSession: procedureSupplies.quantityPerSession, costPerUnit: supplies.costPerUnit })
      .from(procedureSupplies)
      .innerJoin(supplies, eq(supplies.id, procedureSupplies.supplyId))
      .where(eq(supplies.organizationId, organizationId))
    for (const cr of costRows) {
      const prev = supplyCostMap.get(cr.procedureId) ?? 0
      supplyCostMap.set(cr.procedureId, prev + Math.round(Number(cr.quantityPerSession) * cr.costPerUnit))
    }

    // procedimentos por agendamento (junction)
    const apptIds = [...new Set(rows.map((r) => r.appointmentId).filter(Boolean) as string[])]
    if (apptIds.length > 0) {
      const apRows = await db
        .select({ appointmentId: appointmentProcedures.appointmentId, procedureId: appointmentProcedures.procedureId })
        .from(appointmentProcedures)
        .where(inArray(appointmentProcedures.appointmentId, apptIds))
      for (const ap of apRows) {
        if (!ap.procedureId) continue
        const list = apptProcMap.get(ap.appointmentId) ?? []
        list.push(ap.procedureId)
        apptProcMap.set(ap.appointmentId, list)
      }
    }
  }

  // Soma o custo de insumos dos procedimentos de um agendamento, podendo excluir um (o coberto por pacote)
  function sumApptSupplyCost(appointmentId: string | null, excludeProcedureId?: string | null) {
    if (!appointmentId) return 0
    const procIds = apptProcMap.get(appointmentId) ?? []
    let excluded = false
    return procIds.reduce((sum, pid) => {
      if (!excluded && excludeProcedureId && pid === excludeProcedureId) { excluded = true; return sum }
      return sum + (supplyCostMap.get(pid) ?? 0)
    }, 0)
  }

  const enriched = rows.map((r) => {
    let cost = 0
    if (isOwnerOrFinancial) {
      if (r.txClientPackageId) {
        cost = packageCostMap.get(r.txClientPackageId)?.cost ?? 0
      } else if (r.apptClientPackageId) {
        // Atendimento misto: transação avulsa soma o custo de insumos dos
        // procedimentos avulsos (excluindo o coberto pelo pacote)
        const excluded = packageCostMap.get(r.apptClientPackageId)?.procedureId ?? null
        cost = sumApptSupplyCost(r.appointmentId, excluded)
      } else {
        // Atendimento avulso: soma o custo de insumos de todos os procedimentos
        cost = sumApptSupplyCost(r.appointmentId)
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
        ap.name                            as name,
        COALESCE(SUM(ap.price), 0)::bigint as total,
        COUNT(ap.id)::int                  as count
      FROM transactions t
      JOIN appointment_procedures ap ON ap.appointment_id = t.appointment_id
      WHERE t.organization_id = ${organizationId}
        AND t.date >= ${start} AND t.date <= ${end}
        AND t.amount > 0
      GROUP BY ap.name
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
      SELECT COALESCE(SUM(ap.price), 0)::bigint as projected
      FROM appointments a
      JOIN appointment_procedures ap ON ap.appointment_id = a.id
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
