import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { inboundEmails } from "@/db/schema"

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await req.json()

  if (payload.type !== "email.received") {
    return NextResponse.json({ ok: true })
  }

  const { email_id, from, subject } = payload.data

  // Busca o corpo completo do email via API do Resend
  let body = ""
  try {
    const res = await fetch(`https://api.resend.com/inbound-emails/${email_id}`, {
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    })
    if (res.ok) {
      const data = await res.json()
      body = data.text ?? data.html ?? ""
    }
  } catch (err) {
    console.error("[inbound] failed to fetch email body:", err)
  }

  await db.insert(inboundEmails).values({
    from: from ?? "desconhecido",
    subject: subject ?? "(sem assunto)",
    body,
  })

  try {
    const { sendAdminPush } = await import("@/actions/push")
    await sendAdminPush({
      title: "📧 Novo email de suporte",
      body: `De: ${from ?? "desconhecido"} — ${subject ?? "(sem assunto)"}`,
      url: "/admin",
    })
  } catch { /* não bloqueia */ }

  return NextResponse.json({ ok: true })
}
