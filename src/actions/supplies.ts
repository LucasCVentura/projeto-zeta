"use server"

import { db } from "@/db"
import { supplies, procedureSupplies, procedures } from "@/db/schema"
import { eq, and, lte, sql } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "./auth"

// ── Insumos ───────────────────────────────────────────────────────────────────

export async function getSuppliesAction() {
  const { organizationId } = await requireSession()
  return db
    .select()
    .from(supplies)
    .where(eq(supplies.organizationId, organizationId))
    .orderBy(supplies.name)
}

export async function getLowStockSuppliesAction() {
  const { organizationId } = await requireSession()
  return db
    .select()
    .from(supplies)
    .where(
      and(
        eq(supplies.organizationId, organizationId),
        lte(supplies.currentStock, supplies.minStock)
      )
    )
}

export async function createSupplyAction(data: {
  name: string
  unit: string
  costPerUnit: number
  currentStock: number
  minStock: number
}): Promise<ActionResult> {
  const { organizationId } = await requireSession()
  await db.insert(supplies).values({
    organizationId,
    name: data.name,
    unit: data.unit,
    costPerUnit: data.costPerUnit,
    currentStock: String(data.currentStock),
    minStock: String(data.minStock),
  })
  revalidatePath("/estoque")
  return { success: true }
}

export async function updateSupplyAction(id: string, data: {
  name: string
  unit: string
  costPerUnit: number
  currentStock: number
  minStock: number
}): Promise<ActionResult> {
  const { organizationId } = await requireSession()
  await db
    .update(supplies)
    .set({
      name: data.name,
      unit: data.unit,
      costPerUnit: data.costPerUnit,
      currentStock: String(data.currentStock),
      minStock: String(data.minStock),
      updatedAt: new Date(),
    })
    .where(and(eq(supplies.id, id), eq(supplies.organizationId, organizationId)))
  revalidatePath("/estoque")
  return { success: true }
}

export async function deleteSupplyAction(id: string): Promise<ActionResult> {
  const { organizationId } = await requireSession()
  await db
    .delete(supplies)
    .where(and(eq(supplies.id, id), eq(supplies.organizationId, organizationId)))
  revalidatePath("/estoque")
  return { success: true }
}

// ── Insumos por procedimento ──────────────────────────────────────────────────

export async function getProcedureSuppliesAction(procedureId: string) {
  const { organizationId } = await requireSession()
  return db
    .select({
      id: procedureSupplies.id,
      supplyId: procedureSupplies.supplyId,
      supplyName: supplies.name,
      unit: supplies.unit,
      costPerUnit: supplies.costPerUnit,
      quantityPerSession: procedureSupplies.quantityPerSession,
    })
    .from(procedureSupplies)
    .innerJoin(supplies, eq(supplies.id, procedureSupplies.supplyId))
    .innerJoin(procedures, eq(procedures.id, procedureSupplies.procedureId))
    .where(
      and(
        eq(procedureSupplies.procedureId, procedureId),
        eq(supplies.organizationId, organizationId)
      )
    )
}

export async function addProcedureSupplyAction(data: {
  procedureId: string
  supplyId: string
  quantityPerSession: number
}): Promise<ActionResult> {
  await requireSession()
  await db.insert(procedureSupplies).values({
    procedureId: data.procedureId,
    supplyId: data.supplyId,
    quantityPerSession: String(data.quantityPerSession),
  })
  revalidatePath("/estoque")
  revalidatePath("/configuracoes/procedimentos")
  return { success: true }
}

export async function removeProcedureSupplyAction(id: string): Promise<ActionResult> {
  await requireSession()
  await db.delete(procedureSupplies).where(eq(procedureSupplies.id, id))
  revalidatePath("/estoque")
  return { success: true }
}

// Deducao de estoque ao finalizar agendamento — chamado internamente
export async function deductSuppliesForProcedureAction(
  procedureId: string,
  organizationId: string
): Promise<void> {
  const links = await db
    .select({
      supplyId: procedureSupplies.supplyId,
      quantityPerSession: procedureSupplies.quantityPerSession,
    })
    .from(procedureSupplies)
    .innerJoin(supplies, eq(supplies.id, procedureSupplies.supplyId))
    .where(
      and(
        eq(procedureSupplies.procedureId, procedureId),
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
