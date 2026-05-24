"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink, FileText } from "lucide-react"

export function BoletoDisplay({ boletoNumber, voucherUrl, pdfUrl, expiresAt, amount }: {
  boletoNumber: string | null
  voucherUrl: string | null
  pdfUrl: string | null
  expiresAt: number | null
  amount: string
}) {
  const [copied, setCopied] = useState(false)

  async function copyNumber() {
    if (!boletoNumber) return
    await navigator.clipboard.writeText(boletoNumber)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const expiresDate = expiresAt
    ? new Date(expiresAt * 1000).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <FileText size={16} className="text-muted-foreground shrink-0" />
        <div>
          <p className="text-sm font-semibold">{amount}</p>
          {expiresDate && (
            <p className="text-xs text-muted-foreground">Vence em {expiresDate}</p>
          )}
        </div>
      </div>

      {boletoNumber && (
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Linha digitável:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-muted-foreground truncate">
              {boletoNumber}
            </div>
            <button
              onClick={copyNumber}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent transition-colors"
            >
              {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {voucherUrl && (
          <a
            href={voucherUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent transition-colors"
          >
            <ExternalLink size={13} />
            Ver boleto
          </a>
        )}
        {pdfUrl && (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-accent transition-colors"
          >
            <FileText size={13} />
            Baixar PDF
          </a>
        )}
      </div>
    </div>
  )
}
