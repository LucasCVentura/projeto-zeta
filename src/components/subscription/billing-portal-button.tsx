"use client"

import { useState } from "react"
import { createBillingPortalAction } from "@/actions/subscription"

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle() {
    setLoading(true)
    setError(null)
    const result = await createBillingPortalAction()
    if ("error" in result) {
      setError(result.error)
      setLoading(false)
      return
    }
    window.location.href = result.url
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handle}
        disabled={loading}
        className="w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
      >
        {loading ? "Abrindo portal..." : "Gerenciar assinatura"}
      </button>
      {error && <p className="text-center text-xs text-destructive">{error}</p>}
    </div>
  )
}
