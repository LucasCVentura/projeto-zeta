"use client"

import { useState } from "react"
import { X, Sparkles, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { analyzePhotoComparisonAction } from "@/actions/ai"
import { mediaUrl } from "@/lib/media-url"
import type { ClientPhoto } from "@/db/schema"

type Props = {
  photos: ClientPhoto[]
  onClose: () => void
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
}

export function PhotoComparison({ photos, onClose }: Props) {
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  async function handleAnalyze() {
    setIsAnalyzing(true)
    setAiError(null)
    const result = await analyzePhotoComparisonAction(photos.map((p) => p.id))
    setIsAnalyzing(false)
    if (!result.success) { setAiError(result.error ?? "Erro."); return }
    setAnalysis(result.analysis ?? null)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <p className="text-sm font-medium text-white">Comparação ({photos.length} fotos)</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
            {isAnalyzing ? "Analisando..." : "Analisar com IA"}
          </button>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Análise IA */}
      {(analysis || aiError) && (
        <div className="shrink-0 mx-4 mb-2 rounded-lg bg-white/10 px-4 py-3">
          {aiError
            ? <p className="text-xs text-white/60">{aiError}</p>
            : (
              <div className="flex items-start gap-2">
                <Sparkles size={13} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-white/90 leading-relaxed">{analysis}</p>
              </div>
            )
          }
        </div>
      )}

      {/* Fotos lado a lado */}
      <div className="flex flex-1 gap-0.5 overflow-hidden">
        {photos.map((photo, i) => (
          <div key={photo.id} className="relative flex-1 flex flex-col overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaUrl(photo.url)} alt={`Foto ${i + 1}`} className="flex-1 w-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-3 py-3">
              {photo.procedure && (
                <span className="inline-block rounded-full bg-primary/80 px-2 py-0.5 text-[10px] font-medium text-white mb-1">
                  {photo.procedure}
                </span>
              )}
              <p className="text-xs text-white/80">{formatDate(photo.takenAt)}</p>
              {photo.notes && <p className="text-xs text-white/60 truncate">{photo.notes}</p>}
            </div>
            <div className="absolute top-3 left-3 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-[11px] font-bold text-white">
              {i + 1}
            </div>
          </div>
        ))}
      </div>

      {/* Divisores verticais */}
      <div className="absolute inset-y-0 left-0 right-0 pointer-events-none" style={{ top: 49 }}>
        {photos.length === 2 && <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/20" />}
        {photos.length === 3 && (
          <>
            <div className="absolute left-1/3 top-0 bottom-0 w-0.5 bg-white/20" />
            <div className="absolute left-2/3 top-0 bottom-0 w-0.5 bg-white/20" />
          </>
        )}
      </div>
    </div>
  )
}

// Botão de seleção usado na timeline
export function CompareButton({
  selectedCount,
  onCompare,
  onClear,
}: {
  selectedCount: number
  onCompare: () => void
  onClear: () => void
}) {
  if (selectedCount === 0) return null

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{selectedCount} selecionada{selectedCount > 1 ? "s" : ""}</span>
      <Button size="sm" variant="outline" onClick={onClear} className="h-8 px-2">
        <X size={13} />
      </Button>
      {selectedCount >= 2 && (
        <Button size="sm" onClick={onCompare} className="h-8">
          Comparar
        </Button>
      )}
    </div>
  )
}
