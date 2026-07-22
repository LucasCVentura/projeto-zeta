import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { couponRecipients, coupons, clients, procedures, organizations } from "@/db/schema"
import { eq, and, or, isNotNull } from "drizzle-orm"
import { sendCouponWhatsApp } from "@/actions/whatsapp"

// O plano Vercel em uso só permite crons diários (não dá pra rodar de poucos em
// poucos minutos), então o "enfileirado com limite" vira: 1x/dia, num teto por
// execução — ainda protege contra disparar milhares de mensagens síncronas de
// uma vez só. O "envio" É a alocação do cupom (ver coupon_recipients), então
// isso não muda quem recebeu o quê, só o ritmo de disparo real no WhatsApp.
const BATCH_SIZE = 200

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kiraclinic.com.br"

  const rows = await db
    .select({
      recipientId: couponRecipients.id,
      token: couponRecipients.token,
      clientName: clients.name,
      clientPhone: clients.whatsapp,
      clientPhoneFallback: clients.phone,
      kind: coupons.kind,
      discountPct: coupons.discountPct,
      expiresAt: coupons.expiresAt,
      procedureName: procedures.name,
      orgName: organizations.name,
    })
    .from(couponRecipients)
    .innerJoin(coupons, eq(coupons.id, couponRecipients.couponId))
    .innerJoin(procedures, eq(procedures.id, coupons.procedureId))
    .innerJoin(clients, eq(clients.id, couponRecipients.clientId))
    .innerJoin(organizations, eq(organizations.id, couponRecipients.organizationId))
    .where(
      and(
        eq(couponRecipients.status, "pending"),
        or(isNotNull(clients.whatsapp), isNotNull(clients.phone))
      )
    )
    .limit(BATCH_SIZE)

  let sent = 0
  let failed = 0

  if (process.env.WHATSAPP_ENABLED === "true") {
    for (const row of rows) {
      const clientPhone = row.clientPhone ?? row.clientPhoneFallback
      if (!clientPhone) continue
      try {
        await sendCouponWhatsApp({
          clientPhone,
          clientName: row.clientName,
          orgName: row.orgName,
          procedure: row.procedureName,
          kind: row.kind,
          discountPct: row.discountPct,
          expiresAt: row.expiresAt,
          imageUrl: `${baseUrl}/api/coupons/recipient/${row.recipientId}/image`,
        })
        await db
          .update(couponRecipients)
          .set({ status: "sent", sentAt: new Date() })
          .where(eq(couponRecipients.id, row.recipientId))
        sent++
      } catch (err) {
        console.error("[Cron][SendCoupons] erro ao enviar cupom", { recipientId: row.recipientId, error: err })
        await db
          .update(couponRecipients)
          .set({ status: "failed" })
          .where(eq(couponRecipients.id, row.recipientId))
        failed++
      }
    }
  }

  return NextResponse.json({ ok: true, sent, failed, batch: rows.length })
}
