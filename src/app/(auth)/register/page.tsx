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
import { GoogleButton } from "@/components/auth/google-button"
// FacebookButton fica pronto mas oculto até a verificação de empresa da Meta ser concluída
// import { FacebookButton } from "@/components/auth/facebook-button"

// ── schema ──────────────────────────────────────────────────────────────────
const schema = z
  .object({
    name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
    email: z.string().email("E-mail inválido"),
    profession: z.enum(["esteticista", "biomedico", "outro"], { error: "Selecione sua profissão" }),
    professionSegment: z.string().optional(),
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
  { value: "outro", label: "Outro segmento" },
]

const otherSegments = [
  { value: "designer_cilios", label: "Designer de cílios" },
  { value: "manicure_nail_designer", label: "Manicure / Nail designer" },
  { value: "micropigmentadora", label: "Micropigmentadora" },
  { value: "cabeleireira", label: "Cabeleireira" },
  { value: "massoterapeuta", label: "Massoterapeuta" },
  { value: "outro_beleza", label: "Outro segmento de beleza" },
]

// ── component ───────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCustomSegment, setShowCustomSegment] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const selectedProfession = watch("profession")
  const selectedSegment = watch("professionSegment")
  const password = watch("password") ?? ""

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

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)

    const result = await registerAction({
      name: data.name,
      email: data.email,
      profession: data.profession,
      professionSegment: data.profession === "outro" ? data.professionSegment : undefined,
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

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h2 className="font-heading text-2xl font-bold tracking-tight">Criar conta</h2>
        <p className="text-muted-foreground text-sm">7 dias grátis, sem cartão de crédito.</p>
      </div>

      <GoogleButton label="Criar conta com Google" />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou com e-mail</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" placeholder="Dra. Ana Lima" autoComplete="name" {...register("name")} />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" placeholder="voce@clinica.com" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-destructive text-xs">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label>Profissão</Label>
          <div className="grid gap-3 sm:grid-cols-3">
            {professions.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setValue("profession", p.value as "esteticista" | "biomedico" | "outro")
                  if (p.value !== "outro") {
                    setShowCustomSegment(false)
                    setValue("professionSegment", undefined)
                  }
                }}
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

        {selectedProfession === "outro" && (
          <div className="space-y-2">
            <Label>Qual segmento? <span className="text-muted-foreground">(opcional)</span></Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {otherSegments.map((segment) => (
                <button
                  key={segment.value}
                  type="button"
                  onClick={() => {
                    if (segment.value === "outro_beleza") {
                      setShowCustomSegment(true)
                      setValue("professionSegment", "")
                    } else {
                      setShowCustomSegment(false)
                      setValue("professionSegment", segment.value)
                    }
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all
                    ${(segment.value === "outro_beleza" ? showCustomSegment : selectedSegment === segment.value)
                      ? "border-primary bg-primary/5 text-foreground shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50"}`}
                >
                  {segment.label}
                </button>
              ))}
            </div>
            {showCustomSegment && (
              <Input
                placeholder="Digite sua profissão ou área de atuação..."
                {...register("professionSegment")}
                autoFocus
              />
            )}
          </div>
        )}

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

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Criando...
            </span>
          ) : "Criar conta grátis"}
        </Button>
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
