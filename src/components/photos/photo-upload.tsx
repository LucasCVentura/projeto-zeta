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

type Props = {
  clientId: string
  onUploaded: () => void
}

export function PhotoUpload({ clientId, onUploaded }: Props) {
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
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
    setPreview(null)
    setFile(null)
    setProcedureId("")
    setNotes("")
    setTakenAt(new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }))
    setError(null)
  }

  function handleFile(f: File) {
    if (!f.type.startsWith("image/")) { setError("Formato inválido."); return }
    if (f.size > 10 * 1024 * 1024) { setError("Máximo 10MB."); return }
    setError(null)
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  async function handleSubmit() {
    if (!file) return
    setIsLoading(true)
    setError(null)
    const fd = new FormData()
    fd.append("photo", file)
    fd.append("takenAt", takenAt)
    if (procedureId) fd.append("procedureId", procedureId)
    if (notes) fd.append("notes", notes)

    const result = await uploadClientPhotoAction(clientId, fd)
    setIsLoading(false)
    if (!result.success) { setError(result.error ?? "Erro ao salvar."); return }
    handleClose()
    onUploaded()
  }

  if (!open) {
    return (
      <Button onClick={handleOpen} size="sm" className="gap-2">
        <ImagePlus size={15} /> Adicionar foto
      </Button>
    )
  }

  return (
    <div className="surface space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Nova foto</p>
        <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X size={16} />
        </button>
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {/* Preview ou seletores */}
      {!preview ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-6 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Camera size={22} />
            <span className="text-xs font-medium">Câmera</span>
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-6 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
          >
            <ImagePlus size={22} />
            <span className="text-xs font-medium">Galeria</span>
          </button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Preview" className="w-full rounded-xl object-cover max-h-64" />
          <button
            onClick={() => { setPreview(null); setFile(null) }}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          >
            <X size={13} />
          </button>
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

      <Button onClick={handleSubmit} disabled={!file || isLoading} className="w-full">
        {isLoading ? <><Loader2 size={15} className="animate-spin mr-2" />Salvando...</> : <><Check size={15} className="mr-2" />Salvar foto</>}
      </Button>
    </div>
  )
}
