import { ImageResponse } from "next/og"
import QRCode from "qrcode"
import { db } from "@/db"
import { couponRecipients, coupons, procedures, organizations, clients } from "@/db/schema"
import { eq } from "drizzle-orm"

export const runtime = "nodejs"

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ recipientId: string }> }
) {
  const { recipientId } = await params

  const [row] = await db
    .select({
      token: couponRecipients.token,
      clientName: clients.name,
      kind: coupons.kind,
      discountPct: coupons.discountPct,
      expiresAt: coupons.expiresAt,
      procedureName: procedures.name,
      orgName: organizations.name,
    })
    .from(couponRecipients)
    .innerJoin(coupons, eq(coupons.id, couponRecipients.couponId))
    .innerJoin(procedures, eq(procedures.id, coupons.procedureId))
    .innerJoin(organizations, eq(organizations.id, couponRecipients.organizationId))
    .innerJoin(clients, eq(clients.id, couponRecipients.clientId))
    .where(eq(couponRecipients.id, recipientId))

  if (!row) return new Response("Not found", { status: 404 })

  const qrDataUrl = await QRCode.toDataURL(row.token, { margin: 1, width: 320 })
  const isGift = row.kind === "gift"

  const bg = isGift
    ? "linear-gradient(160deg, #F2BCD4 0%, #D984AD 55%, #8A3B60 100%)"
    : "linear-gradient(160deg, #12080E 0%, #2A1520 100%)"
  const textColor = isGift ? "#3A1526" : "#FFF6EC"
  const accent = isGift ? "#7A2E4E" : "#D984AD"

  // 1200x630 (~1.91:1) — proporção exigida pelo WhatsApp pro header de imagem
  // do template; fora disso a imagem chega esticada/cortada pro cliente.
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 48,
          background: bg,
          padding: "0 64px",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, maxWidth: 660 }}>
          <div style={{ fontSize: 26, fontWeight: 700, color: textColor, opacity: 0.85 }}>{row.orgName}</div>
          <div style={{ fontSize: 21, fontWeight: 700, letterSpacing: 3, color: accent }}>
            {isGift ? "VALE-PRESENTE" : "CUPOM DE DESCONTO"}
          </div>
          <div style={{ fontSize: isGift ? 58 : 80, fontWeight: 900, color: textColor, lineHeight: 1.1, marginTop: 10 }}>
            {isGift ? "Um presente" : `${row.discountPct}% OFF`}
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: textColor }}>{row.procedureName}</div>
          <div style={{ fontSize: 22, color: textColor, opacity: 0.75, marginTop: 6 }}>
            {isGift ? `Pra você, ${row.clientName}` : `Válido até ${formatDate(row.expiresAt)}`}
          </div>
          {isGift && (
            <div style={{ fontSize: 20, color: textColor, opacity: 0.7 }}>
              Válido até {formatDate(row.expiresAt)}
            </div>
          )}
        </div>

        <div style={{ width: 1, alignSelf: "stretch", marginTop: 48, marginBottom: 48, background: textColor, opacity: 0.2 }} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            background: "#FFFFFF",
            borderRadius: 24,
            padding: "24px 24px 18px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} width={290} height={290} alt="" />
          <div style={{ fontSize: 14, color: "#12080E", fontWeight: 600, textAlign: "center", maxWidth: 290 }}>
            Mostre esse QR code na hora do atendimento
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
