"use client"

import { useEffect } from "react"
import { BonsaiIcon } from "@/components/ui/bonsai-icon"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-6">
        <BonsaiIcon size={22} className="text-destructive" />
      </div>
      <h1 className="font-heading text-5xl font-bold text-foreground mb-2">500</h1>
      <p className="text-lg font-medium text-foreground mb-1">Algo deu errado</p>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        Ocorreu um erro inesperado. Nossa equipe já foi notificada.
      </p>
      <button
        onClick={reset}
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Tentar novamente
      </button>
    </div>
  )
}
