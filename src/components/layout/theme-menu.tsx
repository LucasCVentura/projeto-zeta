"use client"

import { useEffect, useRef, useState } from "react"
import { Sun, SunDim, Moon, MoonStar, Check } from "lucide-react"
import { useTheme, type ThemeMode } from "@/hooks/use-theme"
import { cn } from "@/lib/utils"

const OPTIONS: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
  { mode: "light", label: "Claro", icon: Sun },
  { mode: "light-slate", label: "Claro Neutro", icon: SunDim },
  { mode: "dark", label: "Escuro", icon: Moon },
  { mode: "dark-slate", label: "Escuro Neutro", icon: MoonStar },
]

export function ThemeMenu({ collapsed, triggerClassName }: { collapsed?: boolean; triggerClassName?: string }) {
  const { mode, setTheme, mounted } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const current = OPTIONS.find((o) => o.mode === mode) ?? OPTIONS[1]
  const CurrentIcon = current.icon

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        suppressHydrationWarning
        title={collapsed ? (mounted ? current.label : "Escuro") : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
          collapsed && "justify-center px-0",
          triggerClassName
        )}
      >
        <CurrentIcon size={18} strokeWidth={1.75} className="shrink-0" />
        {!collapsed && (mounted ? current.label : "Escuro")}
      </button>

      {open && (
        <div className={cn(
          "absolute z-50 min-w-44 rounded-lg border bg-popover shadow-lg overflow-hidden",
          collapsed ? "left-full bottom-0 ml-1" : "bottom-full left-0 right-0 mb-1"
        )}>
          {OPTIONS.map((option) => {
            const Icon = option.icon
            const active = option.mode === mode
            return (
              <button
                key={option.mode}
                onClick={() => { setTheme(option.mode); setOpen(false) }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-3 py-2.5 text-sm transition-colors",
                  active ? "text-foreground bg-accent/60" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon size={15} strokeWidth={1.75} className="shrink-0" />
                {option.label}
                {active && <Check size={14} className="ml-auto shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
