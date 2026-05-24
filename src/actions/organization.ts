"use server"

import { db } from "@/db"
import { organizations, organizationMembers } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import type { ActionResult } from "./auth"

export async function getOrganizationAction() {
  const { organizationId } = await requireSession()
  const tag = `org-${organizationId}`
  return unstable_cache(
    async (orgId: string) => {
      const [org] = await db
        .select({
          id: organizations.id,
          name: organizations.name,
          phone: organizations.phone,
          email: organizations.email,
          instagram: organizations.instagram,
          address: organizations.address,
          googleReviewUrl: organizations.googleReviewUrl,
        })
        .from(organizations)
        .where(eq(organizations.id, orgId))
        .limit(1)
      return org ?? null
    },
    [tag],
    { tags: [tag], revalidate: 3600 }
  )(organizationId)
}

export async function updateOrganizationAction(data: {
  name?: string
  phone?: string
  email?: string
  instagram?: string
  address?: string
  googleReviewUrl?: string
}): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (role !== "owner") {
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
      googleReviewUrl: data.googleReviewUrl || null,
    })
    .where(eq(organizations.id, organizationId))

  revalidateTag(`org-${organizationId}`, {})
  revalidatePath("/configuracoes/clinica")
  return { success: true }
}
