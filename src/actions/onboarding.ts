"use server"

import { db } from "@/db"
import { scheduleConfig, procedures, clients, appointments, clientPhotos } from "@/db/schema"
import { eq, and, count, desc } from "drizzle-orm"
import { requireSession } from "@/lib/session"

export async function getOnboardingStatusAction() {
  const { userId, organizationId } = await requireSession()

  const [hasSchedule, hasProcedure, clientSummary, hasAppointment, hasPhoto] = await Promise.all([
    db
      .select({ count: count() })
      .from(scheduleConfig)
      .where(and(eq(scheduleConfig.organizationId, organizationId), eq(scheduleConfig.userId, userId)))
      .then((r) => Number(r[0]?.count ?? 0) > 0),

    db
      .select({ count: count() })
      .from(procedures)
      .where(eq(procedures.organizationId, organizationId))
      .then((r) => Number(r[0]?.count ?? 0) > 0),

    db
      .select({ id: clients.id })
      .from(clients)
      .where(eq(clients.organizationId, organizationId))
      .orderBy(desc(clients.createdAt))
      .limit(1)
      .then((r) => ({ hasClient: r.length > 0, firstClientId: r[0]?.id ?? null })),

    db
      .select({ count: count() })
      .from(appointments)
      .where(eq(appointments.organizationId, organizationId))
      .then((r) => Number(r[0]?.count ?? 0) > 0),

    db
      .select({ count: count() })
      .from(clientPhotos)
      .where(eq(clientPhotos.organizationId, organizationId))
      .then((r) => Number(r[0]?.count ?? 0) > 0),
  ])

  return {
    hasSchedule,
    hasProcedure,
    hasClient: clientSummary.hasClient,
    firstClientId: clientSummary.firstClientId,
    hasAppointment,
    hasPhoto,
  }
}
