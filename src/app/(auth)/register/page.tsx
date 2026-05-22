"use client"

import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { registerAction, loginAction } from "@/actions/auth"

// ── helpers de máscara ──────────────────────────────────────────────────────
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

function validateCPF(cpf: string) {
  const d = cpf.replace(/\D/g, "")
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i)
  let r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  if (r !== parseInt(d[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i)
  r = (sum * 10) % 11
  if (r === 10 || r === 11) r = 0
  return r === parseInt(d[10])
}

// ── schema ──────────────────────────────────────────────────────────────────
const schema = z
  .object({
    // step 1
    name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    profession: z.enum(["esteticista", "biomedico"], { error: "Selecione sua profissão" }),
    birthDate: z.string().min(1, "Informe sua data de nascimento"),

    // step 2
    cpf: z.string().refine((v) => validateCPF(v), "CPF inválido"),
    phone: z
      .string()
      .min(14, "Telefone inválido")
      .max(15, "Telefone inválido"),
    whatsapp: z.string().optional(),
    professionalDocument: z.string().min(2, "Informe o número do documento"),
    clinicName: z.string().optional(),
    instagram: z.string().optional(),

    // step 3
    password: z
      .string()
      .min(8, "Senha deve ter ao menos 8 caracteres")
      .regex(/[A-Z]/, "Deve conter ao menos uma letra maiúscula")
      .regex(/[0-9]/, "Deve conter ao menos um número"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não coincidem",
  })

type FormData = z.infer<typeof schema>

const professions = [
  { value: "esteticista", label: "Esteticista" },
  { value: "biomedico", label: "Biomédico(a) Esteta" },
]

const docTypeByProfession: Record<string, string> = {
  biomedico: "CRBM",
  esteticista: "Registro Profissional",
}

// ── component ───────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const selectedProfession = watch("profession")
  const password = watch("password") ?? ""
  const docType = docTypeByProfession[selectedProfession] ?? "Documento"

  const passwordStrength = (() => {
    if (!password.length) return 0
    let s = 0
    if (password.length >= 8) s++
    if (/[A-Z]/.test(password)) s++
    if (/[0-9]/.test(password)) s++
    if (/[^A-Za-z0-9]/.test(password)) s++
    return s
  })()

  const strengthLabel = ["", "Fraca", "Razoável", "Boa", "Forte"][passwordStrength]
  const strengthColor = ["", "bg-destructive", "bg-yellow-400", "bg-blue-400", "bg-green-500"][passwordStrength]

  async function next(fields: (keyof FormData)[], nextStep: 1 | 2 | 3) {
    const valid = await trigger(fields)
    if (valid) setStep(nextStep)
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)

    const result = await registerAction({
      name: data.name,
      email: data.email,
      profession: data.profession,
      cpf: data.cpf.replace(/\D/g, ""),
      phone: data.phone,
      whatsapp: data.whatsapp || undefined,
      birthDate: data.birthDate,
      professionalDocument: data.professionalDocument,
      professionalDocumentType: docType,
      clinicName: data.clinicName || undefined,
      instagram: data.instagram || undefined,
      password: data.password,
    })

    if (!result.success) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    await loginAction({ email: data.email, password: data.password })
    router.push("/dashboard")
  }

  const stepLabels = ["Informações básicas", "Dados profissionais", "Senha"]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="font-heading text-2xl font-bold tracking-tight">Criar conta</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {step} de 3
          </span>
        </div>
        <p className="text-muted-foreground text-sm">{stepLabels[step - 1]}</p>
        <div className="flex gap-1.5 pt-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? "bg-primary" : "bg-border"}`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ── STEP 1: dados básicos ── */}
        {step === 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" placeholder="Dra. Ana Lima" autoComplete="name" {...register("name")} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail profissional</Label>
              <Input id="email" type="email" placeholder="voce@clinica.com" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input id="birthDate" type="date" {...register("birthDate")} />
              {errors.birthDate && <p className="text-destructive text-xs">{errors.birthDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Profissão</Label>
              <div className="grid grid-cols-2 gap-3">
                {professions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setValue("profession", p.value as "esteticista" | "biomedico")}
                    className={`relative flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all
                      ${selectedProfession === p.value
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/40 hover:bg-muted/50"}`}
                  >
                    {selectedProfession === p.value && (
                      <span className="absolute top-3 right-3 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    )}
                    <span className="text-sm font-medium">{p.label}</span>
                  </button>
                ))}
              </div>
              {errors.profession && <p className="text-destructive text-xs">{errors.profession.message}</p>}
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={() => next(["name", "email", "birthDate", "profession"], 2)}
            >
              Continuar
            </Button>
          </>
        )}

        {/* ── STEP 2: dados profissionais ── */}
        {step === 2 && (
          <>
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
                {errors.cpf && <p className="text-destructive text-xs">{errors.cpf.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="birthDate">Data nasc.</Label>
                <Input id="birthDate2" type="date" {...register("birthDate")} disabled className="opacity-60" />
              </div>
            </div>

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
                {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp <span className="text-muted-foreground">(opc.)</span></Label>
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
              <Label htmlFor="professionalDocument">
                {docType || "Documento profissional"}
              </Label>
              <Input
                id="professionalDocument"
                placeholder={
                  selectedProfession === "biomedico"
                    ? "Número do CRBM"
                    : "Número do registro / diploma"
                }
                {...register("professionalDocument")}
              />
              {selectedProfession === "esteticista" && (
                <p className="text-xs text-muted-foreground">
                  Esteticistas podem informar número de diploma, certificado ou registro estadual.
                </p>
              )}
              {errors.professionalDocument && (
                <p className="text-destructive text-xs">{errors.professionalDocument.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="clinicName">
                Clínica / consultório <span className="text-muted-foreground">(opc.)</span>
              </Label>
              <Input id="clinicName" placeholder="Studio Ana Lima" {...register("clinicName")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram">
                Instagram <span className="text-muted-foreground">(opc.)</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                <Input id="instagram" placeholder="seuarroba" className="pl-7" {...register("instagram")} />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => next(["cpf", "phone", "professionalDocument"], 3)}
              >
                Continuar
              </Button>
            </div>
          </>
        )}

        {/* ── STEP 3: senha ── */}
        {step === 3 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="pr-10"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>

              {password.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColor : "bg-border"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Força: <span className="font-medium text-foreground">{strengthLabel}</span>
                  </p>
                </div>
              )}
              {errors.password && <p className="text-destructive text-xs">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Ao criar uma conta, você concorda com os{" "}
              <Link href="/termos" className="text-primary hover:underline underline-offset-4">Termos de Uso</Link>{" "}
              e a{" "}
              <Link href="/privacidade" className="text-primary hover:underline underline-offset-4">Política de Privacidade</Link>.
            </p>

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Criando...
                  </span>
                ) : "Criar conta"}
              </Button>
            </div>
          </>
        )}
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Já tem uma conta?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
          Entrar
        </Link>
      </p>
    </div>
  )
}
