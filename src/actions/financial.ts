"use server"

import { db } from "@/db"
import { transactions, appointments, clientPackages, packages, supplies, procedureSupplies, clients, organizations, type PaymentMethod } from "@/db/schema"
import { eq, and, gte, lte, sum, sql } from "drizzle-orm"
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

  // Busca o agendamento para pegar procedureId, clientPackageId e clientId
  const [appt] = await db
    .select({
      procedureId: appointments.procedureId,
      clientPackageId: appointments.clientPackageId,
      clientId: appointments.clientId,
    })
    .from(appointments)
    .where(and(eq(appointments.id, data.appointmentId), eq(appointments.organizationId, organizationId)))

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

    // Pacotes pré-pagos: receita já registrada na venda — não criar nova transação
    if (!appt?.clientPackageId) {
      await tx.insert(transactions).values({
        organizationId,
        professionalId: userId,
        appointmentId: data.appointmentId,
        amount: data.amount,
        description: data.description || null,
        date: data.date,
        paymentMethod: data.paymentMethod ?? null,
      })
    }

    // Consumir sessão do pacote se vinculado
    if (appt?.clientPackageId) {
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
  const { userId, organizationId } = await requireSession()

  const start = `${year}-${String(month).padStart(2, "0")}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const end = `${year}-${String(month).padStart(2, "0")}-${lastDay}`

  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      description: transactions.description,
      date: transactions.date,
      paymentMethod: transactions.paymentMethod,
      appointmentId: transactions.appointmentId,
      txClientPackageId: transactions.clientPackageId,
      procedureId: appointments.procedureId,
      apptClientPackageId: appointments.clientPackageId,
    })
    .from(transactions)
    .leftJoin(appointments, eq(appointments.id, transactions.appointmentId))
    .where(
      and(
        eq(transactions.organizationId, organizationId),
        eq(transactions.professionalId, userId),
        gte(transactions.date, start),
        lte(transactions.date, end)
      )
    )
    .orderBy(transactions.date)

  // Collect all clientPackageIds: from package sale transactions (txClientPackageId)
  // and from appointment-linked transactions (apptClientPackageId)
  const allClientPackageIds = [...new Set([
    ...rows.map((r) => r.txClientPackageId).filter(Boolean) as string[],
    ...rows.map((r) => r.apptClientPackageId).filter(Boolean) as string[],
  ])]
  const packageCostMap = new Map<string, { cost: number; totalSessions: number }>()

  if (allClientPackageIds.length > 0) {
    const pkgRows = await db
      .select({
        clientPackageId: clientPackages.id,
        cost: packages.cost,
        totalSessions: packages.totalSessions,
      })
      .from(clientPackages)
      .innerJoin(packages, eq(packages.id, clientPackages.packageId))
      .where(eq(clientPackages.organizationId, organizationId))

    for (const pr of pkgRows) {
      packageCostMap.set(pr.clientPackageId, { cost: pr.cost, totalSessions: pr.totalSessions })
    }
  }

  // Fallback: procedure_supplies cost for standalone appointments
  const standaloneProcedureIds = [...new Set(
    rows.filter((r) => !r.txClientPackageId && !r.apptClientPackageId).map((r) => r.procedureId).filter(Boolean) as string[]
  )]
  const supplyCostMap = new Map<string, number>()

  if (standaloneProcedureIds.length > 0) {
    const costRows = await db
      .select({
        procedureId: procedureSupplies.procedureId,
        quantityPerSession: procedureSupplies.quantityPerSession,
        costPerUnit: supplies.costPerUnit,
      })
      .from(procedureSupplies)
      .innerJoin(supplies, eq(supplies.id, procedureSupplies.supplyId))
      .where(eq(supplies.organizationId, organizationId))

    for (const cr of costRows) {
      const prev = supplyCostMap.get(cr.procedureId) ?? 0
      supplyCostMap.set(cr.procedureId, prev + Math.round(Number(cr.quantityPerSession) * cr.costPerUnit))
    }
  }

  const enriched = rows.map((r) => {
    let cost = 0
    if (r.txClientPackageId) {
      // Package sale transaction: cost = total package supply cost
      const pkg = packageCostMap.get(r.txClientPackageId)
      cost = pkg?.cost ?? 0
    } else if (r.apptClientPackageId) {
      // Package session completion: cost = per-session supply cost
      const pkg = packageCostMap.get(r.apptClientPackageId)
      if (pkg && pkg.cost > 0 && pkg.totalSessions > 0) {
        cost = Math.round(pkg.cost / pkg.totalSessions)
      }
    } else if (r.procedureId) {
      cost = supplyCostMap.get(r.procedureId) ?? 0
    }
    return { id: r.id, amount: r.amount, description: r.description, date: r.date, appointmentId: r.appointmentId, paymentMethod: r.paymentMethod ?? null, cost }
  })

  const total = enriched.reduce((acc, r) => acc + r.amount, 0)
  const totalCost = enriched.reduce((acc, r) => acc + r.cost, 0)
  return { rows: enriched, total, totalCost }
}
