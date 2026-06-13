"use client"

import { useState } from "react"
import { updateClientConsentRecordAction } from "@/actions/consent-terms"
import { cn } from "@/lib/utils"
import type { ConsentTerm, ConsentTermRecord } from "@/db/schema"

type TermWithRecord = ConsentTerm & { record: ConsentTermRecord | null }

export function ClientConsentSection({
  clientId,
  terms: initial,
}: {
  clientId: string
  terms: TermWithRecord[]
}) {
  const [terms, setTerms] = useState(initial)
  const [saving, setSaving] = useState<string | null>(null)

  if (terms.length === 0) return null

  async function handleChange(termId: string, value: boolean | null) {
    setSaving(termId)
    await updateClientConsentRecordAction(clientId, termId, value)
    setTerms(prev =>
      prev.map(t =>
        t.id === termId
          ? { ...t, record: value === null ? null : { ...(t.record ?? { id: "", clientId, orgId: "", termId }), accepted: value, respondedAt: new Date() } }
          : t
      )
    )
    setSaving(null)
  }

  return (
    <div className="surface space-y-3">
      <p className="text-sm font-medium">Termos de consentimento</p>
      <div className="space-y-3">
        {terms.map(term => {
          const accepted = term.record?.accepted ?? null
          return (
            <div key={term.id} className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{term.title}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleChange(term.id, accepted === true ? null : true)}
                  disabled={saving === term.id}
                  className={cn(
                    "flex-1 rounded-lg border py-1.5 text-xs transition-colors",
                    accepted === true
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  Aceito
                </button>
                <button
                  onClick={() => handleChange(term.id, accepted === false ? null : false)}
                  disabled={saving === term.id}
                  className={cn(
                    "flex-1 rounded-lg border py-1.5 text-xs transition-colors",
                    accepted === false
                      ? "border-red-400 bg-red-50 text-red-600 font-medium"
                      : "border-border text-muted-foreground hover:border-red-300/40"
                  )}
                >
                  Não aceito
                </button>
              </div>
              {accepted !== null && term.record?.respondedAt ? (
                <p className="text-[10px] text-muted-foreground">
                  {accepted ? "Aceito" : "Recusado"} em{" "}
                  {new Date(term.record.respondedAt).toLocaleDateString("pt-BR", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </p>
              ) : accepted === null ? (
                <p className="text-[10px] text-muted-foreground">Sem resposta</p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
