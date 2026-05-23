"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { mediaUrl } from "@/lib/media-url"
import type { ClientPhoto } from "@/db/schema"

type Props = {
  photos: ClientPhoto[] // já ordenadas da mais antiga para a mais recente
  startIndex?: number
  onClose: () => void
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "short", year: "numeric",
  })
}

export function PhotoCarousel({ photos, startIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  const photo = photos[index]

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIndex((i) => Math.min(photos.length - 1, i + 1)), [photos.length])

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prev()
      else if (e.key === "ArrowRight") next()
      else if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [prev, next, onClose])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = Math.abs(e.changedTouches[0].clientY - touchStartY.current)
    touchStartX.current = null
    touchStartY.current = null
    // ignore vertical swipes
    if (dy > 60 || Math.abs(dx) < 40) return
    if (dx < 0) next()
    else prev()
  }

  if (!photo) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm tabular-nums">
            {index + 1} / {photos.length}
          </span>
          {photo.procedure && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-white/80">
              {photo.procedure}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Foto */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={mediaUrl(photo.url)}
          alt="Evolução"
          className="max-h-full max-w-full object-contain select-none"
          draggable={false}
        />

        {/* Setas laterais (desktop / tablets) */}
        {index > 0 && (
          <button
            onClick={prev}
            className="absolute left-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {index < photos.length - 1 && (
          <button
            onClick={next}
            className="absolute right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight size={22} />
          </button>
        )}
      </div>

      {/* Footer — data + notes + dots */}
      <div className="shrink-0 px-4 pb-6 pt-3 space-y-3">
        <div>
          <p className="text-white font-medium text-sm">{formatDate(photo.takenAt)}</p>
          {photo.notes && (
            <p className="text-white/60 text-xs mt-0.5">{photo.notes}</p>
          )}
        </div>

        {/* Dots de navegação */}
        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-1">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className="shrink-0 rounded-full transition-all"
                style={{
                  width: i === index ? 20 : 6,
                  height: 6,
                  backgroundColor: i === index ? "white" : "rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
