"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"

export function PixQrCode({ qrCodeUrl, pixPayload, expiresAt, amount }: {
  qrCodeUrl: string
  pixPayload: string
  expiresAt: number
  amount: string
}) {
  const [copied, setCopied] = useState(false)

  async function copyPayload() {
    await navigator.clipboard.writeText(pixPayload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const expiresDate = expiresAt
    ? new Date(expiresAt * 1000).toLocaleDateString("pt-BR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3">
        <img
          src={qrCodeUrl}
          alt="QR code Pix"
          className="w-48 h-48 rounded-lg border border-border"
        />
        <div className="text-center space-y-0.5">
          <p className="text-sm font-semibold">{amount}</p>
          {expiresDate && (
            <p className="text-xs text-muted-foreground">Válido até {expiresDate}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Ou copie o código Pix:</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-muted-foreground truncate">
            {pixPayload}
          </div>
          <button
            onClick={copyPayload}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent transition-colors"
          >
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            {copied ? "Copiado!" : "Copiar"}
          </button>
        </div>
      </div>
    </div>
  )
}
