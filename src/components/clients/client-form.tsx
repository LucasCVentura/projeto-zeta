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

const schema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  whatsapp: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const STEPS = ["Dados pessoais", "Contato"]

export function ClientForm({ defaultValues }: { defaultValues?: Partial<FormData> }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, trigger, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues,
    })

  async function nextStep() {
    const fieldsPerStep: (keyof FormData)[][] = [
      ["name", "cpf", "birthDate"],
      ["whatsapp", "email"],
    ]
    const valid = await trigger(fieldsPerStep[step])
    if (valid) setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }

  async function submitForm(data: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await createClientAction({
      name: data.name,
      phone: data.whatsapp || undefined,
      whatsapp: data.whatsapp || undefined,
      email: data.email || undefined,
      cpf: data.cpf || undefined,
      birthDate: data.birthDate || undefined,
      notes: data.notes || undefined,
    })
    setIsLoading(false)
    if (!result.success) { setError(result.error); return }
    router.push(`/clientes/${result.clientId}`)
  }

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="space-y-6"
    >
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp / Telefone</Label>
            <Input
              id="whatsapp"
              placeholder="(11) 99999-9999"
              inputMode="numeric"
              {...register("whatsapp")}
              onChange={(e) => setValue("whatsapp", maskPhone(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" placeholder="cliente@email.com" {...register("email")} />
            {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
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
          <Button type="button" className="flex-1" disabled={isLoading} onClick={handleSubmit(submitForm)}>
            {isLoading ? "Salvando..." : "Cadastrar cliente"}
          </Button>
        )}
      </div>
    </form>
  )
}

