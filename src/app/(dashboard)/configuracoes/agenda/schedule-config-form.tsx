"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft, Copy, Check } from "lucide-react"
import { saveScheduleConfigAction } from "@/actions/schedule"
import { cn } from "@/lib/utils"

const schema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  slotDuration: z.number().min(15).max(240),
  breakStart: z.string().optional(),
  breakEnd: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const WEEK_DAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
]

const SLOT_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1h" },
  { value: 90, label: "1h30" },
  { value: 120, label: "2h" },
]

function BookingLinkCard({ bookingUrl, orgType }: { bookingUrl: string; orgType: "individual" | "clinic" }) {
  const [copied, setCopied] = useState(false)

  async function copyLink() {
    await navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="surface space-y-3">
      <Label>Seu link de agendamento</Label>
      <div className="flex items-center gap-2">
        <Input readOnly value={bookingUrl} className="font-mono text-xs" />
        <Button type="button" variant="outline" onClick={copyLink} className="shrink-0">
          {copied ? <Check size={14} className="mr-1.5" /> : <Copy size={14} className="mr-1.5" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Compartilhe na bio do Instagram ou no WhatsApp para clientes agendarem sozinhas.
        Este link já está ativo — qualquer pessoa com ele pode agendar.
        {orgType === "clinic" && " Suas clientes escolhem a profissional dentro dele."}
      </p>
    </div>
  )
}

export function ScheduleConfigForm({ bookingUrl, orgType }: { bookingUrl: string; orgType: "individual" | "clinic" }) {
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5])
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      startTime: "08:00",
      endTime: "18:00",
      slotDuration: 60,
    },
  })

  const slotDuration = watch("slotDuration")

  function toggleDay(day: number) {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function onSubmit(data: FormData) {
    if (workDays.length === 0) {
      setError("Selecione ao menos um dia de trabalho.")
      return
    }
    setIsLoading(true)
    setError(null)
    const result = await saveScheduleConfigAction({
      workDays: workDays.sort().join(","),
      ...data,
    })
    setIsLoading(false)
    if (!result.success) { setError(result.error); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <Link href="/configuracoes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Configurações
      </Link>
      <div>
        <h2 className="font-heading text-xl font-semibold">Configurar agenda</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Defina seus horários de atendimento e duração dos slots.
        </p>
      </div>

      <BookingLinkCard bookingUrl={bookingUrl} orgType={orgType} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            Configuração salva com sucesso!
          </div>
        )}

        {/* Dias de trabalho */}
        <div className="surface space-y-3">
          <Label>Dias de trabalho</Label>
          <div className="flex gap-2 flex-wrap">
            {WEEK_DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={cn(
                  "h-9 w-12 rounded-lg text-sm font-medium border transition-colors",
                  workDays.includes(d.value)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Horário */}
        <div className="surface space-y-4">
          <Label>Horário de atendimento</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-xs text-muted-foreground">Início</Label>
              <Input id="startTime" type="time" {...register("startTime")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-xs text-muted-foreground">Fim</Label>
              <Input id="endTime" type="time" {...register("endTime")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Intervalo (opcional)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="breakStart" className="text-xs text-muted-foreground">Início pausa</Label>
                <Input id="breakStart" type="time" {...register("breakStart")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="breakEnd" className="text-xs text-muted-foreground">Fim pausa</Label>
                <Input id="breakEnd" type="time" {...register("breakEnd")} />
              </div>
            </div>
          </div>
        </div>

        {/* Duração do slot */}
        <div className="surface space-y-3">
          <Label>Duração do atendimento</Label>
          <div className="flex gap-2 flex-wrap">
            {SLOT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setValue("slotDuration", opt.value)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                  Number(slotDuration) === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {errors.slotDuration && (
            <p className="text-destructive text-xs">{errors.slotDuration.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Salvando..." : "Salvar configuração"}
        </Button>
      </form>
    </div>
  )
}
