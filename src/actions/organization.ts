"use server"

import { db } from "@/db"
import { organizations, organizationMembers } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "./auth"

export async function getOrganizationAction() {
  const { organizationId } = await requireSession()

  const [org] = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      phone: organizations.phone,
      email: organizations.email,
      instagram: organizations.instagram,
      address: organizations.address,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  return org ?? null
}

export async function updateOrganizationAction(data: {
  name?: string
  phone?: string
  email?: string
  instagram?: string
  address?: string
}): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (role !== "owner" && role !== "admin") {
    return { success: false, error: "Sem permissão." }
  }

  await db
    .update(organizations)
    .set({
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      instagram: data.instagram ? data.instagram.replace(/^@/, "") : null,
      address: data.address || null,
    })
    .where(eq(organizations.id, organizationId))

  revalidatePath("/configuracoes/clinica")
  return { success: true }
}
