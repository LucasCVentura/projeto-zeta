import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { inboundEmails } from "@/db/schema"

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await req.json()

  const from = payload.from ?? payload.headers?.from ?? "desconhecido"
  const subject = payload.subject ?? "(sem assunto)"
  const body = payload.text ?? payload.html ?? ""

  await db.insert(inboundEmails).values({ from, subject, body })

  return NextResponse.json({ ok: true })
}
