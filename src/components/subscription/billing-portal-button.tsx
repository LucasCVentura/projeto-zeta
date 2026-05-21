"use client"

import { useState } from "react"
import { createBillingPortalAction } from "@/actions/subscription"

export function BillingPortalButton() {
  const [loading, setLoading] = useState(false)

  async function handle() {
    setLoading(true)
    await createBillingPortalAction()
  }

  return (
    <button
      onClick={handle}
      disabled={loading}
      className="w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-accent disabled:opacity-50 transition-colors"
    >
      {loading ? "Abrindo portal..." : "Gerenciar assinatura"}
    </button>
  )
}
