"use client"

import { useState } from "react"
import { updateAppointmentAction } from "@/actions/schedule"
import { X, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Procedure = { id: string; name: string; price: number | null }

type Props = {
  open: boolean
  onClose: () => void
  appointmentId: string
  currentProcedureId?: string | null
  currentNotes?: string | null
  procedures: Procedure[]
}

export function EditAppointmentModal({ open, onClose, appointmentId, currentProcedureId, currentNotes, procedures }: Props) {
  const [procedureId, setProcedureId] = useState(currentProcedureId ?? "")
  const [notes, setNotes] = useState(currentNotes ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleSave() {
    setLoading(true)
    setError(null)
    const result = await updateAppointmentAction(appointmentId, {
      procedureId: procedureId || null,
      notes: notes || null,
    })
    setLoading(false)
    if (!result.success) { setError(result.error); return }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-background border border-border shadow-xl flex flex-col max-h-[80dvh] overflow-hidden mb-16 sm:mb-0">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h3 className="font-heading text-base font-semibold">Editar agendamento</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 space-y-5">
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Procedimento */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Procedimento</p>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setProcedureId("")}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                  procedureId === ""
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:bg-accent"
                )}
              >
                <span>Sem procedimento</span>
                {procedureId === "" && <Check size={15} />}
              </button>

              {procedures.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProcedureId(p.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                    procedureId === p.id
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border text-foreground hover:border-primary/40 hover:bg-accent"
                  )}
                >
                  <span>{p.name}</span>
                  {procedureId === p.id && <Check size={15} />}
                </button>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Observações</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações sobre o agendamento..."
              rows={3}
              className="w-full resize-none rounded-xl border border-input bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          {/* Espaço extra para não grudar no footer */}
          <div className="h-1" />
        </div>

        {/* Footer — sempre visível */}
        <div className="flex gap-3 px-5 py-4 border-t border-border shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleSave}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  )
}
