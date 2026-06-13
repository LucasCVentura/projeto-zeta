"use client"

import { useState } from "react"
import { updateImageConsentAction } from "@/actions/clients"
import { cn } from "@/lib/utils"
import { Camera, CameraOff, Pencil, X } from "lucide-react"

type Props = {
  clientId: string
  consent: boolean | null
  consentAt: Date | null
}

export function ImageConsentEditor({ clientId, consent, consentAt }: Props) {
  const [editing, setEditing] = useState(false)
  const [current, setCurrent] = useState<boolean | null>(consent)
  const [currentAt, setCurrentAt] = useState<Date | null>(consentAt)
  const [saving, setSaving] = useState(false)

  async function handleSet(value: boolean | null) {
    setSaving(true)
    await updateImageConsentAction(clientId, value)
    setCurrent(value)
    setCurrentAt(value !== null ? new Date() : null)
    setSaving(false)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => handleSet(true)}
          disabled={saving}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors",
            current === true
              ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium"
              : "border-border text-muted-foreground hover:border-emerald-400"
          )}
        >
          <Camera size={12} /> Autorizado
        </button>
        <button
          onClick={() => handleSet(false)}
          disabled={saving}
          className={cn(
            "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors",
            current === false
              ? "border-red-400 bg-red-50 text-red-600 font-medium"
              : "border-border text-muted-foreground hover:border-red-400"
          )}
        >
          <CameraOff size={12} /> Não autorizado
        </button>
        <button
          onClick={() => handleSet(null)}
          disabled={saving}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Limpar
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {current === true && (
        <span className="flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-1 text-xs font-medium">
          <Camera size={11} /> Imagem autorizada
          {currentAt && <span className="opacity-60 ml-1">{new Date(currentAt).toLocaleDateString("pt-BR")}</span>}
        </span>
      )}
      {current === false && (
        <span className="flex items-center gap-1 rounded-full bg-red-100 text-red-600 px-2.5 py-1 text-xs font-medium">
          <CameraOff size={11} /> Imagem não autorizada
          {currentAt && <span className="opacity-60 ml-1">{new Date(currentAt).toLocaleDateString("pt-BR")}</span>}
        </span>
      )}
      {current === null && (
        <span className="flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2.5 py-1 text-xs">
          <Camera size={11} /> Imagem — não respondido
        </span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Editar autorização"
      >
        <Pencil size={12} />
      </button>
    </div>
  )
}
