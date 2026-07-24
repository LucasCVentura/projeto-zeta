"use client"

import { useState } from "react"
import { GUIDES, type Guide } from "@/lib/guides"
import { GuideModal } from "./guide-modal"

export function GuidesGrid() {
  const [selected, setSelected] = useState<Guide | null>(null)

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-sm">Guias</h2>
        <p className="text-sm text-muted-foreground mt-1">Passo a passo rápido de cada funcionalidade.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {GUIDES.map((guide) => {
          const Icon = guide.icon
          return (
            <button
              key={guide.key}
              onClick={() => setSelected(guide)}
              className="flex flex-col items-start gap-2 rounded-lg border border-border p-3 text-left hover:border-primary/40 hover:bg-primary/5 transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Icon size={16} className="text-primary" />
              </div>
              <p className="text-sm font-medium leading-snug">{guide.title}</p>
            </button>
          )
        })}
      </div>

      <GuideModal guide={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
