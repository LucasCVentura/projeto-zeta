"use server"

import { db } from "@/db"
import { supportThreads, supportMessages, users, type SupportThread, type SupportMessage } from "@/db/schema"
import { eq, and, asc, isNull } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { uploadSupportImageToStorage } from "@/lib/storage"
import { sendAdminPush } from "@/actions/push"
import { isFeatureEnabled } from "@/lib/feature-flags"
import type { ActionResult } from "./auth"

async function getOrCreateThread(organizationId: string): Promise<SupportThread> {
  await db
    .insert(supportThreads)
    .values({ organizationId })
    .onConflictDoNothing({ target: supportThreads.organizationId })

  const [thread] = await db
    .select()
    .from(supportThreads)
    .where(eq(supportThreads.organizationId, organizationId))

  return thread
}

// Leve, pro badge do ícone no header — não cria thread à toa só de checar
export async function getMySupportUnreadAction(): Promise<boolean> {
  const { organizationId } = await requireSession()
  if (!(await isFeatureEnabled(organizationId, "support-tickets"))) return false

  const [thread] = await db
    .select({ unreadByOrg: supportThreads.unreadByOrg })
    .from(supportThreads)
    .where(eq(supportThreads.organizationId, organizationId))

  return thread?.unreadByOrg ?? false
}

export async function getMySupportMessagesAction(): Promise<{ thread: SupportThread; messages: SupportMessage[] }> {
  const { organizationId } = await requireSession()
  // A UI já bloqueia acesso à página com a flag desligada — isso aqui é defesa
  // contra chamar a action direto (fetch/devtools) ignorando o rollout gradual.
  if (!(await isFeatureEnabled(organizationId, "support-tickets"))) throw new Error("FEATURE_DISABLED")
  const thread = await getOrCreateThread(organizationId)

  const messages = await db
    .select()
    .from(supportMessages)
    .where(eq(supportMessages.threadId, thread.id))
    .orderBy(asc(supportMessages.createdAt))

  await db
    .update(supportMessages)
    .set({ readAt: new Date() })
    .where(and(eq(supportMessages.threadId, thread.id), eq(supportMessages.senderType, "admin"), isNull(supportMessages.readAt)))

  if (thread.unreadByOrg) {
    await db.update(supportThreads).set({ unreadByOrg: false }).where(eq(supportThreads.id, thread.id))
  }

  return { thread, messages }
}

export async function sendSupportMessageAction(formData: FormData): Promise<ActionResult> {
  const { userId, organizationId } = await requireSession()
  if (!(await isFeatureEnabled(organizationId, "support-tickets"))) return { success: false, error: "Feature não disponível." }
  const thread = await getOrCreateThread(organizationId)

  const content = (formData.get("content") as string | null)?.trim() || null
  const file = formData.get("image") as File | null

  if (!content && (!file || file.size === 0)) {
    return { success: false, error: "Escreva uma mensagem ou anexe uma imagem." }
  }

  let imageUrl: string | null = null
  if (file && file.size > 0) {
    if (file.size > 10 * 1024 * 1024) return { success: false, error: "Imagem muito grande. Máximo 10MB." }
    if (!file.type.startsWith("image/")) return { success: false, error: "Formato inválido." }

    const ext = file.type.includes("png") ? "png" : "jpg"
    const objectName = `support/${organizationId}/${thread.id}-${crypto.randomUUID()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())
    imageUrl = await uploadSupportImageToStorage(objectName, buffer, file.type)
  }

  await db.insert(supportMessages).values({
    threadId: thread.id,
    senderType: "org",
    senderUserId: userId,
    content,
    imageUrl,
  })

  const preview = content ?? "📷 Imagem"
  await db
    .update(supportThreads)
    .set({ lastMessageAt: new Date(), lastMessagePreview: preview, unreadByAdmin: true, status: "open", updatedAt: new Date() })
    .where(eq(supportThreads.id, thread.id))

  const [user] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId))
  await sendAdminPush({ title: "Novo chamado", body: `${user?.name ?? "Clínica"}: ${preview}`, url: "/admin" }).catch(() => {})

  return { success: true }
}
