"use client"

import { useState, useEffect } from "react"
import { analyzePhotoComparisonAction, suggestProceduresFromPhotosAction, suggestProceduresWithAnnotationsAction } from "@/actions/ai"
import { Sparkles, Loader2, X, ScanSearch, Crosshair } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  selectedIds: string[]
  onClearSelection: () => void
}

type Mode = "compare" | "suggest" | "annotate"

// ── Modal de resultado ────────────────────────────────────────────────────────

function ResultModal({ mode, analysis, annotatedImage, error, onClose }: {
  mode: Mode
  analysis: string | null
  annotatedImage?: string | null
  error: string | null
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  // Entra com fade+slide após montar
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  if (fullscreen && annotatedImage) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 p-4" onClick={() => setFullscreen(false)}>
        <img src={annotatedImage} alt="Análise visual ampliada" className="max-w-full max-h-full object-contain rounded-xl" />
        <button
          className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          onClick={() => setFullscreen(false)}
        >
          <X size={18} />
        </button>
      </div>
    )
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
        className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-xl overflow-hidden transition-all duration-250 flex flex-col max-h-[85vh]"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        }}
      >
        {/* Header com gradiente */}
        <div className="flex items-center justify-between px-5 py-4 bg-linear-to-r from-primary/10 to-transparent border-b border-border">
          <div className="flex items-center gap-2">
            {mode === "compare" ? <Sparkles size={16} className="text-primary" /> :
             mode === "annotate" ? <Crosshair size={16} className="text-primary" /> :
             <ScanSearch size={16} className="text-primary" />}
            <span className="font-medium text-sm">
              {mode === "compare" ? "Comparação de imagens" :
               mode === "annotate" ? "Análise visual da pele" :
               "Indicações de procedimentos"}
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
        <div className="px-5 py-4 flex-1 overflow-y-auto space-y-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <>
              {annotatedImage && (
                <div className="relative group cursor-zoom-in" onClick={() => setFullscreen(true)}>
                  <img src={annotatedImage} alt="Análise visual" className="w-full rounded-xl border border-border" />
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 group-hover:bg-black/30 transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-full transition-opacity">Toque para ampliar</span>
                  </div>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{analysis}</p>
            </>
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
  const [result, setResult] = useState<{ analysis: string | null; annotatedImage?: string | null; error: string | null } | null>(null)
  const [isLoading, setIsLoading] = useState<Mode | null>(null)

  const count = selectedIds.length
  const canCompare = count >= 2
  const canSuggest = count >= 1
  const canAnnotate = count === 1

  async function handleRun(mode: Mode) {
    setIsLoading(mode)
    setResult(null)

    let res: { success: boolean; analysis?: string; annotatedImage?: string; error?: string }

    if (mode === "compare") {
      res = await analyzePhotoComparisonAction(selectedIds)
    } else if (mode === "annotate") {
      res = await suggestProceduresWithAnnotationsAction(selectedIds[0])
    } else {
      res = await suggestProceduresFromPhotosAction(selectedIds)
    }

    setIsLoading(null)
    setActiveMode(mode)
    setResult({
      analysis: res.success ? (res.analysis ?? null) : null,
      annotatedImage: res.success ? (res.annotatedImage ?? null) : null,
      error: res.success ? null : (res.error ?? "Erro."),
    })
  }

  return (
    <>
      {result && activeMode && (
        <ResultModal
          mode={activeMode}
          analysis={result.analysis}
          annotatedImage={result.annotatedImage}
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
          {isLoading === "compare" ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} className="text-primary" />}
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
          {isLoading === "suggest" ? <Loader2 size={13} className="animate-spin" /> : <ScanSearch size={13} className="text-primary" />}
          {isLoading === "suggest" ? "Analisando..." : "Indicações com IA"}
          {canSuggest && <span className="ml-0.5 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">{count}</span>}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRun("annotate")}
          disabled={!canAnnotate || !!isLoading}
          className="gap-1.5"
          title={!canAnnotate ? "Selecione exatamente 1 foto" : undefined}
        >
          {isLoading === "annotate" ? <Loader2 size={13} className="animate-spin" /> : <Crosshair size={13} className="text-primary" />}
          {isLoading === "annotate" ? "Analisando..." : "Análise visual"}
        </Button>
      </div>
    </>
  )
}
