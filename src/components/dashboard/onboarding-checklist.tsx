"use client"

import Link from "next/link"
import {
  ArrowRight,
  CalendarClock,
  CalendarPlus,
  Camera,
  CheckCircle2,
  Circle,
  Clock3,
  Sparkles,
  Stethoscope,
  Target,
  UserPlus,
  X,
} from "lucide-react"
import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import type { OrgRole } from "@/db/schema"

type Step = {
  id: string
  label: string
  description: string
  href: string
  icon: ReactNode
  done: boolean
  why: string
  time: string
}

type Props = {
  dismissStorageKey: string
  role: OrgRole
  hasSchedule: boolean
  hasProcedure: boolean
  hasClient: boolean
  firstClientId: string | null
  hasAppointment: boolean
  hasPhoto: boolean
}

export function OnboardingChecklist({
  dismissStorageKey,
  role,
  hasSchedule,
  hasProcedure,
  hasClient,
  firstClientId,
  hasAppointment,
  hasPhoto,
}: Props) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(dismissStorageKey) === "1") setDismissed(true)
  }, [dismissStorageKey])

  const allSteps: Step[] = [
    {
      id: "schedule",
      label: "Configure sua agenda",
      description: "Defina dias, horários e duração padrão dos atendimentos.",
      href: "/configuracoes/agenda",
      icon: <CalendarClock size={18} />,
      done: hasSchedule,
      why: "A agenda passa a refletir sua rotina real e evita horários soltos.",
      time: "2 min",
    },
    {
      id: "procedure",
      label: "Cadastre seus procedimentos",
      description: "Inclua nome, preço e retorno quando fizer sentido.",
      href: "/configuracoes/procedimentos",
      icon: <Stethoscope size={18} />,
      done: hasProcedure,
      why: "Depois disso, agendamentos e financeiro já saem mais completos.",
      time: "3 min",
    },
    {
      id: "client",
      label: "Cadastre seu primeiro cliente",
      description: "Comece com um cliente real para sentir o fluxo completo.",
      href: "/clientes/novo",
      icon: <UserPlus size={18} />,
      done: hasClient,
      why: "A ficha vira o centro do histórico, fotos e observações.",
      time: "2 min",
    },
    {
      id: "appointment",
      label: "Marque o primeiro atendimento",
      description: "Conecte cliente, procedimento, horário e status.",
      href: "/agenda",
      icon: <CalendarPlus size={18} />,
      done: hasAppointment,
      why: "Esse é o ponto em que o Kira começa a organizar sua rotina do dia.",
      time: "1 min",
    },
    {
      id: "photo",
      label: "Registre fotos de evolução",
      description: "Suba fotos na ficha do cliente ou durante a consulta.",
      href: firstClientId ? `/clientes/${firstClientId}/fotos` : "/clientes/novo",
      icon: <Camera size={18} />,
      done: hasPhoto,
      why: "Ajuda a acompanhar evolução com mais contexto e menos arquivos perdidos.",
      time: "2 min",
    },
  ]

  // Owner vê todos os steps; membros convidados só veem os operacionais
  const ownerOnlySteps = new Set(["schedule", "procedure"])
  const steps = role === "owner"
    ? allSteps
    : allSteps.filter((s) => !ownerOnlySteps.has(s.id))

  const completedCount = steps.filter((s) => s.done).length
  const allDone = completedCount === steps.length
  const nextStep = steps.find((s) => !s.done)

  if (dismissed) return null

  return (
    <section className="surface relative overflow-hidden">
      <button
        onClick={() => { localStorage.setItem(dismissStorageKey, "1"); setDismissed(true) }}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dispensar"
      >
        <X size={15} />
      </button>

      {allDone ? (
        <div className="flex flex-col items-center text-center gap-4 py-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Sparkles size={24} className="text-primary" />
          </div>
          <div className="space-y-1">
            <p className="font-heading text-lg font-semibold">Sua base inicial está pronta</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Agora você já pode usar o Kira na rotina: agenda, clientes, procedimentos e evolução em um só lugar.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground max-w-sm space-y-1">
            <p>Novidades como <strong className="text-foreground">relatórios avançados</strong>, <strong className="text-foreground">lembretes automáticos para clientes</strong> e muito mais estão em desenvolvimento.</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Sugestões ou problemas?{" "}
            <a href="mailto:suporte@kiraclinic.com.br" className="text-primary hover:underline underline-offset-4">
              suporte@kiraclinic.com.br
            </a>
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-5 pr-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Target size={13} />
                  Comece pelo essencial
                </div>
                <div className="space-y-1">
                  <h2 className="font-heading text-xl font-semibold">Monte sua primeira rotina no Kira</h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Em poucos minutos você deixa o sistema pronto para atender um cliente real, registrar evolução e acompanhar sua agenda sem depender de mensagens soltas.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{completedCount} de {steps.length} etapas concluídas</span>
                  <span className="text-muted-foreground">{Math.round((completedCount / steps.length) * 100)}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(completedCount / steps.length) * 100}%` }}
                  />
                </div>
              </div>

              {nextStep && (
                <Link
                  href={nextStep.href}
                  className="inline-flex w-full items-center justify-between rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 no-underline sm:w-auto sm:min-w-64"
                >
                  Continuar: {nextStep.label}
                  <ArrowRight size={16} />
                </Link>
              )}

              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="font-medium text-foreground">Objetivo</p>
                  <p className="mt-1">Deixar um cliente pronto para o primeiro atendimento.</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="font-medium text-foreground">Melhor teste</p>
                  <p className="mt-1">Use um caso real, mesmo que simples.</p>
                </div>
                <div className="rounded-lg border border-border bg-muted/20 p-3">
                  <p className="font-medium text-foreground">Depois</p>
                  <p className="mt-1">Volte aqui e complete o que faltar.</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {steps.map((step, index) => (
                <Link
                  key={step.id}
                  href={step.done ? "#" : step.href}
                  className={cn(
                    "group grid gap-3 rounded-xl border px-4 py-3 transition-colors no-underline sm:grid-cols-[auto_1fr_auto]",
                    step.done
                      ? "border-border bg-muted/25 opacity-70 cursor-default pointer-events-none"
                      : "border-border hover:bg-accent hover:border-primary/30"
                  )}
                >
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                    step.done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:text-primary"
                  )}>
                    {step.done ? <CheckCircle2 size={19} /> : step.icon}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className={cn("text-sm font-semibold", step.done && "line-through")}>
                        {index + 1}. {step.label}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock3 size={11} />
                        {step.time}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                    <p className="text-xs leading-5 text-muted-foreground/85">{step.why}</p>
                  </div>
                  <div className="flex items-center justify-end">
                    {step.done
                      ? <CheckCircle2 size={18} className="text-primary shrink-0" />
                      : <Circle size={18} className="text-muted-foreground shrink-0 group-hover:text-primary" />
                    }
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
