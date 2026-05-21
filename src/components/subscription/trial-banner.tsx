"use client"

import { useState } from "react"
import Link from "next/link"

export function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const urgent = daysLeft <= 2

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2.5 text-sm ${urgent ? "bg-red-500/10 text-red-700 dark:text-red-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400"}`}>
      <p className="font-medium">
        {daysLeft === 0
          ? "Seu período de teste termina hoje."
          : `Seu período de teste termina em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}.`}
        {" "}
        <Link href="/assinar" className="underline underline-offset-2 hover:opacity-80">
          Assinar agora
        </Link>
      </p>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Fechar"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
