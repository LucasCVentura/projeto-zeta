"use client"

import { useState, useEffect } from "react"
import { analyzePhotoComparisonAction, suggestProceduresFromPhotosAction } from "@/actions/ai"
import { Sparkles, Loader2, X, ScanSearch } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  selectedIds: string[]
  onClearSelection: () => void
}

type Mode = "compare" | "suggest"

// ── Modal de resultado ────────────────────────────────────────────────────────

function ResultModal({ mode, analysis, error, onClose }: {
  mode: Mode
  analysis: string | null
  error: string | null
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)

  // Entra com fade+slide após montar
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-250"
        style={{ opacity: visible ? 1 : 0 }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-xl overflow-hidden transition-all duration-250"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        }}
      >
        {/* Header com gradiente */}
        <div className="flex items-center justify-between px-5 py-4 bg-linear-to-r from-primary/10 to-transparent border-b border-border">
          <div className="flex items-center gap-2">
            {mode === "compare"
              ? <Sparkles size={16} className="text-primary" />
              : <ScanSearch size={16} className="text-primary" />
            }
            <span className="font-medium text-sm">
              {mode === "compare" ? "Comparação de imagens" : "Indicações de procedimentos"}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Corpo */}
        <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{analysis}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-3 border-t border-border bg-muted/30">
          <Button size="sm" onClick={handleClose}>Fechar</Button>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AiPhotoAnalysis({ selectedIds }: Props) {
  const [activeMode, setActiveMode] = useState<Mode | null>(null)
  const [result, setResult] = useState<{ analysis: string | null; error: string | null } | null>(null)
  const [isLoading, setIsLoading] = useState<Mode | null>(null)

  const count = selectedIds.length
  const canCompare = count >= 2
  const canSuggest = count >= 1

  async function handleRun(mode: Mode) {
    setIsLoading(mode)
    setResult(null)

    const res = mode === "compare"
      ? await analyzePhotoComparisonAction(selectedIds)
      : await suggestProceduresFromPhotosAction(selectedIds)

    setIsLoading(null)
    setActiveMode(mode)
    setResult({ analysis: res.success ? (res.analysis ?? null) : null, error: res.success ? null : (res.error ?? "Erro.") })
  }

  return (
    <>
      {result && activeMode && (
        <ResultModal
          mode={activeMode}
          analysis={result.analysis}
          error={result.error}
          onClose={() => { setResult(null); setActiveMode(null) }}
        />
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRun("compare")}
          disabled={!canCompare || !!isLoading}
          className="gap-1.5"
          title={!canCompare ? "Selecione ao menos 2 fotos" : undefined}
        >
          {isLoading === "compare"
            ? <Loader2 size={13} className="animate-spin" />
            : <Sparkles size={13} className="text-primary" />
          }
          {isLoading === "compare" ? "Analisando..." : "Comparar com IA"}
          {canCompare && <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">{count}</span>}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRun("suggest")}
          disabled={!canSuggest || !!isLoading}
          className="gap-1.5"
        >
          {isLoading === "suggest"
            ? <Loader2 size={13} className="animate-spin" />
            : <ScanSearch size={13} className="text-primary" />
          }
          {isLoading === "suggest" ? "Analisando..." : "Indicações com IA"}
          {canSuggest && <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">{count}</span>}
        </Button>
      </div>
    </>
  )
}
