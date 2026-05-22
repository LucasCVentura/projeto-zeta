"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClientAction } from "@/actions/clients"

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11)
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim()
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim()
}

const SKIN_TYPES = ["Normal", "Oleosa", "Seca", "Mista", "Sensível"]

const schema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  notes: z.string().optional(),
  // anamnese
  hasAllergies: z.boolean(),
  allergiesDetail: z.string().optional(),
  hasContraindications: z.boolean(),
  contraindicationsDetail: z.string().optional(),
  usesMedication: z.boolean(),
  medicationDetail: z.string().optional(),
  hasChronicCondition: z.boolean(),
  chronicConditionDetail: z.string().optional(),
  isPregnant: z.boolean(),
  skinType: z.string().optional(),
  skinComplaints: z.string().optional(),
  previousProcedures: z.string().optional(),
  aestheticGoal: z.string().optional(),
  extraNotes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const STEPS = ["Dados pessoais", "Contato", "Anamnese"]

export function ClientForm({ defaultValues }: { defaultValues?: Partial<FormData> }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: {
        hasAllergies: false,
        hasContraindications: false,
        usesMedication: false,
        hasChronicCondition: false,
        isPregnant: false,
        ...defaultValues,
      },
    })

  const watchBool = (field: keyof FormData) => watch(field) as boolean
  const skinType = watch("skinType")

  async function nextStep() {
    const fieldsPerStep: (keyof FormData)[][] = [
      ["name", "cpf", "birthDate"],
      ["phone", "whatsapp", "email"],
      [],
    ]
    const valid = await trigger(fieldsPerStep[step])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  async function onSubmit(data: FormData) {
    if (step < STEPS.length - 1) {
      await nextStep()
      return
    }
    setIsLoading(true)
    setError(null)
    const result = await createClientAction({
      name: data.name,
      phone: data.phone || undefined,
      whatsapp: data.whatsapp || undefined,
      email: data.email || undefined,
      cpf: data.cpf || undefined,
      birthDate: data.birthDate || undefined,
      notes: data.notes || undefined,
      anamnesis: {
        hasAllergies: data.hasAllergies,
        allergiesDetail: data.allergiesDetail,
        hasContraindications: data.hasContraindications,
        contraindicationsDetail: data.contraindicationsDetail,
        usesMedication: data.usesMedication,
        medicationDetail: data.medicationDetail,
        hasChronicCondition: data.hasChronicCondition,
        chronicConditionDetail: data.chronicConditionDetail,
        isPregnant: data.isPregnant,
        skinType: data.skinType,
        aestheticGoal: data.aestheticGoal,
        skinComplaints: data.skinComplaints,
        previousProcedures: data.previousProcedures,
        extraNotes: data.extraNotes,
      },
    })
    setIsLoading(false)
    if (!result.success) { setError(result.error); return }
    router.push(`/clientes/${result.clientId}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
              i < step ? "bg-primary text-primary-foreground"
              : i === step ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
            )}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={cn("text-sm hidden sm:block", i === step ? "font-medium" : "text-muted-foreground")}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="h-px w-6 bg-border" />}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* ── Step 0: Dados pessoais ── */}
      {step === 0 && (
        <div className="surface space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome completo *</Label>
            <Input id="name" placeholder="Maria Silva" {...register("name")} />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                inputMode="numeric"
                {...register("cpf")}
                onChange={(e) => setValue("cpf", maskCPF(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input id="birthDate" type="date" {...register("birthDate")} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações internas</Label>
            <Input id="notes" placeholder="Notas visíveis apenas para você..." {...register("notes")} />
          </div>
        </div>
      )}

      {/* ── Step 1: Contato ── */}
      {step === 1 && (
        <div className="surface space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                inputMode="numeric"
                {...register("phone")}
                onChange={(e) => setValue("phone", maskPhone(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                placeholder="(11) 99999-9999"
                inputMode="numeric"
                {...register("whatsapp")}
                onChange={(e) => setValue("whatsapp", maskPhone(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="cliente@email.com" {...register("email")} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
          </div>
        </div>
      )}

      {/* ── Step 2: Anamnese ── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Tipo de pele */}
          <div className="surface space-y-3">
            <Label>Tipo de pele</Label>
            <div className="flex flex-wrap gap-2">
              {SKIN_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("skinType", skinType === t ? "" : t)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    skinType === t
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Perguntas de saúde */}
          <div className="surface space-y-4">
            <p className="text-sm font-medium">Saúde</p>

            <AnamnesisToggle
              label="Possui alergias?"
              checked={watchBool("hasAllergies")}
              onChange={(v) => setValue("hasAllergies", v)}
              detailLabel="Quais alergias?"
              detailPlaceholder="Ex: látex, penicilina..."
              register={register("allergiesDetail")}
            />
            <AnamnesisToggle
              label="Possui contraindicações?"
              checked={watchBool("hasContraindications")}
              onChange={(v) => setValue("hasContraindications", v)}
              detailLabel="Quais contraindicações?"
              detailPlaceholder="Ex: marca-passo, gestante..."
              register={register("contraindicationsDetail")}
            />
            <AnamnesisToggle
              label="Faz uso de medicamentos?"
              checked={watchBool("usesMedication")}
              onChange={(v) => setValue("usesMedication", v)}
              detailLabel="Quais medicamentos?"
              detailPlaceholder="Ex: anticoagulante, isotretinoína..."
              register={register("medicationDetail")}
            />
            <AnamnesisToggle
              label="Possui doença crônica?"
              checked={watchBool("hasChronicCondition")}
              onChange={(v) => setValue("hasChronicCondition", v)}
              detailLabel="Qual condição?"
              detailPlaceholder="Ex: diabetes, hipertensão..."
              register={register("chronicConditionDetail")}
            />

            <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <span className="text-sm">Gestante?</span>
              <Toggle
                checked={watchBool("isPregnant")}
                onChange={(v) => setValue("isPregnant", v)}
              />
            </div>
          </div>

          {/* Histórico estético */}
          <div className="surface space-y-4">
            <p className="text-sm font-medium">Histórico estético</p>
            <div className="space-y-2">
              <Label>Objetivo estético</Label>
              <Input placeholder="Ex: reduzir manchas, uniformizar o tom, tratar acne..." {...register("aestheticGoal")} />
            </div>
            <div className="space-y-2">
              <Label>Queixas da pele</Label>
              <Input placeholder="Ex: manchas, acne, oleosidade..." {...register("skinComplaints")} />
            </div>
            <div className="space-y-2">
              <Label>Procedimentos anteriores</Label>
              <Input placeholder="Ex: peeling, botox, microagulhamento..." {...register("previousProcedures")} />
            </div>
            <div className="space-y-2">
              <Label>Observações extras</Label>
              <Input placeholder="Informações adicionais da ficha..." {...register("extraNotes")} />
            </div>
          </div>
        </div>
      )}

      {/* Navegação */}
      <div className="flex gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>
            Voltar
          </Button>
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" className="flex-1" onClick={nextStep}>Continuar</Button>
        ) : (
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? "Salvando..." : "Cadastrar cliente"}
          </Button>
        )}
      </div>
    </form>
  )
}

// ── Sub-componentes ──────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full outline-none transition-colors",
        checked ? "bg-primary" : "bg-muted"
      )}
    >
      <span className={cn(
        "absolute top-0.5 left-0 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
        checked ? "translate-x-4.5" : "translate-x-0.5"
      )} />
    </button>
  )
}

function AnamnesisToggle({
  label, checked, onChange, detailLabel, detailPlaceholder, register,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  detailLabel: string
  detailPlaceholder: string
  register: object
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <span className="text-sm">{label}</span>
        <Toggle checked={checked} onChange={onChange} />
      </div>
      {checked && (
        <Input
          placeholder={detailPlaceholder}
          {...(register as React.InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
    </div>
  )
}
