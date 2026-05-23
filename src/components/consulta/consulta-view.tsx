"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { saveConsultaNotesAction } from "@/actions/consulta"
import { uploadClientPhotoAction, getClientPhotosAction, deleteClientPhotoAction } from "@/actions/photos"
import { PhotoComparison, CompareButton } from "@/components/photos/photo-comparison"
import { CompleteAppointmentModal } from "@/components/agenda/complete-appointment-modal"
import { ArrowLeft, Camera, CheckCircle2, Save, Images, RotateCcw, Check, Trash2 } from "lucide-react"
import { StatusBadge } from "@/components/agenda/status-badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { mediaUrl } from "@/lib/media-url"
import Link from "next/link"
import type { ClientPhoto } from "@/db/schema"

type Appointment = {
  id: string
  date: string
  startTime: string
  status: string
  notes: string | null
  procedure: string | null
  procedureId: string | null
  clientId: string
  clientName: string
  procedurePrice: number | null
}

type Props = {
  appointment: Appointment
  allClientPhotos: ClientPhoto[]
}

function formatTime(t: string) { return t.slice(0, 5) }
function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  })
}

export function ConsultaView({ appointment, allClientPhotos: initialPhotos }: Props) {
  const router = useRouter()
  const [notes, setNotes] = useState(appointment.notes ?? "")
  const [notesSaved, setNotesSaved] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  const [allPhotos, setAllPhotos] = useState<ClientPhoto[]>(initialPhotos)
  const [sessionPhotoIds, setSessionPhotoIds] = useState<string[]>([])

  const [selected, setSelected] = useState<string[]>([])
  const [selectMode, setSelectMode] = useState(false)
  const [comparing, setComparing] = useState(false)

  const [isUploading, setIsUploading] = useState(false)
  const [completeModal, setCompleteModal] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)

  const cameraRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)
  const isCompleted = appointment.status === "completed"
  const canComplete = !["completed", "cancelled", "missed"].includes(appointment.status)

  const sessionPhotos = allPhotos.filter((p) => sessionPhotoIds.includes(p.id))
  const previousPhotos = allPhotos.filter((p) => !sessionPhotoIds.includes(p.id))

  async function refreshPhotos() {
    const updated = await getClientPhotosAction(appointment.clientId)
    setAllPhotos(updated)
  }

  function handleCapture(file: File) {
    if (!file.type.startsWith("image/")) return
    const url = URL.createObjectURL(file)
    setPendingFile(file)
    setPendingPreview(url)
    if (cameraRef.current) cameraRef.current.value = ""
  }

  function handleRetake() {
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingFile(null)
    setPendingPreview(null)
    setTimeout(() => cameraRef.current?.click(), 50)
  }

  async function handleUpload(file: File) {
    if (!file.type.startsWith("image/")) return
    setIsUploading(true)
    if (uploadRef.current) uploadRef.current.value = ""

    const fd = new FormData()
    fd.append("photo", file)
    fd.append("takenAt", appointment.date)
    if (appointment.procedureId) fd.append("procedureId", appointment.procedureId)

    const result = await uploadClientPhotoAction(appointment.clientId, fd)
    setIsUploading(false)
    if (result.success && result.photo) {
      setSessionPhotoIds((prev) => [...prev, result.photo!.id])
      await refreshPhotos()
    }
  }

  async function handleConfirmPhoto() {
    if (!pendingFile) return
    setIsUploading(true)
    if (pendingPreview) URL.revokeObjectURL(pendingPreview)
    setPendingFile(null)
    setPendingPreview(null)

    const fd = new FormData()
    fd.append("photo", pendingFile)
    fd.append("takenAt", appointment.date)
    if (appointment.procedureId) fd.append("procedureId", appointment.procedureId)

    const result = await uploadClientPhotoAction(appointment.clientId, fd)
    setIsUploading(false)
    if (result.success && result.photo) {
      setSessionPhotoIds((prev) => [...prev, result.photo!.id])
      await refreshPhotos()
    }
  }

  async function handleDeletePhoto(photoId: string) {
    await deleteClientPhotoAction(photoId, appointment.clientId)
    setSessionPhotoIds((prev) => prev.filter((id) => id !== photoId))
    setSelected((prev) => prev.filter((id) => id !== photoId))
    await refreshPhotos()
  }

  async function saveNotes() {
    setIsSavingNotes(true)
    await saveConsultaNotesAction(appointment.id, notes)
    setIsSavingNotes(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2500)
  }

  function toggleSelect(photoId: string) {
    setSelected((prev) => {
      if (prev.includes(photoId)) return prev.filter((id) => id !== photoId)
      if (prev.length >= 3) return prev
      return [...prev, photoId]
    })
  }

  const selectedPhotos = allPhotos.filter((p) => selected.includes(p.id))

  return (
    <>
      {/* Overlay de alinhamento facial */}
      {pendingPreview && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black">
          <div className="relative flex-1 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pendingPreview} alt="Preview" className="h-full w-full object-cover" />

            {/* SVG overlay: grade terços + oval facial */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full pointer-events-none"
            >
              {/* Linhas de terços — verticais */}
              <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="white" strokeWidth="0.3" strokeOpacity="0.4" />
              <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="white" strokeWidth="0.3" strokeOpacity="0.4" />
              {/* Linhas de terços — horizontais */}
              <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="white" strokeWidth="0.3" strokeOpacity="0.4" />
              <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="white" strokeWidth="0.3" strokeOpacity="0.4" />
              {/* Oval facial */}
              <ellipse
                cx="50" cy="48"
                rx="28" ry="36"
                fill="none"
                stroke="white"
                strokeWidth="0.6"
                strokeOpacity="0.7"
                strokeDasharray="3 2"
              />
            </svg>

            {/* Label */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 backdrop-blur-sm">
              <p className="text-xs text-white/80 text-center">Alinhe o rosto dentro do oval</p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 px-6 py-5 shrink-0">
            <button
              onClick={handleRetake}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              <RotateCcw size={16} />
              Tirar novamente
            </button>
            <button
              onClick={handleConfirmPhoto}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Check size={16} />
              Confirmar
            </button>
          </div>
        </div>
      )}

      {comparing && selectedPhotos.length >= 2 && (
        <PhotoComparison
          photos={selectedPhotos}
          onClose={() => { setComparing(false); setSelected([]); setSelectMode(false) }}
        />
      )}

      <CompleteAppointmentModal
        open={completeModal}
        onClose={() => {
          setCompleteModal(false)
          router.push("/agenda")
        }}
        appointmentId={appointment.id}
        date={appointment.date}
        clientName={appointment.clientName}
        procedure={appointment.procedure ?? undefined}
        procedurePrice={appointment.procedurePrice ?? undefined}
      />

      <div className={cn("container-page max-w-xl py-6 space-y-6", canComplete && "pb-32")}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <Link
            href="/agenda"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={14} /> Agenda
          </Link>
        </div>

        <div className="surface space-y-1">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold">{appointment.clientName}</h2>
              {appointment.procedure && (
                <span className="inline-block mt-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {appointment.procedure}
                </span>
              )}
            </div>
            <div className="text-right shrink-0 space-y-1">
              <p className="text-sm font-semibold">{formatTime(appointment.startTime)}</p>
              <p className="text-xs text-muted-foreground capitalize">{formatDate(appointment.date)}</p>
              {appointment.status && <StatusBadge status={appointment.status as "waiting" | "confirmed" | "completed" | "missed" | "cancelled"} />}
            </div>
          </div>
        </div>

        {/* Anotações */}
        <div className="surface space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Anotações da consulta</p>
            <button
              onClick={saveNotes}
              disabled={isSavingNotes}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                notesSaved ? "text-green-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Save size={13} />
              {notesSaved ? "Salvo!" : isSavingNotes ? "Salvando..." : "Salvar"}
            </button>
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Evolução, observações, reações ao procedimento..."
            rows={5}
            className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Fotos da sessão */}
        <div className="surface space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Fotos desta consulta</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => uploadRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
              >
                <Images size={13} />
                Anexar
              </button>
              <button
                onClick={() => cameraRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                <Camera size={13} />
                {isUploading ? "Salvando..." : "Tirar foto"}
              </button>
            </div>
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleCapture(e.target.files[0])}
            />
            <input
              ref={uploadRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            />
          </div>

          {sessionPhotos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Camera size={20} className="text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">Nenhuma foto tirada nesta consulta ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {sessionPhotos.map((photo) => (
                <PhotoThumb
                  key={photo.id}
                  photo={photo}
                  isSelected={selected.includes(photo.id)}
                  isDisabled={selectMode && selected.length >= 3 && !selected.includes(photo.id)}
                  selectMode={selectMode}
                  selectedIndex={selected.indexOf(photo.id)}
                  onSelect={() => toggleSelect(photo.id)}
                  onDelete={() => handleDeletePhoto(photo.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Fotos anteriores */}
        {previousPhotos.length > 0 && (
          <div className="surface space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Histórico de fotos</p>
              <Link
                href={`/clientes/${appointment.clientId}/fotos`}
                className="text-xs text-primary hover:underline underline-offset-4"
              >
                Ver todas
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {previousPhotos.slice(0, 6).map((photo) => (
                <PhotoThumb
                  key={photo.id}
                  photo={photo}
                  isSelected={selected.includes(photo.id)}
                  isDisabled={selectMode && selected.length >= 3 && !selected.includes(photo.id)}
                  selectMode={selectMode}
                  selectedIndex={selected.indexOf(photo.id)}
                  onSelect={() => toggleSelect(photo.id)}
                  onDelete={() => handleDeletePhoto(photo.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Toolbar de comparação */}
        {allPhotos.length >= 2 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setSelectMode((v) => !v); setSelected([]) }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                selectMode
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <Images size={15} />
              {selectMode ? "Cancelar comparação" : "Comparar fotos"}
            </button>

            {selectMode && (
              <CompareButton
                selectedCount={selected.length}
                onCompare={() => setComparing(true)}
                onClear={() => setSelected([])}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer fixo */}
      {canComplete && (
        <div className="fixed bottom-16 sm:bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur px-4 py-3 lg:left-60">
          <Button
            onClick={() => setCompleteModal(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            <CheckCircle2 size={18} className="mr-2" />
            Concluir atendimento
          </Button>
        </div>
      )}
    </>
  )
}

function PhotoThumb({
  photo, isSelected, isDisabled, selectMode, selectedIndex, onSelect, onDelete,
}: {
  photo: ClientPhoto
  isSelected: boolean
  isDisabled: boolean
  selectMode: boolean
  selectedIndex: number
  onSelect: () => void
  onDelete: () => void
}) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm("Excluir esta foto?")) return
    setDeleting(true)
    await onDelete()
  }

  return (
    <div
      onClick={() => selectMode && !isDisabled && onSelect()}
      className={cn(
        "group relative aspect-square overflow-hidden rounded-xl border-2 transition-all",
        selectMode ? "cursor-pointer" : "cursor-default",
        isSelected ? "border-primary shadow-md shadow-primary/20" : "border-transparent",
        isDisabled ? "opacity-40 cursor-not-allowed" : ""
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mediaUrl(photo.url)} alt="" className="h-full w-full object-cover" />

      {isSelected && (
        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-bold shadow">
            {selectedIndex + 1}
          </div>
        </div>
      )}

      {photo.procedure && (
        <div className="absolute top-1.5 left-1.5">
          <span className="inline-block rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {photo.procedure}
          </span>
        </div>
      )}

      {!selectMode && (
        <>
          <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/60 to-transparent px-2 py-2">
            <p className="text-[10px] text-white/90">
              {new Date(photo.takenAt + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/40 text-white/70 hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
          >
            <Trash2 size={11} />
          </button>
        </>
      )}
    </div>
  )
}
