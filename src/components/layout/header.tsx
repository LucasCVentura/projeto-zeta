"use client"

import { usePathname } from "next/navigation"

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

export function Header() {
  const pathname = usePathname()
  const title = Object.entries(titles).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  )?.[1] ?? "Zeta"

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <h1 className="font-heading text-lg font-semibold">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Notificações */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground touch-target">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </div>
    </header>
  )
}
