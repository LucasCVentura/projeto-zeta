"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star, X } from "lucide-react"

export function GoogleReviewNudge({ organizationId }: { organizationId: string }) {
  const storageKey = `kira:google-review-nudge-dismissed:${organizationId}`
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(localStorage.getItem(storageKey) !== "1")
  }, [storageKey])

  if (!visible) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
      <Star size={16} className="text-primary shrink-0" />
      <p className="flex-1 text-sm text-foreground/90">
        <span className="font-medium">Peça avaliações no Google automaticamente:</span>{" "}
        o Kira envia um agradecimento após cada atendimento — configure o link do seu Google Negócios e ele já vai junto.{" "}
        <Link href="/configuracoes/clinica" className="text-primary font-medium hover:underline underline-offset-4">
          Configurar agora
        </Link>
      </p>
      <button
        onClick={() => { localStorage.setItem(storageKey, "1"); setVisible(false) }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        title="Dispensar"
      >
        <X size={13} />
      </button>
    </div>
  )
}
