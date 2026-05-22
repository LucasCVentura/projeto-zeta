"use server"

import { db } from "@/db"
import { scheduleConfig, procedures, clients, appointments } from "@/db/schema"
import { eq, and, count } from "drizzle-orm"
import { requireSession } from "@/lib/session"

export async function getOnboardingStatusAction() {
  const { userId, organizationId } = await requireSession()

  const [hasSchedule, hasProcedure, hasClient, hasAppointment] = await Promise.all([
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
      .select({ count: count() })
      .from(clients)
      .where(eq(clients.organizationId, organizationId))
      .then((r) => Number(r[0]?.count ?? 0) > 0),

    db
      .select({ count: count() })
      .from(appointments)
      .where(eq(appointments.organizationId, organizationId))
      .then((r) => Number(r[0]?.count ?? 0) > 0),
  ])

  return { hasSchedule, hasProcedure, hasClient, hasAppointment }
}
