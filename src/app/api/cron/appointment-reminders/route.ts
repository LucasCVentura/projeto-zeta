import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments, clients, organizations } from "@/db/schema"
import { eq, and, isNotNull } from "drizzle-orm"
import { sendAppointmentReminder } from "@/actions/whatsapp"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split("T")[0]

  const rows = await db
    .select({
      startTime: appointments.startTime,
      procedure: appointments.procedure,
      clientName: clients.name,
      clientPhone: clients.phone,
      orgName: organizations.name,
      orgAddress: organizations.address,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .innerJoin(organizations, eq(organizations.id, appointments.organizationId))
    .where(
      and(
        eq(appointments.date, tomorrowStr),
        eq(appointments.status, "confirmed"),
        isNotNull(clients.phone)
      )
    )

  let sent = 0

  for (const row of rows) {
    if (!row.clientPhone) continue
    try {
      await sendAppointmentReminder({
        clientPhone: row.clientPhone,
        clientName: row.clientName,
        date: tomorrowStr,
        startTime: row.startTime,
        procedure: row.procedure ?? undefined,
        orgName: row.orgName,
        orgAddress: row.orgAddress,
      })
      sent++
    } catch {
      // log silencioso por cliente — não bloqueia os demais
    }
  }

  return NextResponse.json({ ok: true, sent, date: tomorrowStr })
}
