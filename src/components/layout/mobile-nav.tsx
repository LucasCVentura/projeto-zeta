"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/hooks/use-theme"
import { mediaUrl } from "@/lib/media-url"
import Image from "next/image"
import { can } from "@/lib/permissions"
import type { OrgRole } from "@/db/schema"
import { WhatsNewModal } from "@/components/changelog/whats-new-modal"
import type { ChangelogEntry } from "@/lib/changelog"

const allNavItems = [
  {
    label: "Início",
    href: "/dashboard",
    requiredAction: null,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: "Agenda",
    href: "/agenda",
    requiredAction: "schedule:read" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
    label: "Clientes",
    href: "/clientes",
    requiredAction: "clients:read" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Financeiro",
    href: "/financeiro",
    requiredAction: "financial:read" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Estoque",
    href: "/estoque",
    requiredAction: "org:update" as const,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
]

export function MobileNav({ role, changelogHasNew, changelogEntries }: { role: OrgRole; changelogHasNew: boolean; changelogEntries: ChangelogEntry[] }) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: session } = useSession()
  const { isDark, toggle, mounted } = useTheme()
  const sheetRef = useRef<HTMLDivElement>(null)

  const navItems = allNavItems.filter((item) =>
    item.requiredAction === null || can(role, item.requiredAction)
  )

  const name = session?.user?.name ?? "Minha conta"
  const image = session?.user?.image
  const initials = name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()

  const maisActive = pathname.startsWith("/configuracoes") || pathname.startsWith("/perfil")

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [menuOpen])

  useEffect(() => {
    const id = requestAnimationFrame(() => setMenuOpen(false))
    return () => cancelAnimationFrame(id)
  }, [pathname])

  async function handleLogout() {
    const res = await signOut({ redirect: false, callbackUrl: "/login" })
    window.location.assign(res?.url ?? "/login")
  }

  return (
    <>
      {/* Bottom sheet overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMenuOpen(false)} />
      )}

      {/* Bottom sheet */}
      <div
        ref={sheetRef}
        className={cn(
          "fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl border-t border-border bg-background shadow-xl transition-transform duration-200 lg:hidden",
          menuOpen ? "translate-y-0" : "translate-y-full pointer-events-none"
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {/* User info */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary overflow-hidden">
            {image ? (
              <Image src={mediaUrl(image)} alt={name} fill className="object-cover" sizes="40px" unoptimized />
            ) : initials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">{session?.user?.email ?? "Minha conta"}</p>
          </div>
        </div>

        {/* Menu items */}
        <div className="p-3 space-y-1">
          <Link
            href="/perfil"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-accent transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Ver perfil
          </Link>

          <Link
            href="/ajuda"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-accent transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="12" r="9" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r="0.5" fill="currentColor" />
            </svg>
            Ajuda
          </Link>

          <Link
            href="/configuracoes"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-accent transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Configurações
          </Link>

          <button
            onClick={toggle}
            suppressHydrationWarning
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-accent transition-colors"
          >
            {!mounted ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="5" />
              </svg>
            ) : isDark ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
            {mounted ? (isDark ? "Modo claro" : "Modo escuro") : "Modo escuro"}
          </button>

          <WhatsNewModal
            hasNew={changelogHasNew}
            entries={changelogEntries}
            onOpen={() => setMenuOpen(false)}
            triggerClassName="rounded-xl px-4 py-3 font-normal"
          />

          <div className="border-t border-border my-1" />

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>
        </div>

        {/* Safe area spacing */}
        <div className="h-2" />
      </div>

      {/* Nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center justify-around border-t border-border bg-background px-2 lg:hidden">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 transition-all",
                active ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}

        {/* Mais button */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            "flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 transition-colors",
            menuOpen || maisActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
          </svg>
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>
    </>
  )
}
