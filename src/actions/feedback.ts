"use server"

import { db } from "@/db"
import { userFeedback, feedbackSummaries, organizations, users } from "@/db/schema"
import { desc, eq } from "drizzle-orm"
import { requireSession } from "@/lib/session"

export async function submitFeedbackAction(content: string) {
  const { userId, organizationId } = await requireSession()

  await db.insert(userFeedback).values({
    organizationId,
    userId,
    content: content.trim(),
  })
}

export async function getLatestFeedbackSummaryAction() {
  const [summary] = await db
    .select()
    .from(feedbackSummaries)
    .orderBy(desc(feedbackSummaries.generatedAt))
    .limit(1)

  return summary ?? null
}

export async function getAllFeedbackAction() {
  return db
    .select({
      id: userFeedback.id,
      content: userFeedback.content,
      createdAt: userFeedback.createdAt,
      orgName: organizations.name,
      userName: users.name,
    })
    .from(userFeedback)
    .leftJoin(organizations, eq(userFeedback.organizationId, organizations.id))
    .leftJoin(users, eq(userFeedback.userId, users.id))
    .orderBy(desc(userFeedback.createdAt))
}
