"use server"

import { db } from "@/db"
import { pushSubscriptions } from "@/db/schema"
import { eq } from "drizzle-orm"
import webpush from "web-push"

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export async function savePushSubscriptionAction(sub: {
  endpoint: string
  keys: { p256dh: string; auth: string }
}) {
  await db
    .insert(pushSubscriptions)
    .values({ endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth })
    .onConflictDoNothing()
}

export async function deletePushSubscriptionAction(endpoint: string) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint))
}

export async function getVapidPublicKeyAction() {
  return process.env.VAPID_PUBLIC_KEY!
}

export async function sendAdminPush(payload: { title: string; body: string; url?: string }) {
  const subs = await db.select().from(pushSubscriptions)
  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        )
      } catch (err: unknown) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 410 || status === 404) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, s.endpoint))
        }
      }
    })
  )
}
