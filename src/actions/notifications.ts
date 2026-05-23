"use server"

import { db } from "@/db"
import { notifications, organizationMembers } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { requireSession } from "@/lib/session"

export async function getNotificationsAction() {
  const { userId, organizationId } = await requireSession()

  return db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId)
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(20)
}

export async function markNotificationReadAction(id: string) {
  const { userId, organizationId } = await requireSession()

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.id, id),
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId)
      )
    )
}

export async function markAllNotificationsReadAction() {
  const { userId, organizationId } = await requireSession()

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      and(
        eq(notifications.organizationId, organizationId),
        eq(notifications.userId, userId)
      )
    )
}

// Chamado internamente (sem requireSession) para criar notificações por evento
export async function createNotificationInternal(data: {
  organizationId: string
  userId: string
  type: string
  title: string
  body: string
  href?: string
}) {
  await db.insert(notifications).values({
    organizationId: data.organizationId,
    userId: data.userId,
    type: data.type,
    title: data.title,
    body: data.body,
    href: data.href ?? null,
  })
}

// Notifica todos os profissionais da organização (owners + professionals)
export async function notifyOrganizationProfessionals(data: {
  organizationId: string
  type: string
  title: string
  body: string
  href?: string
}) {
  const members = await db
    .select({ userId: organizationMembers.userId })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.organizationId, data.organizationId),
        eq(organizationMembers.role, "owner")
      )
    )

  await Promise.all(
    members.map((m) =>
      createNotificationInternal({
        organizationId: data.organizationId,
        userId: m.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        href: data.href,
      })
    )
  )
}
