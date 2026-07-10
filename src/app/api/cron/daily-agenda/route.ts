import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments, clients, organizations, users } from "@/db/schema"
import { eq, and, or, isNotNull } from "drizzle-orm"
import { sendDailyAgendaSummary } from "@/actions/whatsapp"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const today = new Date().toISOString().split("T")[0]

  const rows = await db
    .select({
      professionalId: appointments.professionalId,
      startTime: appointments.startTime,
      procedure: appointments.procedure,
      clientName: clients.name,
      orgName: organizations.name,
      professionalName: users.name,
      professionalWhatsapp: users.whatsapp,
      professionalPhone: users.phone,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .innerJoin(organizations, eq(organizations.id, appointments.organizationId))
    .innerJoin(users, eq(users.id, appointments.professionalId))
    .where(
      and(
        eq(appointments.date, today),
        or(eq(appointments.status, "waiting"), eq(appointments.status, "confirmed")),
        eq(users.dailyAgendaWhatsapp, true),
        or(isNotNull(users.whatsapp), isNotNull(users.phone))
      )
    )

  // Agrupa por profissional: cada um recebe só a própria agenda
  const byProfessional = new Map<string, typeof rows>()
  for (const row of rows) {
    const list = byProfessional.get(row.professionalId) ?? []
    list.push(row)
    byProfessional.set(row.professionalId, list)
  }

  let sent = 0

  if (process.env.WHATSAPP_ENABLED === "true") {
    for (const [professionalId, items] of byProfessional) {
      const first = items[0]
      const phone = first.professionalWhatsapp ?? first.professionalPhone
      if (!phone) continue
      try {
        await sendDailyAgendaSummary({
          professionalPhone: phone,
          professionalName: first.professionalName,
          orgName: first.orgName,
          items: items.map((i) => ({
            startTime: i.startTime,
            clientName: i.clientName,
            procedure: i.procedure,
          })),
        })
        sent++
      } catch (err) {
        console.error("[Cron][DailyAgenda] erro ao enviar agenda do dia", { professionalId, error: err })
      }
    }
  }

  return NextResponse.json({ ok: true, sent, professionals: byProfessional.size, date: today })
}
