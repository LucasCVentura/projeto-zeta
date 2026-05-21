"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem("cookie-consent", "accepted")
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4">
      <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card shadow-xl shadow-black/10 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground leading-relaxed">
          Usamos cookies essenciais para manter você autenticado. Não utilizamos cookies de rastreamento ou publicidade.{" "}
          <Link href="/privacidade" className="text-primary underline underline-offset-2 hover:opacity-80">
            Saiba mais
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/privacidade"
            className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Política de Privacidade
          </Link>
          <button
            onClick={accept}
            className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
