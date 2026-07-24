import { db } from "@/db"
import { couponRecipients, coupons, clients, procedures, organizations } from "@/db/schema"
import { eq, and, or, isNotNull, asc } from "drizzle-orm"
import { sendCouponWhatsApp } from "@/actions/whatsapp"

// Fila FIFO de envio de cupons/vale-presentes — coupon_recipients com
// status "pending" já É a fila (ordenada por createdAt). Duas formas de
// disparar o processamento:
//  1. Imediata: createCouponAction chama isso via after() logo após criar o
//     cupom, pra não depender só do cron diário (ver ADR no send-coupons/route.ts).
//  2. Sweep diário: /api/cron/send-coupons pega o que sobrou (campanhas
//     grandes que passaram do limite imediato, ou falhas transientes).
const SEND_DELAY_MS = 500

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function dispatchPendingCoupons(limit: number): Promise<{ sent: number; failed: number; batch: number }> {
  if (process.env.WHATSAPP_ENABLED !== "true") return { sent: 0, failed: 0, batch: 0 }

  // www: sem o www a URL faz redirect 307 (canônico do Vercel), e o downloader
  // de mídia do WhatsApp não segue redirect — a imagem falha com "http code 500"
  // na entrega real (mesmo problema que já resolvemos pro sample dos templates).
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.kiraclinic.com.br"

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
    .orderBy(asc(couponRecipients.createdAt))
    .limit(limit)

  let sent = 0
  let failed = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
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
      console.error("[CouponDispatch] erro ao enviar cupom", { recipientId: row.recipientId, error: err })
      await db
        .update(couponRecipients)
        .set({ status: "failed" })
        .where(eq(couponRecipients.id, row.recipientId))
      failed++
    }

    if (i < rows.length - 1) await sleep(SEND_DELAY_MS)
  }

  return { sent, failed, batch: rows.length }
}
