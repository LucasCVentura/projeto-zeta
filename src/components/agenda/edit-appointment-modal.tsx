"use client"

import { useState } from "react"
import { updateAppointmentAction } from "@/actions/schedule"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

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
      <div className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-background border border-border shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-base font-semibold">Editar agendamento</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Procedimento</label>
          <select
            value={procedureId}
            onChange={(e) => setProcedureId(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          >
            <option value="">Sem procedimento</option>
            {procedures.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Observações</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anotações sobre o agendamento..."
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" className="flex-1" disabled={loading} onClick={handleSave}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  )
}
