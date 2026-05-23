"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { createAppointmentAction } from "@/actions/schedule"
import { suggestRecurrenceAction } from "@/actions/ai"
import { sendPackageScheduleConfirmation } from "@/actions/whatsapp"
import { Sparkles, Loader2, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onClose: () => void
  clientId: string
  clientPhone?: string
  clientName?: string
  clientPackageId: string
  packageName: string
  procedureId: string
  procedureName: string
  sessionsRemaining: number
  orgName: string
  orgAddress?: string
}

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Semanal", hint: "a cada 7 dias" },
  { value: "biweekly", label: "Quinzenal", hint: "a cada 14 dias" },
  { value: "monthly", label: "Mensal", hint: "a cada 30 dias" },
] as const

type Frequency = "weekly" | "biweekly" | "monthly"

export function SchedulePackageModal({
  open, onClose, clientId, clientPhone, clientName = "", clientPackageId, packageName,
  procedureId, procedureName, sessionsRemaining, orgName, orgAddress,
}: Props) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })

  const [date, setDate] = useState(today)
  const [time, setTime] = useState("09:00")
  const [frequency, setFrequency] = useState<Frequency>("biweekly")
  const [count, setCount] = useState(sessionsRemaining)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleAiSuggest() {
    setAiLoading(true)
    setAiExplanation(null)
    const result = await suggestRecurrenceAction(clientId)
    setAiLoading(false)
    if (result.success && result.frequency) {
      setFrequency(result.frequency)
      setCount(Math.min(result.count ?? sessionsRemaining, sessionsRemaining))
      setAiExplanation(result.explanation ?? null)
    } else {
      setAiExplanation(result.error ?? "Sem histórico suficiente. Configure manualmente.")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createAppointmentAction({
      clientId,
      date,
      startTime: time + ":00",
      procedureId,
      procedure: procedureName,
      clientPackageId,
      recurrence: count > 1 ? { frequency, count } : undefined,
    })
    setLoading(false)
    if (!result.success) { setError(result.error ?? "Erro ao agendar."); return }

    // Envia WhatsApp com todas as sessões se cliente tiver telefone
    if (clientPhone && result.appointmentIds && result.appointmentIds.length > 0) {
      const intervalDays = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30
      const sessions = result.appointmentIds.map((_, i) => {
        const d = new Date(date + "T12:00:00")
        if (frequency === "monthly") {
          d.setMonth(d.getMonth() + i)
        } else {
          d.setDate(d.getDate() + intervalDays * i)
        }
        return { date: d.toISOString().split("T")[0], startTime: time }
      })
      try {
        await sendPackageScheduleConfirmation({
          appointmentIds: result.appointmentIds,
          clientPhone,
          clientName,
          packageName,
          procedureName,
          orgName,
          orgAddress,
          sessions,
        })
      } catch { /* silencioso */ }
    }

    setSuccess(true)
    setTimeout(() => { setSuccess(false); onClose() }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <CalendarDays size={16} className="text-primary" />
            Agendar sessões
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{packageName} · {procedureName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Data e hora da primeira sessão */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Primeira sessão</Label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Horário</Label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Nº de sessões */}
          <div className="space-y-1.5">
            <Label className="text-xs">Sessões a agendar</Label>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setCount((v) => Math.max(1, v - 1))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors">−</button>
              <span className="w-8 text-center font-medium">{count}</span>
              <button type="button" onClick={() => setCount((v) => Math.min(sessionsRemaining, v + 1))}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors">+</button>
              <span className="text-xs text-muted-foreground">de {sessionsRemaining} restante{sessionsRemaining !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Frequência */}
          {count > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Intervalo entre sessões</Label>
                <button
                  type="button"
                  onClick={handleAiSuggest}
                  disabled={aiLoading}
                  className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4 disabled:opacity-50"
                >
                  {aiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  {aiLoading ? "Analisando..." : "Sugerir com IA"}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFrequency(opt.value)}
                    className={cn(
                      "rounded-lg border px-2 py-2 text-center transition-colors",
                      frequency === opt.value
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <p className="text-xs font-medium">{opt.label}</p>
                    <p className="text-[10px] opacity-60">{opt.hint}</p>
                  </button>
                ))}
              </div>
              {aiExplanation && (
                <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                  <Sparkles size={11} className="text-primary mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">{aiExplanation}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
            <Button type="submit" className="flex-1" disabled={loading || success}>
              {success ? "Agendado!" : loading ? "Agendando..." : `Agendar ${count} sessão${count !== 1 ? "ões" : ""}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
