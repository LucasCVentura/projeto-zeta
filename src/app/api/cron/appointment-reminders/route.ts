import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments, clients, organizations } from "@/db/schema"
import { eq, and, isNotNull, isNull, or } from "drizzle-orm"
import { sendReminderWithConfirmation } from "@/actions/whatsapp"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const twoDaysFromNow = new Date()
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)
  const targetDate = twoDaysFromNow.toISOString().split("T")[0]

  const rows = await db
    .select({
      id: appointments.id,
      startTime: appointments.startTime,
      procedure: appointments.procedure,
      clientPackageId: appointments.clientPackageId,
      organizationId: appointments.organizationId,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientWhatsapp: clients.whatsapp,
      orgName: organizations.name,
      orgAddress: organizations.address,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .innerJoin(organizations, eq(organizations.id, appointments.organizationId))
    .where(
      and(
        eq(appointments.date, targetDate),
        or(eq(appointments.status, "waiting"), eq(appointments.status, "confirmed")),
        or(isNotNull(clients.whatsapp), isNotNull(clients.phone)),
        isNull(appointments.reminderSentAt)
      )
    )

  let sent = 0

  if (process.env.WHATSAPP_ENABLED === "true") {
    for (const row of rows) {
      const clientPhone = row.clientWhatsapp ?? row.clientPhone
      if (!clientPhone) continue
      try {
        await sendReminderWithConfirmation({
          clientPhone,
          clientName: row.clientName,
          date: targetDate,
          startTime: row.startTime,
          procedure: row.procedure ?? undefined,
          orgName: row.orgName,
          orgAddress: row.orgAddress,
          appointmentId: row.id,
          clientPackageId: row.clientPackageId,
          organizationId: row.organizationId,
        })
        await db
          .update(appointments)
          .set({ reminderSentAt: new Date() })
          .where(eq(appointments.id, row.id))
        sent++
      } catch (err) {
        console.error("[Cron][Reminders] erro ao enviar lembrete", { appointmentId: row.id, error: err })
      }
    }
  }

  return NextResponse.json({ ok: true, sent, date: targetDate })
}
