"use client"

import { useState } from "react"
import { analyzePhotoComparisonAction, analyzeClientEvolutionAction } from "@/actions/ai"
import { Sparkles, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

type ComparisonProps = { photoIds: string[]; mode: "comparison" }
type EvolutionProps = { clientId: string; mode: "evolution" }
type Props = ComparisonProps | EvolutionProps

export function AiPhotoAnalysis(props: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze() {
    setIsLoading(true)
    setError(null)
    setAnalysis(null)

    const result = props.mode === "comparison"
      ? await analyzePhotoComparisonAction(props.photoIds)
      : await analyzeClientEvolutionAction(props.clientId)

    setIsLoading(false)
    if (!result.success) { setError(result.error ?? "Erro ao analisar."); return }
    setAnalysis(result.analysis ?? null)
  }

  const label = props.mode === "comparison" ? "Analisar com IA" : "Analisar evolução com IA"

  return (
    <div className="space-y-3">
      <Button
        size="sm"
        variant="outline"
        onClick={handleAnalyze}
        disabled={isLoading}
        className="gap-1.5"
      >
        {isLoading
          ? <Loader2 size={13} className="animate-spin" />
          : <Sparkles size={13} className="text-primary" />
        }
        {isLoading ? "Analisando fotos..." : label}
      </Button>

      {error && <p className="text-xs text-muted-foreground">{error}</p>}

      {analysis && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-primary" />
              <span className="text-xs font-medium text-primary">Análise IA</span>
            </div>
            <button onClick={() => setAnalysis(null)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={13} />
            </button>
          </div>
          <p className="text-sm leading-relaxed">{analysis}</p>
        </div>
      )}
    </div>
  )
}
