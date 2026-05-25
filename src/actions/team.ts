"use server"

import { db } from "@/db"
import { organizationMembers, users, invites, organizations } from "@/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { can } from "@/lib/permissions"
import type { OrgRole } from "@/db/schema"
import { revalidatePath } from "next/cache"
import crypto from "crypto"

export type ActionResult = { success: true } | { success: false; error: string }

export async function getTeamAction() {
  const { organizationId } = await requireSession()

  const [members, pendingInvites] = await Promise.all([
    db
      .select({
        userId: organizationMembers.userId,
        role: organizationMembers.role,
        joinedAt: organizationMembers.joinedAt,
        name: users.name,
        email: users.email,
      })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.active, true)
        )
      ),
    db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.organizationId, organizationId),
          isNull(invites.acceptedAt)
        )
      ),
  ])

  return { members, pendingInvites }
}

export async function inviteMemberAction(email: string, role: OrgRole): Promise<ActionResult> {
  const { organizationId, role: myRole } = await requireSession()

  if (!can(myRole, "org:invite")) {
    return { success: false, error: "Sem permissão para convidar membros." }
  }

  const normalizedEmail = email.toLowerCase().trim()

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  if (existingUser) {
    const [existingMember] = await db
      .select({ id: organizationMembers.userId })
      .from(organizationMembers)
      .where(
        and(
          eq(organizationMembers.organizationId, organizationId),
          eq(organizationMembers.userId, existingUser.id),
          eq(organizationMembers.active, true)
        )
      )
      .limit(1)

    if (existingMember) {
      return { success: false, error: "Este e-mail já é membro da equipe." }
    }
  }

  const [existingInvite] = await db
    .select({ id: invites.id })
    .from(invites)
    .where(
      and(
        eq(invites.organizationId, organizationId),
        eq(invites.email, normalizedEmail),
        isNull(invites.acceptedAt)
      )
    )
    .limit(1)

  if (existingInvite) {
    return { success: false, error: "Já existe um convite pendente para este e-mail." }
  }

  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  await db.insert(invites).values({ organizationId, email: normalizedEmail, role, token, expiresAt })

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  try {
    const { sendInviteEmail } = await import("@/lib/email")
    await sendInviteEmail(normalizedEmail, org?.name ?? "sua clínica", token, role)
  } catch { /* não bloqueia */ }

  revalidatePath("/configuracoes/equipe")
  return { success: true }
}

export async function cancelInviteAction(inviteId: string): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "org:invite")) {
    return { success: false, error: "Sem permissão." }
  }

  await db.delete(invites).where(and(eq(invites.id, inviteId), eq(invites.organizationId, organizationId)))

  revalidatePath("/configuracoes/equipe")
  return { success: true }
}

export async function removeMemberAction(targetUserId: string): Promise<ActionResult> {
  const { organizationId, userId, role } = await requireSession()

  if (!can(role, "org:remove_member")) {
    return { success: false, error: "Sem permissão para remover membros." }
  }

  if (targetUserId === userId) {
    return { success: false, error: "Você não pode remover a si mesmo." }
  }

  const [target] = await db
    .select({ role: organizationMembers.role })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, targetUserId)
      )
    )
    .limit(1)

  if (target?.role === "owner") {
    return { success: false, error: "Não é possível remover o proprietário." }
  }

  await db.delete(organizationMembers).where(
    and(
      eq(organizationMembers.organizationId, organizationId),
      eq(organizationMembers.userId, targetUserId)
    )
  )

  revalidatePath("/configuracoes/equipe")
  return { success: true }
}

export async function acceptInviteAction(token: string): Promise<{ success: true; orgName: string } | { success: false; error: string }> {
  const { userId } = await requireSession()

  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1)

  if (!invite) return { success: false, error: "Convite não encontrado." }
  if (invite.acceptedAt) return { success: false, error: "Este convite já foi aceito." }
  if (invite.expiresAt < new Date()) return { success: false, error: "Este convite expirou." }

  const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1)
  if (user?.email !== invite.email) {
    return { success: false, error: `Este convite é para ${invite.email}. Você está logado com outro e-mail.` }
  }

  const [existingMember] = await db
    .select({ id: organizationMembers.userId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, invite.organizationId),
        eq(organizationMembers.userId, userId)
      )
    )
    .limit(1)

  if (!existingMember) {
    await db.insert(organizationMembers).values({
      organizationId: invite.organizationId,
      userId,
      role: invite.role,
      joinedAt: new Date(),
    })
  }

  await db.update(invites).set({ acceptedAt: new Date() }).where(eq(invites.id, invite.id))

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, invite.organizationId))
    .limit(1)

  revalidatePath("/dashboard")
  return { success: true, orgName: org?.name ?? "a clínica" }
}
