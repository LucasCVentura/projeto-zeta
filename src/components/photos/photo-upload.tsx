"use client"

import { useState, useRef } from "react"
import { uploadClientPhotoAction } from "@/actions/photos"
import { getProceduresForBookingAction } from "@/actions/schedule"
import { Camera, ImagePlus, X, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Procedure = { id: string; name: string; price: number }

type QueueItem = { file: File; preview: string; done: boolean; error?: string }

type Props = {
  clientId: string
  onUploaded: () => void
}

export function PhotoUpload({ clientId, onUploaded }: Props) {
  const [open, setOpen] = useState(false)
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])
  const [procedureId, setProcedureId] = useState("")
  const [notes, setNotes] = useState("")
  const [takenAt, setTakenAt] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleOpen() {
    setOpen(true)
    getProceduresForBookingAction().then(setProcedures)
  }

  function handleClose() {
    setOpen(false)
    setQueue([])
    setProcedureId("")
    setNotes("")
    setTakenAt(new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }))
    setError(null)
  }

  function handleFiles(files: FileList) {
    setError(null)
    const newItems: QueueItem[] = []
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) continue
      if (f.size > 10 * 1024 * 1024) continue
      const preview = URL.createObjectURL(f)
      newItems.push({ file: f, preview, done: false })
    }
    if (newItems.length === 0) { setError("Nenhuma imagem válida selecionada (máx 10MB cada)."); return }
    setQueue((prev) => [...prev, ...newItems])
  }

  function removeFromQueue(idx: number) {
    setQueue((prev) => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function handleSubmit() {
    if (queue.length === 0) return
    setIsLoading(true)
    setError(null)

    let anyError = false
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i]
      if (item.done) continue
      const fd = new FormData()
      fd.append("photo", item.file)
      fd.append("takenAt", takenAt)
      if (procedureId) fd.append("procedureId", procedureId)
      if (notes) fd.append("notes", notes)

      const result = await uploadClientPhotoAction(clientId, fd)
      setQueue((prev) => prev.map((q, idx) =>
        idx === i ? { ...q, done: result.success, error: result.success ? undefined : (result.error ?? "Erro") } : q
      ))
      if (!result.success) anyError = true
    }

    setIsLoading(false)
    onUploaded()
    if (!anyError) handleClose()
  }

  if (!open) {
    return (
      <Button onClick={handleOpen} size="sm" className="gap-2">
        <ImagePlus size={15} /> Adicionar fotos
      </Button>
    )
  }

  return (
    <div className="surface basis-full space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Adicionar fotos</p>
        <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Seletores */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <button
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <Camera size={20} />
          <span className="text-xs font-medium">Câmera</span>
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-8 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
        >
          <ImagePlus size={20} />
          <span className="text-xs font-medium">Galeria</span>
        </button>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)} />
      </div>

      {/* Fila de fotos selecionadas */}
      {queue.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {queue.map((item, idx) => (
            <div key={idx} className="relative aspect-square overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.preview} alt="" className="h-full w-full object-cover" />
              {item.done && (
                <div className="absolute inset-0 bg-green-500/60 flex items-center justify-center">
                  <Check size={18} className="text-white" />
                </div>
              )}
              {item.error && (
                <div className="absolute inset-0 bg-destructive/60 flex items-center justify-center">
                  <X size={18} className="text-white" />
                </div>
              )}
              {!item.done && !isLoading && (
                <button
                  onClick={() => removeFromQueue(idx)}
                  className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Metadados */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Procedimento <span className="text-muted-foreground">(opcional)</span></Label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setProcedureId("")}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                !procedureId ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              Nenhum
            </button>
            {procedures.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProcedureId(p.id)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  procedureId === p.id ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Data da foto</Label>
          <Input type="date" value={takenAt} onChange={(e) => setTakenAt(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Observação <span className="text-muted-foreground">(opcional)</span></Label>
          <Input placeholder="Ex: antes do procedimento..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={queue.length === 0 || isLoading} className="w-full">
        {isLoading
          ? <><Loader2 size={15} className="animate-spin mr-2" />Salvando...</>
          : <><Check size={15} className="mr-2" />Salvar {queue.length} foto{queue.length !== 1 ? "s" : ""}</>
        }
      </Button>
    </div>
  )
}
