"use client"

import { useState, useEffect, useTransition } from "react"
import { Sparkles, X, Zap, Wrench, ArrowUp } from "lucide-react"
import { markChangelogSeenAction } from "@/actions/changelog"
import type { ChangelogEntry } from "@/lib/changelog"
import { cn } from "@/lib/utils"

type Props = {
  hasNew: boolean
  entries: ChangelogEntry[]
  collapsed?: boolean
}

const TYPE_CONFIG = {
  new:         { label: "Novo",     icon: Sparkles, className: "bg-primary/10 text-primary" },
  improvement: { label: "Melhoria", icon: ArrowUp,  className: "bg-blue-500/10 text-blue-400" },
  fix:         { label: "Fix",      icon: Wrench,   className: "bg-amber-500/10 text-amber-400" },
}

export function WhatsNewModal({ hasNew: initialHasNew, entries, collapsed }: Props) {
  const [open, setOpen] = useState(false)
  const [hasNew, setHasNew] = useState(initialHasNew)
  const [visible, setVisible] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (open) requestAnimationFrame(() => setVisible(true))
    else setVisible(false)
  }, [open])

  function handleOpen() {
    setOpen(true)
    if (hasNew) {
      setHasNew(false)
      startTransition(() => { markChangelogSeenAction() })
    }
  }

  function handleClose() {
    setVisible(false)
    setTimeout(() => setOpen(false), 200)
  }

  return (
    <>
      {/* Trigger — usado pelo sidebar */}
      <button
        id="whats-new-trigger"
        onClick={handleOpen}
        title={collapsed ? "Novidades" : undefined}
        className={cn(
          "relative flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors",
          collapsed && "justify-center px-0"
        )}
      >
        <span className="relative shrink-0">
          <Zap size={18} />
          {hasNew && collapsed && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2 rounded-full bg-primary ring-1 ring-background" />
          )}
        </span>
        {!collapsed && <span>Novidades</span>}
        {hasNew && !collapsed && (
          <span className="ml-auto flex h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
        )}
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div
            className="absolute inset-0 bg-black/50 transition-opacity duration-200"
            style={{ opacity: visible ? 1 : 0 }}
          />
          <div
            className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl flex flex-col max-h-[80vh] transition-all duration-200"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0) scale(1)" : "translateY(16px) scale(0.97)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-primary" />
                <span className="font-semibold text-sm">O que há de novo</span>
              </div>
              <button
                onClick={handleClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
              {entries.map((entry, i) => (
                <div key={entry.version} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-xs font-bold px-2.5 py-1 rounded-full border",
                      i === 0 ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
                    )}>
                      v{entry.version}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    {i === 0 && (
                      <span className="ml-auto text-[10px] font-bold uppercase tracking-wide text-primary">Atual</span>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {entry.items.map((item, j) => {
                      const cfg = TYPE_CONFIG[item.type]
                      const Icon = cfg.icon
                      return (
                        <li key={j} className="flex items-start gap-2.5">
                          <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px]", cfg.className)}>
                            <Icon size={11} />
                          </span>
                          <span className="text-sm text-foreground/90 leading-snug">{item.text}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">kiraclinic.com.br</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
