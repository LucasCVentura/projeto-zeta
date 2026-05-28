"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { CHANGELOG, CURRENT_VERSION } from "@/lib/changelog"

export async function getChangelogStateAction(): Promise<{
  hasNew: boolean
  lastSeenVersion: string | null
  entries: typeof CHANGELOG
}> {
  const { userId } = await requireSession()
  const [user] = await db.select({ lastSeenChangelog: users.lastSeenChangelog }).from(users).where(eq(users.id, userId)).limit(1)
  const lastSeen = user?.lastSeenChangelog ?? null
  const hasNew = lastSeen !== CURRENT_VERSION
  return { hasNew, lastSeenVersion: lastSeen, entries: CHANGELOG }
}

export async function markChangelogSeenAction(): Promise<void> {
  const { userId } = await requireSession()
  await db.update(users).set({ lastSeenChangelog: CURRENT_VERSION }).where(eq(users.id, userId))
}
