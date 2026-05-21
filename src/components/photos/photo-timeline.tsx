"use client"

import { useState, useCallback } from "react"
import { getClientPhotosAction, deleteClientPhotoAction } from "@/actions/photos"
import { PhotoUpload } from "./photo-upload"
import { PhotoComparison, CompareButton } from "./photo-comparison"
import { AiPhotoAnalysis } from "./ai-photo-analysis"
import { Trash2, CheckSquare } from "lucide-react"
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

// Agrupa fotos por mês
function groupByMonth(photos: ClientPhoto[]) {
  const groups: Record<string, ClientPhoto[]> = {}
  for (const photo of photos) {
    const key = photo.takenAt.slice(0, 7) // "2024-05"
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

export function PhotoTimeline({ clientId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<ClientPhoto[]>(initialPhotos)
  const [selected, setSelected] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const updated = await getClientPhotosAction(clientId)
    setPhotos(updated)
  }, [clientId])

  function toggleSelect(photoId: string) {
    setSelected((prev) => {
      if (prev.includes(photoId)) return prev.filter((id) => id !== photoId)
      if (prev.length >= 3) return prev // máx 3
      return [...prev, photoId]
    })
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
      {comparing && selectedPhotos.length >= 2 && (
        <PhotoComparison
          photos={selectedPhotos}
          onClose={() => { setComparing(false); setSelected([]); setSelectMode(false) }}
        />
      )}

      <div className="space-y-6">
        {/* Toolbar */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <PhotoUpload clientId={clientId} onUploaded={refresh} />
              {photos.length >= 2 && (
                <button
                  onClick={() => { setSelectMode((v) => !v); setSelected([]) }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                    selectMode
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <CheckSquare size={13} />
                  {selectMode ? "Cancelar" : "Selecionar"}
                </button>
              )}
            </div>

            {selectMode && (
              <CompareButton
                selectedCount={selected.length}
                onCompare={() => setComparing(true)}
                onClear={() => setSelected([])}
              />
            )}
          </div>

          {photos.length >= 2 && !selectMode && (
            <AiPhotoAnalysis mode="evolution" clientId={clientId} />
          )}
        </div>

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
                {/* Mês */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {monthLabel(monthKey)}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{groupPhotos.length} foto{groupPhotos.length > 1 ? "s" : ""}</span>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {groupPhotos.map((photo) => {
                    const isSelected = selected.includes(photo.id)
                    const isDisabled = selectMode && selected.length >= 3 && !isSelected

                    return (
                      <div
                        key={photo.id}
                        className={cn(
                          "group relative aspect-square overflow-hidden rounded-xl border-2 transition-all cursor-pointer",
                          isSelected ? "border-primary shadow-md shadow-primary/20" : "border-transparent",
                          isDisabled ? "opacity-40 cursor-not-allowed" : ""
                        )}
                        onClick={() => selectMode && !isDisabled && toggleSelect(photo.id)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mediaUrl(photo.url)}
                          alt="Foto do cliente"
                          className="h-full w-full object-cover"
                        />

                        {/* Overlay selecionado */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow">
                              {selected.indexOf(photo.id) + 1}
                            </div>
                          </div>
                        )}

                        {/* Tag procedimento */}
                        {photo.procedure && (
                          <div className="absolute top-1.5 left-1.5">
                            <span className="inline-block rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                              {photo.procedure}
                            </span>
                          </div>
                        )}

                        {/* Hover actions (modo normal) */}
                        {!selectMode && (
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors">
                            <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(photo) }}
                                disabled={deleting === photo.id}
                                className="flex h-7 w-7 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-destructive transition-colors"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Data */}
                        <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent px-2 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[10px] text-white/90">{formatDate(photo.takenAt)}</p>
                        </div>
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
