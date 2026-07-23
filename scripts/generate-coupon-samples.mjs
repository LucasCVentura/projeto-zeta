#!/usr/bin/env node
/**
 * Gera PNGs de exemplo (cupom + vale-presente) idênticos ao layout real de
 * src/app/api/coupons/recipient/[recipientId]/image/route.tsx (1200x630,
 * ~1.91:1 — proporção exigida pelo WhatsApp pro header de imagem do
 * template, senão a imagem chega esticada/cortada), com os mesmos dados de
 * exemplo usados no texto dos templates da Gupshup (Camila, Studio da Ana,
 * 20% de desconto, Limpeza de pele, 30/08). Serve pra subir como "sample" na
 * hora de criar o template manualmente no painel da Gupshup.
 *
 * Uso: node scripts/generate-coupon-samples.mjs
 * Gera: /tmp/kira-sample-cupom.png e /tmp/kira-sample-vale-presente.png
 */

import { ImageResponse } from "next/og.js"
import QRCode from "qrcode"
import { writeFile } from "fs/promises"
import React from "react"

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

async function render({ kind, discountPct, procedureName, orgName, clientName, expiresAt, token }) {
  const qrDataUrl = await QRCode.toDataURL(token, { margin: 1, width: 320 })
  const isGift = kind === "gift"

  const bg = isGift
    ? "linear-gradient(160deg, #F2BCD4 0%, #D984AD 55%, #8A3B60 100%)"
    : "linear-gradient(160deg, #12080E 0%, #2A1520 100%)"
  const textColor = isGift ? "#3A1526" : "#FFF6EC"
  const accent = isGift ? "#7A2E4E" : "#D984AD"

  const el = React.createElement(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 48,
        background: bg,
        padding: "0 64px",
        fontFamily: "Arial, Helvetica, sans-serif",
      },
    },
    React.createElement(
      "div",
      { style: { display: "flex", flexDirection: "column", justifyContent: "center", gap: 14, maxWidth: 660 } },
      React.createElement("div", { style: { fontSize: 26, fontWeight: 700, color: textColor, opacity: 0.85 } }, orgName),
      React.createElement(
        "div",
        { style: { fontSize: 21, fontWeight: 700, letterSpacing: 3, color: accent } },
        isGift ? "VALE-PRESENTE" : "CUPOM DE DESCONTO"
      ),
      React.createElement(
        "div",
        { style: { fontSize: isGift ? 58 : 80, fontWeight: 900, color: textColor, lineHeight: 1.1, marginTop: 10 } },
        isGift ? "Um presente" : `${discountPct}% OFF`
      ),
      React.createElement("div", { style: { fontSize: 36, fontWeight: 700, color: textColor } }, procedureName),
      React.createElement(
        "div",
        { style: { fontSize: 22, color: textColor, opacity: 0.75, marginTop: 6 } },
        isGift ? `Pra você, ${clientName}` : `Válido até ${formatDate(expiresAt)}`
      ),
      isGift &&
        React.createElement(
          "div",
          { style: { fontSize: 20, color: textColor, opacity: 0.7 } },
          `Válido até ${formatDate(expiresAt)}`
        )
    ),
    React.createElement("div", {
      style: { width: 1, alignSelf: "stretch", marginTop: 48, marginBottom: 48, background: textColor, opacity: 0.2 },
    }),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
          background: "#FFFFFF",
          borderRadius: 24,
          padding: "24px 24px 18px",
        },
      },
      React.createElement("img", { src: qrDataUrl, width: 290, height: 290, alt: "" }),
      React.createElement(
        "div",
        { style: { fontSize: 14, color: "#12080E", fontWeight: 600, textAlign: "center", maxWidth: 290 } },
        "Mostre esse QR code na hora do atendimento"
      )
    )
  )

  const res = new ImageResponse(el, { width: 1200, height: 630 })
  const buf = Buffer.from(await res.arrayBuffer())
  return buf
}

const shared = {
  orgName: "Studio da Ana",
  clientName: "Camila",
  procedureName: "Limpeza de pele",
  expiresAt: "2026-08-30",
}

const cupomBuf = await render({ ...shared, kind: "discount", discountPct: 20, token: "SAMPLE-CUPOM-TOKEN" })
await writeFile("/tmp/kira-sample-cupom.png", cupomBuf)
console.log("✓ /tmp/kira-sample-cupom.png")

const valePresenteBuf = await render({ ...shared, kind: "gift", token: "SAMPLE-VALE-PRESENTE-TOKEN" })
await writeFile("/tmp/kira-sample-vale-presente.png", valePresenteBuf)
console.log("✓ /tmp/kira-sample-vale-presente.png")
