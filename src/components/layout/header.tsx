"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { getLowStockSuppliesAction } from "@/actions/supplies"

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/agenda": "Agenda",
  "/clientes": "Clientes",
  "/financeiro": "Financeiro",
  "/configuracoes": "Configurações",
  "/perfil": "Meu perfil",
  "/consulta": "Consulta",
  "/estoque": "Estoque",
}

type LowStockItem = { id: string; name: string; currentStock: string; minStock: string; unit: string }

export function Header() {
  const pathname = usePathname()
  const title = Object.entries(titles).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  )?.[1] ?? "Kira"

  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<LowStockItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getLowStockSuppliesAction().then((data) => {
      setItems(data as LowStockItem[])
      setLoaded(true)
    })
  }, [pathname])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <h1 className="font-heading text-lg font-semibold">{title}</h1>

      <div className="flex items-center gap-2">
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground touch-target"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {loaded && items.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {items.length > 9 ? "9+" : items.length}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border bg-popover shadow-lg z-50 overflow-hidden">
              <div className="border-b px-3 py-2.5">
                <p className="text-sm font-medium">Notificações</p>
              </div>

              {items.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                <>
                  <div className="max-h-72 overflow-y-auto">
                    {items.map((item) => (
                      <Link
                        key={item.id}
                        href="/estoque"
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-3 px-3 py-2.5 hover:bg-accent transition-colors"
                      >
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-destructive">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Estoque: {item.currentStock} {item.unit} (mínimo: {item.minStock} {item.unit})
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t px-3 py-2">
                    <Link
                      href="/estoque"
                      onClick={() => setOpen(false)}
                      className="text-xs text-primary hover:underline"
                    >
                      Ver estoque completo →
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
