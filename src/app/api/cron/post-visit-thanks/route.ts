import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments, clients, organizations } from "@/db/schema"
import { eq, and, isNotNull, or } from "drizzle-orm"
import { sendPostVisitThanks } from "@/actions/whatsapp"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  const rows = await db
    .select({
      clientName: clients.name,
      clientPhone: clients.phone,
      clientWhatsapp: clients.whatsapp,
      orgName: organizations.name,
      googleReviewUrl: organizations.googleReviewUrl,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .innerJoin(organizations, eq(organizations.id, appointments.organizationId))
    .where(
      and(
        eq(appointments.date, yesterdayStr),
        eq(appointments.status, "completed"),
        or(isNotNull(clients.whatsapp), isNotNull(clients.phone))
      )
    )

  let sent = 0

  if (process.env.WHATSAPP_ENABLED === "true") {
    for (const row of rows) {
      const clientPhone = row.clientWhatsapp ?? row.clientPhone
      if (!clientPhone || !row.googleReviewUrl) continue
      try {
        await sendPostVisitThanks({
          clientPhone,
          clientName: row.clientName,
          orgName: row.orgName,
          googleReviewUrl: row.googleReviewUrl,
        })
        sent++
      } catch {
        // log silencioso por cliente
      }
    }
  }

  return NextResponse.json({ ok: true, sent, date: yesterdayStr })
}
