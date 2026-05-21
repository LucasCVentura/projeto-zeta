"use server"

import { db } from "@/db"
import { procedures } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { can } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "./auth"

export async function getProceduresAction() {
  const { organizationId } = await requireSession()

  return db
    .select()
    .from(procedures)
    .where(
      and(
        eq(procedures.organizationId, organizationId),
        eq(procedures.active, true)
      )
    )
    .orderBy(procedures.name)
}

export async function createProcedureAction(data: {
  name: string
  price: number
}): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "org:update")) {
    return { success: false, error: "Sem permissão." }
  }

  await db.insert(procedures).values({
    organizationId,
    name: data.name.trim(),
    price: Math.round(data.price * 100), // converte reais → centavos
  })

  revalidatePath("/configuracoes/procedimentos")
  return { success: true }
}

export async function updateProcedureAction(
  id: string,
  data: { name?: string; price?: number }
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
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(procedures.id, id),
        eq(procedures.organizationId, organizationId)
      )
    )

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

  revalidatePath("/configuracoes/procedimentos")
  return { success: true }
}
