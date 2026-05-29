"use client"

import { cn } from "@/lib/utils"
import { Video, Image, Minus, CalendarDays } from "lucide-react"

type PostType = "reels" | "carousel" | "feed" | "off"

type DaySchedule = {
  day: string
  short: string
  type: PostType
  label: string
  description: string
}

const SCHEDULE: DaySchedule[] = [
  { day: "Segunda-feira",  short: "Seg", type: "off",      label: "Descanso",         description: "Sem post hoje. Planeje a semana." },
  { day: "Terça-feira",   short: "Ter", type: "reels",    label: "Reels",            description: "Vídeo curto. Foco em dor, dado ou comparativo." },
  { day: "Quarta-feira",  short: "Qua", type: "carousel", label: "Carousel",         description: "Post educativo ou funcionalidade do Kira." },
  { day: "Quinta-feira",  short: "Qui", type: "off",      label: "Descanso",         description: "Sem post hoje." },
  { day: "Sexta-feira",   short: "Sex", type: "reels",    label: "Reels",            description: "Vídeo curto. Pode ser depoimento ou bastidor." },
  { day: "Sábado",        short: "Sáb", type: "feed",     label: "Post feed",        description: "Imagem simples. CTA ou frase de impacto." },
  { day: "Domingo",       short: "Dom", type: "off",      label: "Descanso",         description: "Sem post hoje. Prepare conteúdo da semana." },
]

const TYPE_CONFIG = {
  reels:    { icon: Video,       color: "text-violet-500",  bg: "bg-violet-500/10 border-violet-500/20",  dot: "bg-violet-500" },
  carousel: { icon: Image,       color: "text-blue-500",    bg: "bg-blue-500/10 border-blue-500/20",      dot: "bg-blue-500" },
  feed:     { icon: Image,       color: "text-amber-500",   bg: "bg-amber-500/10 border-amber-500/20",    dot: "bg-amber-500" },
  off:      { icon: Minus,       color: "text-muted-foreground", bg: "bg-muted/40 border-transparent",   dot: "bg-muted-foreground/30" },
}

// 0 = domingo, 1 = segunda...
const JS_TO_SCHEDULE_INDEX = [6, 0, 1, 2, 3, 4, 5]

export function ContentSchedule() {
  const todayIndex = JS_TO_SCHEDULE_INDEX[new Date().getDay()]
  const today = SCHEDULE[todayIndex]
  const todayConfig = TYPE_CONFIG[today.type]

  return (
    <div className="space-y-6">

      {/* Card do dia */}
      <div className={cn(
        "rounded-xl border p-5 space-y-3",
        today.type === "off" ? "bg-muted/30 border-border" : "bg-card border-primary/20"
      )}>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <CalendarDays size={14} className="text-primary" />
          </div>
          <p className="text-sm font-medium">Hoje · {today.day}</p>
        </div>

        {today.type === "off" ? (
          <p className="text-sm text-muted-foreground">{today.description}</p>
        ) : (
          <div className={cn("rounded-xl border p-4 space-y-2", todayConfig.bg)}>
            <div className="flex items-center gap-2.5">
              <todayConfig.icon size={18} className={todayConfig.color} />
              <span className={cn("text-base font-bold", todayConfig.color)}>{today.label}</span>
            </div>
            <p className="text-sm text-muted-foreground">{today.description}</p>
          </div>
        )}
      </div>

      {/* Calendário semanal */}
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Semana</p>
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {SCHEDULE.map((item, i) => {
            const config = TYPE_CONFIG[item.type]
            const isToday = i === todayIndex
            const Icon = config.icon
            return (
              <div key={item.day} className={cn(
                "flex items-center gap-4 px-4 py-3.5 transition-colors",
                isToday ? "bg-primary/5" : "bg-card"
              )}>
                {/* Dia */}
                <div className="w-8 shrink-0 text-center">
                  <p className={cn("text-xs font-semibold", isToday ? "text-primary" : "text-muted-foreground")}>
                    {item.short}
                  </p>
                  {isToday && <div className="mx-auto mt-1 h-1 w-1 rounded-full bg-primary" />}
                </div>

                {/* Ícone */}
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border",
                  config.bg
                )}>
                  <Icon size={14} className={config.color} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium", item.type === "off" && "text-muted-foreground")}>
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                </div>

                {isToday && (
                  <span className="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                    hoje
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
