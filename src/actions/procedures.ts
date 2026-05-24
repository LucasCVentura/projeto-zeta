"use server"

import { db } from "@/db"
import { procedures } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { can } from "@/lib/permissions"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import type { ActionResult } from "./auth"

export async function getProceduresAction() {
  const { organizationId } = await requireSession()
  const tag = `procedures-${organizationId}`
  return unstable_cache(
    async (orgId: string) =>
      db
        .select()
        .from(procedures)
        .where(and(eq(procedures.organizationId, orgId), eq(procedures.active, true)))
        .orderBy(procedures.name),
    [tag],
    { tags: [tag], revalidate: 3600 }
  )(organizationId)
}

export async function createProcedureAction(data: {
  name: string
  price: number
  hasReturn?: boolean
  returnIntervalDays?: number | null
}): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "org:update")) {
    return { success: false, error: "Sem permissão." }
  }

  await db.insert(procedures).values({
    organizationId,
    name: data.name.trim(),
    price: Math.round(data.price * 100),
    hasReturn: data.hasReturn ?? false,
    returnIntervalDays: data.hasReturn ? (data.returnIntervalDays ?? null) : null,
  })

  revalidateTag(`procedures-${organizationId}`, {})
  revalidatePath("/configuracoes/procedimentos")
  return { success: true }
}

export async function updateProcedureAction(
  id: string,
  data: { name?: string; price?: number; hasReturn?: boolean; returnIntervalDays?: number | null }
): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "org:update")) {
    return { success: false, error: "Sem permissão." }
  }

  await db
    .update(procedures)
    .set({
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.price !== undefined ? { price: Math.round(data.price * 100) } : {}),
      ...(data.hasReturn !== undefined ? { hasReturn: data.hasReturn } : {}),
      returnIntervalDays: data.hasReturn ? (data.returnIntervalDays ?? null) : null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(procedures.id, id),
        eq(procedures.organizationId, organizationId)
      )
    )

  revalidateTag(`procedures-${organizationId}`, {})
  revalidatePath("/configuracoes/procedimentos")
  return { success: true }
}

export async function deleteProcedureAction(id: string): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "org:update")) {
    return { success: false, error: "Sem permissão." }
  }

  // Soft delete — mantém histórico nos agendamentos
  await db
    .update(procedures)
    .set({ active: false, updatedAt: new Date() })
    .where(
      and(
        eq(procedures.id, id),
        eq(procedures.organizationId, organizationId)
      )
    )

  revalidateTag(`procedures-${organizationId}`, {})
  revalidatePath("/configuracoes/procedimentos")
  return { success: true }
}
