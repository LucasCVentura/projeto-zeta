"use client"

import { useState, useCallback } from "react"
import { getClientPhotosAction, deleteClientPhotoAction } from "@/actions/photos"
import { PhotoUpload } from "./photo-upload"
import { PhotoComparison, CompareButton } from "./photo-comparison"
import { AiPhotoAnalysis } from "./ai-photo-analysis"
import { PhotoCarousel } from "./photo-carousel"
import { Trash2, Loader2, Play, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { mediaUrl } from "@/lib/media-url"
import type { ClientPhoto } from "@/db/schema"

type Props = {
  clientId: string
  initialPhotos: ClientPhoto[]
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "short", year: "numeric",
  })
}

function groupByMonth(photos: ClientPhoto[]) {
  const groups: Record<string, ClientPhoto[]> = {}
  for (const photo of photos) {
    const key = photo.takenAt.slice(0, 7)
    if (!groups[key]) groups[key] = []
    groups[key].push(photo)
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

function monthLabel(key: string) {
  const [year, month] = key.split("-")
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
  return `${months[Number(month) - 1]} ${year}`
}

function PhotoThumb({ url }: { url: string }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="Foto do cliente"
        className={cn("h-full w-full object-cover transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
        onLoad={() => setLoaded(true)}
      />
    </>
  )
}

export function PhotoTimeline({ clientId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<ClientPhoto[]>(initialPhotos)
  const [selected, setSelected] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [carouselIndex, setCarouselIndex] = useState<number | null>(null)

  const chronological = [...photos].sort((a, b) => a.takenAt.localeCompare(b.takenAt))
  const selectMode = selected.length > 0

  const refresh = useCallback(async () => {
    const updated = await getClientPhotosAction(clientId)
    setPhotos(updated)
  }, [clientId])

  function toggleSelect(photoId: string) {
    setSelected((prev) =>
      prev.includes(photoId) ? prev.filter((id) => id !== photoId) : [...prev, photoId]
    )
  }

  async function handleDelete(photo: ClientPhoto) {
    if (!confirm("Remover esta foto?")) return
    setDeleting(photo.id)
    await deleteClientPhotoAction(photo.id, clientId)
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
    setSelected((prev) => prev.filter((id) => id !== photo.id))
    setDeleting(null)
  }

  const selectedPhotos = photos.filter((p) => selected.includes(p.id))
  const groups = groupByMonth(photos)

  return (
    <>
      {carouselIndex !== null && (
        <PhotoCarousel
          photos={chronological}
          startIndex={carouselIndex}
          onClose={() => setCarouselIndex(null)}
        />
      )}

      {comparing && selectedPhotos.length >= 2 && (
        <PhotoComparison
          photos={selectedPhotos}
          onClose={() => { setComparing(false); setSelected([]) }}
        />
      )}

      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PhotoUpload clientId={clientId} onUploaded={refresh} />
            {photos.length >= 2 && !selectMode && (
              <button
                onClick={() => setCarouselIndex(0)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                <Play size={12} />
                Evolução
              </button>
            )}
          </div>

          {/* Barra de seleção ativa */}
          {selectMode && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {selected.length} selecionada{selected.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setSelected([])}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
              >
                <X size={12} /> Limpar
              </button>
            </div>
          )}
        </div>

        {/* Botões de IA — aparecem apenas com seleção */}
        {selectMode && (
          <AiPhotoAnalysis
            selectedIds={selected}
            onClearSelection={() => setSelected([])}
          />
        )}

        {/* Hint de seleção */}
        {!selectMode && photos.length >= 1 && (
          <p className="text-xs text-muted-foreground">
            Toque em uma foto para selecioná-la e usar as ferramentas de IA.
          </p>
        )}

        {photos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Nenhuma foto ainda</p>
              <p className="text-xs text-muted-foreground mt-0.5">Adicione a primeira foto para iniciar a timeline.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {groups.map(([monthKey, groupPhotos]) => (
              <div key={monthKey} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {monthLabel(monthKey)}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{groupPhotos.length} foto{groupPhotos.length > 1 ? "s" : ""}</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {groupPhotos.map((photo) => {
                    const isSelected = selected.includes(photo.id)
                    const selectionOrder = selected.indexOf(photo.id) + 1

                    return (
                      <div
                        key={photo.id}
                        className={cn(
                          "group relative aspect-square overflow-hidden rounded-xl border-2 transition-all cursor-pointer",
                          isSelected ? "border-primary shadow-md shadow-primary/20" : "border-transparent"
                        )}
                        onClick={() => toggleSelect(photo.id)}
                      >
                        <PhotoThumb url={mediaUrl(photo.url)} />

                        {/* Overlay selecionado */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow">
                              {selectionOrder}
                            </div>
                          </div>
                        )}

                        {/* Tag procedimento */}
                        {photo.procedure && !isSelected && (
                          <div className="absolute top-1.5 left-1.5">
                            <span className="inline-block rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                              {photo.procedure}
                            </span>
                          </div>
                        )}

                        {/* Botão excluir — sempre visível, some quando em modo seleção */}
                        {!selectMode && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(photo) }}
                            disabled={deleting === photo.id}
                            className="absolute top-1.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-lg bg-black/50 text-white hover:bg-destructive transition-colors disabled:opacity-40"
                          >
                            {deleting === photo.id
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Trash2 size={12} />
                            }
                          </button>
                        )}

                        {/* Data no hover */}
                        {!isSelected && (
                          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-[10px] text-white/90">{formatDate(photo.takenAt)}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
