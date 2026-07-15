import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments, clients, organizations } from "@/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { sendPublicBookingAutoRejected } from "@/actions/whatsapp"

// Agendamento vindo do link público (createdById nulo) que continua "waiting" na véspera
// (data = amanhã) nunca foi aprovado pela profissional. Recusa automática: cancela e avisa
// a cliente por WhatsApp, com o link do agendamento público pra ela tentar de novo.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const nowBRT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  const tomorrow = new Date(nowBRT)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })

  const whereClause = and(
    eq(appointments.date, tomorrowStr),
    eq(appointments.status, "waiting"),
    isNull(appointments.createdById)
  )

  const pending = await db
    .select({
      id: appointments.id,
      clientName: clients.name,
      clientPhone: clients.phone,
      clientWhatsapp: clients.whatsapp,
      orgName: organizations.name,
      orgSlug: organizations.slug,
    })
    .from(appointments)
    .innerJoin(clients, eq(clients.id, appointments.clientId))
    .innerJoin(organizations, eq(organizations.id, appointments.organizationId))
    .where(whereClause)

  if (pending.length === 0) {
    return NextResponse.json({ ok: true, rejected: 0, notified: 0 })
  }

  await db
    .update(appointments)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(whereClause)

  let notified = 0
  if (process.env.WHATSAPP_ENABLED === "true") {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kiraclinic.com.br"
    for (const p of pending) {
      const phone = p.clientWhatsapp || p.clientPhone
      if (!phone) continue
      try {
        await sendPublicBookingAutoRejected({
          clientPhone: phone,
          clientName: p.clientName,
          orgName: p.orgName,
          bookingLink: `${baseUrl}/agendar/${p.orgSlug}`,
        })
        notified++
      } catch (err) {
        console.error("[Cron][AutoRejectPublicBookings] erro ao notificar cliente", { appointmentId: p.id, error: err })
      }
    }
  }

  return NextResponse.json({ ok: true, rejected: pending.length, notified })
}
