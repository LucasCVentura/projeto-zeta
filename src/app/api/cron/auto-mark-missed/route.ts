import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { appointments } from "@/db/schema"
import { eq, and, lt, or } from "drizzle-orm"

// Marca como "faltou" agendamentos com status waiting ou confirmed
// cuja data já passou há pelo menos 1 dia sem qualquer mudança de status.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const nowBRT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  const yesterday = new Date(nowBRT)
  yesterday.setDate(yesterday.getDate() - 1)
  const cutoff = yesterday.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })

  const stale = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(
      and(
        lt(appointments.date, cutoff),
        or(eq(appointments.status, "waiting"), eq(appointments.status, "confirmed"))
      )
    )

  if (stale.length === 0) {
    return NextResponse.json({ ok: true, marked: 0 })
  }

  await db
    .update(appointments)
    .set({ status: "missed", updatedAt: new Date() })
    .where(
      and(
        lt(appointments.date, cutoff),
        or(eq(appointments.status, "waiting"), eq(appointments.status, "confirmed"))
      )
    )

  return NextResponse.json({ ok: true, marked: stale.length })
}
