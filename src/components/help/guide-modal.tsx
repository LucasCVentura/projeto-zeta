"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import type { Guide } from "@/lib/guides"

export function GuideModal({ guide, onClose }: { guide: Guide | null; onClose: () => void }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (guide) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
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

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pb-20 sm:pb-4 overscroll-contain"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="absolute inset-0 bg-black/50 transition-opacity duration-200"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl flex flex-col max-h-[calc(100dvh-5rem)] sm:max-h-[80vh] transition-all duration-200"
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
          <button
            onClick={handleClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto overscroll-contain min-h-0 flex-1 px-5 py-4 space-y-4">
          {guide.steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-medium">{step.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  )
}
