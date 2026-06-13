"use server"

import { db } from "@/db"
import { consentTerms, consentTermRecords } from "@/db/schema"
import { eq, and, asc } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"

export async function getConsentTermsAction() {
  const { organizationId } = await requireSession()
  return db
    .select()
    .from(consentTerms)
    .where(eq(consentTerms.orgId, organizationId))
    .orderBy(asc(consentTerms.displayOrder), asc(consentTerms.createdAt))
}

export async function createConsentTermAction(data: { title: string; body: string }) {
  const { organizationId } = await requireSession()

  const existing = await db
    .select({ displayOrder: consentTerms.displayOrder })
    .from(consentTerms)
    .where(eq(consentTerms.orgId, organizationId))
    .orderBy(asc(consentTerms.displayOrder))

  const maxOrder = existing.length > 0 ? Math.max(...existing.map(t => t.displayOrder)) + 1 : 0

  await db.insert(consentTerms).values({
    orgId: organizationId,
    title: data.title.trim(),
    body: data.body.trim(),
    displayOrder: maxOrder,
  })

  revalidatePath("/configuracoes/termos")
}

export async function updateConsentTermAction(id: string, data: { title?: string; body?: string; active?: boolean }) {
  const { organizationId } = await requireSession()
  await db
    .update(consentTerms)
    .set(data)
    .where(and(eq(consentTerms.id, id), eq(consentTerms.orgId, organizationId)))
  revalidatePath("/configuracoes/termos")
}

export async function deleteConsentTermAction(id: string) {
  const { organizationId } = await requireSession()
  await db
    .delete(consentTerms)
    .where(and(eq(consentTerms.id, id), eq(consentTerms.orgId, organizationId)))
  revalidatePath("/configuracoes/termos")
}

export async function getClientConsentRecordsAction(clientId: string) {
  const { organizationId } = await requireSession()

  const [terms, records] = await Promise.all([
    db
      .select()
      .from(consentTerms)
      .where(and(eq(consentTerms.orgId, organizationId), eq(consentTerms.active, true)))
      .orderBy(asc(consentTerms.displayOrder)),
    db
      .select()
      .from(consentTermRecords)
      .where(and(
        eq(consentTermRecords.clientId, clientId),
        eq(consentTermRecords.orgId, organizationId),
      )),
  ])

  const recordMap = Object.fromEntries(records.map(r => [r.termId, r]))
  return terms.map(t => ({ ...t, record: recordMap[t.id] ?? null }))
}

export async function updateClientConsentRecordAction(
  clientId: string,
  termId: string,
  accepted: boolean | null
) {
  const { organizationId } = await requireSession()

  if (accepted === null) {
    await db
      .delete(consentTermRecords)
      .where(and(
        eq(consentTermRecords.clientId, clientId),
        eq(consentTermRecords.termId, termId),
      ))
  } else {
    await db
      .insert(consentTermRecords)
      .values({ clientId, orgId: organizationId, termId, accepted, respondedAt: new Date() })
      .onConflictDoUpdate({
        target: [consentTermRecords.clientId, consentTermRecords.termId],
        set: { accepted, respondedAt: new Date() },
      })
  }

  revalidatePath(`/clientes/${clientId}`)
}
