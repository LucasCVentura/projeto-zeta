"use client"

import { useState } from "react"
import { suggestNextAppointmentAction } from "@/actions/ai"
import { Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AiSuggestion({ clientId }: { clientId: string }) {
  const [suggestion, setSuggestion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSuggest() {
    setIsLoading(true)
    setError(null)
    setSuggestion(null)
    const result = await suggestNextAppointmentAction(clientId)
    setIsLoading(false)
    if (!result.success) { setError(result.error ?? "Erro ao gerar sugestão."); return }
    setSuggestion(result.suggestion ?? null)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Sugestão de retorno</p>
        <Button
          size="sm"
          variant="outline"
          onClick={handleSuggest}
          disabled={isLoading}
          className="gap-1.5 text-xs"
        >
          {isLoading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Sparkles size={13} className="text-primary" />
          )}
          {isLoading ? "Analisando..." : "Sugerir com IA"}
        </Button>
      </div>

      {error && (
        <p className="text-xs text-muted-foreground">{error}</p>
      )}

      {suggestion && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="text-primary mt-0.5 shrink-0" />
            <p className="leading-relaxed">{suggestion}</p>
          </div>
        </div>
      )}
    </div>
  )
}
