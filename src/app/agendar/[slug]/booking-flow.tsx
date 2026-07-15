"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, Check, Phone } from "lucide-react"
import { KiraMark } from "@/components/ui/kira-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Professional = { id: string; name: string }
type Procedure = { id: string; name: string; price: number }
type Step =
  | "loading"
  | "no-professionals"
  | "select-professional"
  | "select-procedures"
  | "select-datetime"
  | "client-info"
  | "confirming"
  | "success"
  | "rate-limited"
  | "error"

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim()
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim()
}

function nextDates(count: number): string[] {
  const dates: string[] = []
  const d = new Date()
  for (let i = 0; i < count; i++) {
    dates.push(d.toISOString().split("T")[0])
    d.setDate(d.getDate() + 1)
  }
  return dates
}

function formatDateLabel(date: string) {
  const d = new Date(date + "T12:00:00")
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })
}

export function BookingFlow({
  slug,
  orgName,
  orgType,
  orgPhone,
}: {
  slug: string
  orgId: string
  orgName: string
  orgType: "individual" | "clinic"
  orgPhone: string | null
}) {
  const [step, setStep] = useState<Step>("loading")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])

  const [professionalId, setProfessionalId] = useState<string | null>(null)
  const [selectedProcedureIds, setSelectedProcedureIds] = useState<string[]>([])

  const dates = useMemo(() => nextDates(14), [])
  const [selectedDate, setSelectedDate] = useState<string>(dates[0])
  const [slotsByDate, setSlotsByDate] = useState<Record<string, { time: string; available: boolean }[]>>({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const [clientName, setClientName] = useState("")
  const [clientPhone, setClientPhone] = useState("")

  // ── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/public-booking/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setErrorMsg(data.error); setStep("error"); return }
        setProfessionals(data.professionals ?? [])
        setProcedures(data.procedures ?? [])
        if (!data.professionals?.length) {
          setStep("no-professionals")
        } else if (orgType === "clinic" && data.professionals.length > 1) {
          setStep("select-professional")
        } else {
          setProfessionalId(data.professionals[0].id)
          setStep("select-procedures")
        }
      })
      .catch(() => { setErrorMsg("Não foi possível carregar a página."); setStep("error") })
  }, [slug, orgType])

  // ── Slots ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "select-datetime" || !professionalId) return
    setLoadingSlots(true)
    fetch(`/api/public-booking/${slug}/slots?professionalId=${professionalId}&dates=${dates.join(",")}`)
      .then((r) => r.json())
      .then((data) => setSlotsByDate(data.slots ?? {}))
      .finally(() => setLoadingSlots(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, professionalId])

  const selectedProcedures = procedures.filter((p) => selectedProcedureIds.includes(p.id))
  const totalPrice = selectedProcedures.reduce((sum, p) => sum + p.price, 0)

  function toggleProcedure(id: string) {
    setSelectedProcedureIds((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])
  }

  async function handleConfirm() {
    if (!professionalId || !selectedTime || selectedProcedureIds.length === 0) return
    setStep("confirming")
    try {
      const res = await fetch(`/api/public-booking/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          professionalId,
          procedureIds: selectedProcedureIds,
          date: selectedDate,
          startTime: selectedTime,
          clientName,
          clientPhone: clientPhone.replace(/\D/g, ""),
        }),
      })
      const data = await res.json()
      if (res.status === 429) {
        setErrorMsg(data.error)
        setStep("rate-limited")
        return
      }
      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? "Não foi possível concluir o agendamento.")
        setStep("select-datetime")
        return
      }
      setStep("success")
    } catch {
      setErrorMsg("Não foi possível concluir o agendamento. Tente novamente.")
      setStep("select-datetime")
    }
  }

  const waHref = orgPhone ? `https://wa.me/55${orgPhone.replace(/\D/g, "")}` : null

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-5 py-8">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
            <KiraMark size={23} />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">{orgName}</p>
            <p className="text-xs text-muted-foreground leading-tight">Agendamento online</p>
          </div>
        </div>

        {step === "loading" && (
          <p className="text-sm text-muted-foreground text-center py-10">Carregando...</p>
        )}

        {step === "error" && (
          <div className="surface text-center space-y-2 py-8">
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {step === "no-professionals" && (
          <div className="surface text-center space-y-4 py-8">
            <p className="text-sm font-medium">
              Esta profissional ainda não disponibilizou horários para agendamento online.
            </p>
            <p className="text-xs text-muted-foreground">Entre em contato diretamente para agendar.</p>
            {waHref && (
              <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-medium text-white">
                <Phone size={15} /> Falar no WhatsApp
              </a>
            )}
          </div>
        )}

        {step === "rate-limited" && (
          <div className="surface text-center space-y-4 py-8">
            <p className="text-sm font-medium">{errorMsg}</p>
            {waHref && (
              <a href={waHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-medium text-white">
                <Phone size={15} /> Falar no WhatsApp
              </a>
            )}
          </div>
        )}

        {step === "select-professional" && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Escolha a profissional</p>
            {professionals.map((p) => (
              <button
                key={p.id}
                onClick={() => { setProfessionalId(p.id); setStep("select-procedures") }}
                className="w-full flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm hover:border-primary/40 hover:bg-accent transition-colors"
              >
                {p.name} <ChevronRight size={16} className="text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {step === "select-procedures" && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Escolha o(s) procedimento(s)</p>
            <div className="space-y-2">
              {procedures.map((p) => {
                const active = selectedProcedureIds.includes(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleProcedure(p.id)}
                    className={cn(
                      "w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-colors",
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                        active ? "bg-primary border-primary text-primary-foreground" : "border-border"
                      )}>
                        {active && <Check size={12} />}
                      </span>
                      {p.name}
                    </span>
                    <span className="text-muted-foreground">{formatCurrency(p.price)}</span>
                  </button>
                )
              })}
            </div>
            <Button className="w-full" disabled={selectedProcedureIds.length === 0} onClick={() => setStep("select-datetime")}>
              Continuar {totalPrice > 0 && `— ${formatCurrency(totalPrice)}`}
            </Button>
          </div>
        )}

        {step === "select-datetime" && (
          <div className="space-y-4">
            {errorMsg && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {errorMsg}
              </div>
            )}
            <p className="text-sm font-medium">Escolha o dia e horário</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dates.map((d) => (
                <button
                  key={d}
                  onClick={() => { setSelectedDate(d); setSelectedTime(null) }}
                  className={cn(
                    "shrink-0 rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors",
                    selectedDate === d ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {formatDateLabel(d)}
                </button>
              ))}
            </div>

            {loadingSlots ? (
              <p className="text-sm text-muted-foreground text-center py-6">Carregando horários...</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {(slotsByDate[selectedDate] ?? []).map((slot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                      !slot.available && "opacity-30 cursor-not-allowed",
                      selectedTime === slot.time ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                    )}
                  >
                    {slot.time}
                  </button>
                ))}
                {(slotsByDate[selectedDate] ?? []).length === 0 && (
                  <p className="col-span-3 text-sm text-muted-foreground text-center py-4">Sem horários neste dia.</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("select-procedures")}>
                <ChevronLeft size={15} className="mr-1" /> Voltar
              </Button>
              <Button className="flex-1" disabled={!selectedTime} onClick={() => setStep("client-info")}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === "client-info" && (
          <div className="space-y-4">
            <p className="text-sm font-medium">Seus dados</p>
            <div className="space-y-2">
              <Label htmlFor="clientName">Nome completo</Label>
              <Input id="clientName" value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientPhone">WhatsApp</Label>
              <Input
                id="clientPhone"
                value={clientPhone}
                onChange={(e) => setClientPhone(maskPhone(e.target.value))}
                placeholder="(00) 00000-0000"
                inputMode="numeric"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep("select-datetime")}>
                <ChevronLeft size={15} className="mr-1" /> Voltar
              </Button>
              <Button
                className="flex-1"
                disabled={!clientName.trim() || clientPhone.replace(/\D/g, "").length < 10}
                onClick={handleConfirm}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {step === "confirming" && (
          <p className="text-sm text-muted-foreground text-center py-10">Confirmando...</p>
        )}

        {step === "success" && (
          <div className="surface text-center space-y-3 py-8">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-green-500/10 text-green-600">
              <Check size={24} />
            </div>
            <p className="text-base font-medium">Solicitação enviada!</p>
            <p className="text-sm text-muted-foreground">
              {formatDateLabel(selectedDate)} às {selectedTime} — aguardando confirmação de {orgName}.
              Você vai receber uma mensagem no WhatsApp em breve.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
