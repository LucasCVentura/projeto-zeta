"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { completeAppointmentWithRevenueAction } from "@/actions/financial"
import { createAppointmentAction } from "@/actions/schedule"
import { suggestReturnDateAction } from "@/actions/ai"
import { CheckCircle, CalendarClock, Sparkles, Loader2 } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  appointmentId: string
  clientId?: string
  date: string
  clientName: string
  procedure?: string
  procedurePrice?: number // centavos
  isPackageSession?: boolean
  hasReturn?: boolean
  returnIntervalDays?: number | null
  appointmentDate?: string
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function parsePriceInput(value: string): number {
  const cleaned = value.replace(/\D/g, "")
  return Number(cleaned)
}

function maskPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",")
}

function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00")
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString("en-CA")
}

export function CompleteAppointmentModal({
  open,
  onClose,
  appointmentId,
  clientId,
  date,
  clientName,
  procedure,
  procedurePrice = 0,
  isPackageSession = false,
  hasReturn = false,
  returnIntervalDays,
  appointmentDate,
}: Props) {
  // step: "return" | "value"
  const [step, setStep] = useState<"return" | "value">("return")
  const [rawValue, setRawValue] = useState(() => maskPrice(procedurePrice))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // return step state
  const [returnDate, setReturnDate] = useState("")
  const [returnTime, setReturnTime] = useState("09:00")
  const [aiLoading, setAiLoading] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [returnScheduled, setReturnScheduled] = useState(false)

  const showReturnStep = hasReturn && !!clientId

  useEffect(() => {
    if (open) {
      setStep(showReturnStep ? "return" : "value")
      setRawValue(maskPrice(isPackageSession ? 0 : (procedurePrice ?? 0)))
      setError(null)
      setReturnScheduled(false)
      setAiExplanation(null)
      // Pre-fill return date with interval or +30 days
      const base = appointmentDate ?? date
      const days = returnIntervalDays ?? 30
      setReturnDate(addDaysToDate(base, days))
    }
  }, [open, procedurePrice, isPackageSession, showReturnStep, appointmentDate, date, returnIntervalDays])

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "")
    setRawValue(maskPrice(Number(digits)))
  }

  async function handleAiSuggest() {
    setAiLoading(true)
    setAiExplanation(null)
    const base = appointmentDate ?? date
    const result = await suggestReturnDateAction({
      procedureName: procedure ?? "procedimento",
      returnIntervalDays: returnIntervalDays ?? null,
      lastAppointmentDate: base,
    })
    setAiLoading(false)
    if (result.success) {
      setReturnDate(result.suggestedDate)
      setAiExplanation(result.explanation)
    }
  }

  async function handleScheduleReturn() {
    if (!clientId || !returnDate) { setStep("value"); return }
    setIsLoading(true)
    await createAppointmentAction({
      clientId,
      date: returnDate,
      startTime: returnTime + ":00",
      procedure,
      notes: "Retorno",
    })
    setIsLoading(false)
    setReturnScheduled(true)
    setStep("value")
  }

  async function handleSubmitValue(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const cents = isPackageSession ? 0 : parsePriceInput(rawValue)
    const result = await completeAppointmentWithRevenueAction({
      appointmentId,
      amount: cents,
      description: procedure,
      date,
    })

    setIsLoading(false)
    if (!result.success) { setError(result.error); return }
    onClose()
  }

  const amountCents = parsePriceInput(rawValue)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            {step === "return" ? (
              <><CalendarClock size={18} className="text-primary" />Agendar retorno</>
            ) : (
              <><CheckCircle size={18} className="text-green-600" />Concluir atendimento</>
            )}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{clientName}</p>
        </DialogHeader>

        {/* ── Step 1: Retorno ───────────────────────────────────────── */}
        {step === "return" && (
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {procedure && <span className="font-medium text-foreground">{procedure}</span>}
                {returnIntervalDays && <span> · protocolo de {returnIntervalDays} dias</span>}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Data do retorno</Label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Horário</Label>
                <input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={aiLoading}
              className="flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4 disabled:opacity-50"
            >
              {aiLoading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {aiLoading ? "Calculando..." : "Sugerir com IA"}
            </button>

            {aiExplanation && (
              <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                <Sparkles size={11} className="text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{aiExplanation}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep("value")} disabled={isLoading}>
                Pular
              </Button>
              <Button type="button" className="flex-1" onClick={handleScheduleReturn} disabled={isLoading || !returnDate}>
                {isLoading ? "Agendando..." : "Agendar retorno"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Valor ─────────────────────────────────────────── */}
        {step === "value" && (
          <form onSubmit={handleSubmitValue} className="space-y-4 pt-2">
            {returnScheduled && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <CheckCircle size={13} className="text-green-600 shrink-0" />
                <p className="text-xs text-green-700">Retorno agendado para {new Date(returnDate + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}</p>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Procedimento</Label>
              <p className="text-sm">{procedure ?? "Não informado"}</p>
            </div>

            {isPackageSession ? (
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
                <p className="text-sm text-primary font-medium">Sessão de pacote pré-pago</p>
                <p className="text-xs text-muted-foreground mt-0.5">A receita foi registrada na venda do pacote.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="amount">Valor cobrado</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                  <Input
                    id="amount"
                    inputMode="numeric"
                    className="pl-9"
                    value={rawValue}
                    onChange={handleValueChange}
                  />
                </div>
                {amountCents === 0 && (
                  <p className="text-xs text-muted-foreground">Valor R$ 0,00 — o atendimento será registrado sem receita.</p>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              {showReturnStep && !returnScheduled && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep("return")} className="text-xs text-muted-foreground">
                  ← Retorno
                </Button>
              )}
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Concluir"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
