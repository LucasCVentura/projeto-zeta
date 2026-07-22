"use server"

import { db } from "@/db"
import { users, changelogEntries, type ChangelogItem } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { assertAdmin, requireAdmin } from "@/lib/admin-guard"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "./auth"
import type { ChangelogEntry } from "@/lib/changelog"

// ── Leitura pro usuário final ("O que há de novo") ───────────────────────────

async function getAllEntries(): Promise<ChangelogEntry[]> {
  const rows = await db
    .select({ version: changelogEntries.version, entryDate: changelogEntries.entryDate, items: changelogEntries.items })
    .from(changelogEntries)
    .orderBy(desc(changelogEntries.entryDate), desc(changelogEntries.createdAt))

  return rows.map((r) => ({ version: r.version, date: r.entryDate, items: r.items }))
}

export async function getChangelogStateAction(): Promise<{
  hasNew: boolean
  lastSeenVersion: string | null
  entries: ChangelogEntry[]
}> {
  const { userId } = await requireSession()
  const entries = await getAllEntries()
  const currentVersion = entries[0]?.version ?? null

  const [user] = await db.select({ lastSeenChangelog: users.lastSeenChangelog }).from(users).where(eq(users.id, userId)).limit(1)
  const lastSeen = user?.lastSeenChangelog ?? null
  const hasNew = currentVersion !== null && lastSeen !== currentVersion

  return { hasNew, lastSeenVersion: lastSeen, entries }
}

export async function markChangelogSeenAction(): Promise<void> {
  const { userId } = await requireSession()
  const entries = await getAllEntries()
  const currentVersion = entries[0]?.version
  if (!currentVersion) return
  await db.update(users).set({ lastSeenChangelog: currentVersion }).where(eq(users.id, userId))
}

// ── Gestão pelo admin ──────────────────────────────────────────────────────────

export async function getChangelogEntriesAction() {
  await assertAdmin()

  return db
    .select()
    .from(changelogEntries)
    .orderBy(desc(changelogEntries.entryDate), desc(changelogEntries.createdAt))
}

// Sugere a próxima versão (minor bump, padrão pra feature nova — ver
// feedback_versioning: minor pra melhoria, major pra mudança grande, então o
// admin pode ajustar o número na hora se achar que o caso pede major).
export async function suggestNextVersionAction(): Promise<string> {
  await assertAdmin()

  const [latest] = await db
    .select({ version: changelogEntries.version })
    .from(changelogEntries)
    .orderBy(desc(changelogEntries.entryDate), desc(changelogEntries.createdAt))
    .limit(1)

  if (!latest) return "1.0.0"

  const [major, minor] = latest.version.split(".").map(Number)
  return `${major}.${minor + 1}.0`
}

export async function createChangelogEntryAction(data: {
  version: string
  entryDate: string
  items: ChangelogItem[]
  featureFlagId?: string | null
}): Promise<ActionResult> {
  await requireAdmin()

  if (!data.version.trim()) return { success: false, error: "Informe a versão." }
  if (data.items.length === 0) return { success: false, error: "Adicione ao menos um item." }

  const [existing] = await db.select({ id: changelogEntries.id }).from(changelogEntries).where(eq(changelogEntries.version, data.version))
  if (existing) return { success: false, error: `Já existe uma entrada com a versão ${data.version}.` }

  await db.insert(changelogEntries).values({
    version: data.version.trim(),
    entryDate: data.entryDate,
    items: data.items,
    featureFlagId: data.featureFlagId ?? null,
  })

  revalidatePath("/admin")
  return { success: true }
}

export async function updateChangelogEntryAction(
  id: string,
  data: { version: string; entryDate: string; items: ChangelogItem[] }
): Promise<ActionResult> {
  await requireAdmin()

  if (!data.version.trim()) return { success: false, error: "Informe a versão." }
  if (data.items.length === 0) return { success: false, error: "Adicione ao menos um item." }

  await db
    .update(changelogEntries)
    .set({ version: data.version.trim(), entryDate: data.entryDate, items: data.items, updatedAt: new Date() })
    .where(eq(changelogEntries.id, id))

  revalidatePath("/admin")
  return { success: true }
}

export async function deleteChangelogEntryAction(id: string): Promise<ActionResult> {
  await requireAdmin()

  await db.delete(changelogEntries).where(eq(changelogEntries.id, id))

  revalidatePath("/admin")
  return { success: true }
}
