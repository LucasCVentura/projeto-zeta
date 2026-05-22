"use client"

import Link from "next/link"
import { CheckCircle2, Circle, CalendarClock, Stethoscope, UserPlus, CalendarPlus, X } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

type Step = {
  id: string
  label: string
  description: string
  href: string
  icon: React.ReactNode
  done: boolean
}

type Props = {
  hasSchedule: boolean
  hasProcedure: boolean
  hasClient: boolean
  hasAppointment: boolean
}

export function OnboardingChecklist({ hasSchedule, hasProcedure, hasClient, hasAppointment }: Props) {
  const [dismissed, setDismissed] = useState(false)

  const steps: Step[] = [
    {
      id: "schedule",
      label: "Configure sua agenda",
      description: "Defina seus horários e dias de atendimento",
      href: "/configuracoes/agenda",
      icon: <CalendarClock size={18} />,
      done: hasSchedule,
    },
    {
      id: "procedure",
      label: "Crie seu primeiro procedimento",
      description: "Adicione os tratamentos que você oferece",
      href: "/configuracoes/procedimentos",
      icon: <Stethoscope size={18} />,
      done: hasProcedure,
    },
    {
      id: "client",
      label: "Cadastre seu primeiro cliente",
      description: "Adicione os dados de quem você atende",
      href: "/clientes/novo",
      icon: <UserPlus size={18} />,
      done: hasClient,
    },
    {
      id: "appointment",
      label: "Faça seu primeiro agendamento",
      description: "Marque uma consulta na sua agenda",
      href: "/agenda",
      icon: <CalendarPlus size={18} />,
      done: hasAppointment,
    },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const allDone = completedCount === steps.length

  if (dismissed) return null

  return (
    <div className="surface space-y-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dispensar"
      >
        <X size={15} />
      </button>

      <div className="pr-6">
        <p className="text-sm font-medium">
          {allDone ? "Setup completo! 🎉" : "Primeiros passos"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {allDone
            ? "Você configurou tudo. Sua clínica está pronta."
            : `${completedCount} de ${steps.length} etapas concluídas`}
        </p>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {steps.map((step) => (
          <Link
            key={step.id}
            href={step.done ? "#" : step.href}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors no-underline",
              step.done
                ? "border-border bg-muted/30 opacity-60 cursor-default pointer-events-none"
                : "border-border hover:bg-accent hover:border-primary/30"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
              step.done ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", step.done && "line-through")}>{step.label}</p>
              <p className="text-xs text-muted-foreground">{step.description}</p>
            </div>
            {step.done
              ? <CheckCircle2 size={18} className="text-primary shrink-0" />
              : <Circle size={18} className="text-muted-foreground shrink-0" />
            }
          </Link>
        ))}
      </div>
    </div>
  )
}
