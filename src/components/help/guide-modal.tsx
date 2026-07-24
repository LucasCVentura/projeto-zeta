"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Guide } from "@/lib/guides"

export function GuideModal({ guide, onClose }: { guide: Guide | null; onClose: () => void }) {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (guide) {
      setStep(0)
      requestAnimationFrame(() => setVisible(true))
    } else {
      setVisible(false)
    }
  }, [guide])

  useEffect(() => {
    if (!guide) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previousOverflow }
  }, [guide])

  function handleClose() {
    setVisible(false)
    setTimeout(onClose, 200)
  }

  if (!guide) return null
  const Icon = guide.icon
  const total = guide.steps.length
  const current = guide.steps[step]
  const isLast = step === total - 1

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-20 sm:pb-4 overscroll-contain"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="absolute inset-0 bg-black/50 transition-opacity duration-200" style={{ opacity: visible ? 1 : 0 }} />
      <div
        className="relative w-full max-w-xl rounded-2xl bg-card border border-border shadow-xl flex flex-col max-h-[calc(100dvh-5rem)] sm:max-h-[85vh] transition-all duration-200"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Icon size={16} className="text-primary" />
            <span className="font-semibold text-sm">{guide.title}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground tabular-nums">
              Passo {step + 1}/{total}
            </span>
            <button onClick={handleClose} className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto overscroll-contain min-h-0 flex-1 px-5 py-5 space-y-4">
          {current.image && (
            <div className="relative w-full aspect-4/3 overflow-hidden rounded-lg border border-border bg-muted flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={current.image} alt={current.title} className="max-h-full max-w-full object-contain" />
            </div>
          )}
          <div className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
              {step + 1}
            </div>
            <div>
              <p className="text-sm font-medium">{current.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{current.description}</p>
            </div>
          </div>
        </div>

        {/* Rodapé — navegação */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft size={14} className="mr-1" />
            Anterior
          </Button>

          <div className="flex items-center gap-1.5">
            {guide.steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Ir pro passo ${i + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
              />
            ))}
          </div>

          <Button
            size="sm"
            onClick={() => (isLast ? handleClose() : setStep((s) => Math.min(total - 1, s + 1)))}
          >
            {isLast ? "Concluir" : "Próximo"}
            {!isLast && <ChevronRight size={14} className="ml-1" />}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
