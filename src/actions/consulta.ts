"use server"

import { db } from "@/db"
import { appointments, clients, procedures } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "./auth"

export async function getAppointmentForConsultaAction(appointmentId: string) {
  const { userId, organizationId } = await requireSession()

  const [row] = await db
    .select({
      id: appointments.id,
      date: appointments.date,
      startTime: appointments.startTime,
      status: appointments.status,
      notes: appointments.notes,
      procedure: appointments.procedure,
      procedureId: appointments.procedureId,
      clientId: appointments.clientId,
      clientName: clients.name,
      procedurePrice: procedures.price,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .leftJoin(procedures, eq(procedures.id, appointments.procedureId))
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.organizationId, organizationId),
        eq(appointments.professionalId, userId)
      )
    )
    .limit(1)

  return row ?? null
}

export async function saveConsultaNotesAction(
  appointmentId: string,
  notes: string
): Promise<ActionResult> {
  const { organizationId } = await requireSession()

  await db
    .update(appointments)
    .set({ notes, updatedAt: new Date() })
    .where(
      and(
        eq(appointments.id, appointmentId),
        eq(appointments.organizationId, organizationId)
      )
    )

  revalidatePath(`/consulta/${appointmentId}`)
  return { success: true }
}
