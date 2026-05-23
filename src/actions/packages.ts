"use server"

import { db } from "@/db"
import { packages, clientPackages, procedures } from "@/db/schema"
import { eq, and, lt, sql } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "./auth"

// ── Pacotes (catálogo) ────────────────────────────────────────────────────────

export async function getPackagesAction() {
  const { organizationId } = await requireSession()
  return db
    .select({
      id: packages.id,
      name: packages.name,
      description: packages.description,
      totalSessions: packages.totalSessions,
      price: packages.price,
      cost: packages.cost,
      active: packages.active,
      procedureId: packages.procedureId,
      procedureName: procedures.name,
    })
    .from(packages)
    .innerJoin(procedures, eq(procedures.id, packages.procedureId))
    .where(eq(packages.organizationId, organizationId))
    .orderBy(packages.name)
}

export async function createPackageAction(data: {
  name: string
  description?: string
  procedureId: string
  totalSessions: number
  price: number
  cost?: number
}): Promise<ActionResult> {
  const { organizationId } = await requireSession()
  await db.insert(packages).values({
    organizationId,
    procedureId: data.procedureId,
    name: data.name,
    description: data.description || null,
    totalSessions: data.totalSessions,
    price: data.price,
    cost: data.cost ?? 0,
  })
  revalidatePath("/configuracoes/pacotes")
  return { success: true }
}

export async function updatePackageAction(id: string, data: {
  name: string
  description?: string
  totalSessions: number
  price: number
  cost?: number
  active: boolean
}): Promise<ActionResult> {
  const { organizationId } = await requireSession()
  await db
    .update(packages)
    .set({ ...data, cost: data.cost ?? 0, description: data.description || null, updatedAt: new Date() })
    .where(and(eq(packages.id, id), eq(packages.organizationId, organizationId)))
  revalidatePath("/configuracoes/pacotes")
  return { success: true }
}

export async function deletePackageAction(id: string): Promise<ActionResult> {
  const { organizationId } = await requireSession()
  await db
    .delete(packages)
    .where(and(eq(packages.id, id), eq(packages.organizationId, organizationId)))
  revalidatePath("/configuracoes/pacotes")
  return { success: true }
}

// ── Pacotes do cliente ────────────────────────────────────────────────────────

export async function getClientPackagesAction(clientId: string) {
  const { organizationId } = await requireSession()
  const rows = await db
    .select({
      id: clientPackages.id,
      clientId: clientPackages.clientId,
      packageId: clientPackages.packageId,
      sessionsUsed: clientPackages.sessionsUsed,
      purchasedAt: clientPackages.purchasedAt,
      packageName: packages.name,
      totalSessions: packages.totalSessions,
      price: packages.price,
      procedureId: packages.procedureId,
      procedureName: procedures.name,
    })
    .from(clientPackages)
    .innerJoin(packages, eq(packages.id, clientPackages.packageId))
    .innerJoin(procedures, eq(procedures.id, packages.procedureId))
    .where(
      and(
        eq(clientPackages.clientId, clientId),
        eq(clientPackages.organizationId, organizationId)
      )
    )
    .orderBy(clientPackages.purchasedAt)

  return rows.map((r) => ({
    ...r,
    sessionsRemaining: r.totalSessions - r.sessionsUsed,
    isActive: r.sessionsUsed < r.totalSessions,
  }))
}

// Pacotes ativos para um cliente + procedimento específico (usado no agendamento)
export async function getActiveClientPackagesForProcedureAction(
  clientId: string,
  procedureId: string
) {
  const { organizationId } = await requireSession()
  const rows = await db
    .select({
      id: clientPackages.id,
      sessionsUsed: clientPackages.sessionsUsed,
      packageName: packages.name,
      totalSessions: packages.totalSessions,
    })
    .from(clientPackages)
    .innerJoin(packages, eq(packages.id, clientPackages.packageId))
    .where(
      and(
        eq(clientPackages.clientId, clientId),
        eq(clientPackages.organizationId, organizationId),
        eq(packages.procedureId, procedureId),
        lt(clientPackages.sessionsUsed, packages.totalSessions)
      )
    )

  return rows.map((r) => ({
    ...r,
    sessionsRemaining: r.totalSessions - r.sessionsUsed,
  }))
}

export async function assignPackageToClientAction(data: {
  clientId: string
  packageId: string
  purchasedAt: string
}): Promise<ActionResult> {
  const { organizationId } = await requireSession()
  await db.insert(clientPackages).values({
    organizationId,
    clientId: data.clientId,
    packageId: data.packageId,
    purchasedAt: data.purchasedAt,
    sessionsUsed: 0,
  })
  revalidatePath(`/clientes/${data.clientId}`)
  return { success: true }
}

export async function consumePackageSessionAction(clientPackageId: string): Promise<ActionResult> {
  const { organizationId } = await requireSession()
  await db
    .update(clientPackages)
    .set({ sessionsUsed: sql`${clientPackages.sessionsUsed} + 1` })
    .where(
      and(
        eq(clientPackages.id, clientPackageId),
        eq(clientPackages.organizationId, organizationId)
      )
    )
  return { success: true }
}
