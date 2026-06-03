"use client"

import { useState, useEffect, useRef } from "react"
import { analyzePhotoComparisonAction, suggestProceduresFromPhotosAction, suggestProceduresWithAnnotationsAction } from "@/actions/ai"
import { Sparkles, Loader2, X, ScanSearch, Crosshair } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mediaUrl } from "@/lib/media-url"

type Props = {
  selectedIds: string[]
  onClearSelection: () => void
}

type Mode = "compare" | "suggest" | "annotate"

type Area = { label: string; x: number; y: number; procedure: string }

const COLORS = ["#9B7DFF", "#FF7DB8", "#7DCCFF", "#7DFFC4", "#FFD97D"]

// ── Canvas de anotações (client-side, sem dependência de fonte do servidor) ───

function AnnotatedCanvas({ imageUrl, areas }: { imageUrl: string; areas: Area[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      setSize({ w: img.naturalWidth, h: img.naturalHeight })
      ctx.drawImage(img, 0, 0)

      const W = img.naturalWidth
      const H = img.naturalHeight
      const r = Math.round(Math.min(W, H) * 0.055)
      const fontSize = Math.round(Math.min(W, H) * 0.018)
      ctx.font = `700 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

      areas.forEach((area, i) => {
        const cx = Math.round((area.x / 100) * W)
        const cy = Math.round((area.y / 100) * H)
        const color = COLORS[i % COLORS.length]

        // Círculo tracejado
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = color
        ctx.lineWidth = Math.max(2, Math.round(Math.min(W, H) * 0.004))
        ctx.setLineDash([8, 4])
        ctx.stroke()
        ctx.setLineDash([])

        // Ponto central
        ctx.beginPath()
        ctx.arc(cx, cy, 4, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        // Linha + label
        const labelX = cx + r + 10
        const labelY = cy
        const textW = ctx.measureText(area.label).width
        const padH = fontSize * 0.55
        const padV = fontSize * 0.4
        const boxW = textW + padH * 2
        const boxH = fontSize + padV * 2

        // Linha de conexão
        ctx.beginPath()
        ctx.moveTo(cx + r, cy)
        ctx.lineTo(labelX, cy)
        ctx.strokeStyle = color
        ctx.lineWidth = Math.max(1.5, Math.round(Math.min(W, H) * 0.002))
        ctx.stroke()

        // Fundo do label
        ctx.fillStyle = "rgba(8, 6, 15, 0.85)"
        ctx.beginPath()
        const bx = labelX, by = labelY - boxH / 2, rr = 6
        ctx.moveTo(bx + rr, by)
        ctx.lineTo(bx + boxW - rr, by)
        ctx.arcTo(bx + boxW, by, bx + boxW, by + rr, rr)
        ctx.lineTo(bx + boxW, by + boxH - rr)
        ctx.arcTo(bx + boxW, by + boxH, bx + boxW - rr, by + boxH, rr)
        ctx.lineTo(bx + rr, by + boxH)
        ctx.arcTo(bx, by + boxH, bx, by + boxH - rr, rr)
        ctx.lineTo(bx, by + rr)
        ctx.arcTo(bx, by, bx + rr, by, rr)
        ctx.closePath()
        ctx.fill()

        // Texto
        ctx.fillStyle = color
        ctx.textBaseline = "middle"
        ctx.fillText(area.label, labelX + padH, labelY)
      })
    }
    img.src = mediaUrl(imageUrl)
  }, [imageUrl, areas])

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl border border-border"
      style={{ aspectRatio: size ? `${size.w}/${size.h}` : "auto" }}
    />
  )
}

// ── Modal de resultado ────────────────────────────────────────────────────────

function ResultModal({ mode, analysis, imageUrl, areas, error, onClose }: {
  mode: Mode
  analysis: string | null
  imageUrl?: string | null
  areas?: Area[] | null
  error: string | null
  onClose: () => void
}) {
  const [visible, setVisible] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(t)
  }, [])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  if (fullscreen && imageUrl && areas) {
    return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 p-4" onClick={() => setFullscreen(false)}>
        <div className="max-w-3xl w-full">
          <AnnotatedCanvas imageUrl={imageUrl} areas={areas} />
        </div>
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
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-250"
        style={{ opacity: visible ? 1 : 0 }}
      />

      <div
        className="relative w-full max-w-md rounded-2xl bg-card border border-border shadow-xl overflow-hidden transition-all duration-250 flex flex-col max-h-[85vh]"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        }}
      >
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

        <div className="px-5 py-4 flex-1 overflow-y-auto space-y-4">
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : (
            <>
              {imageUrl && areas?.length && (
                <div className="relative group cursor-zoom-in" onClick={() => setFullscreen(true)}>
                  <AnnotatedCanvas imageUrl={imageUrl} areas={areas} />
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/0 group-hover:bg-black/30 transition-colors">
                    <span className="opacity-0 group-hover:opacity-100 text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-full transition-opacity">Toque para ampliar</span>
                  </div>
                </div>
              )}
              <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/90">{analysis}</p>
            </>
          )}
        </div>

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
  const [result, setResult] = useState<{
    analysis: string | null
    imageUrl?: string | null
    areas?: Area[] | null
    error: string | null
  } | null>(null)
  const [isLoading, setIsLoading] = useState<Mode | null>(null)

  const count = selectedIds.length
  const canCompare = count >= 2
  const canSuggest = count >= 1
  const canAnnotate = count === 1

  async function handleRun(mode: Mode) {
    setIsLoading(mode)
    setResult(null)

    if (mode === "compare") {
      const res = await analyzePhotoComparisonAction(selectedIds)
      setResult({
        analysis: res.success ? (res.analysis ?? null) : null,
        error: res.success ? null : (res.error ?? "Erro."),
      })
    } else if (mode === "annotate") {
      const res = await suggestProceduresWithAnnotationsAction(selectedIds[0])
      setResult({
        analysis: res.success ? (res.analysis ?? null) : null,
        imageUrl: res.success ? (res.imageUrl ?? null) : null,
        areas: res.success ? (res.areas ?? null) : null,
        error: res.success ? null : (res.error ?? "Erro."),
      })
    } else {
      const res = await suggestProceduresFromPhotosAction(selectedIds)
      setResult({
        analysis: res.success ? (res.analysis ?? null) : null,
        error: res.success ? null : (res.error ?? "Erro."),
      })
    }

    setIsLoading(null)
    setActiveMode(mode)
  }

  return (
    <>
      {result && activeMode && (
        <ResultModal
          mode={activeMode}
          analysis={result.analysis}
          imageUrl={result.imageUrl}
          areas={result.areas}
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
