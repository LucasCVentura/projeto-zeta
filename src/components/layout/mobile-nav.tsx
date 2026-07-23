"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { ThemeMenu } from "./theme-menu"
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

type NavProps = { role: OrgRole; changelogHasNew: boolean; changelogEntries: ChangelogEntry[]; profileIncomplete?: boolean; couponsEnabled?: boolean; navRedesignEnabled?: boolean }

export function MobileNav({ role, changelogHasNew, changelogEntries, profileIncomplete, couponsEnabled, navRedesignEnabled }: NavProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const { data: session } = useSession()
  const sheetRef = useRef<HTMLDivElement>(null)

  const navItems = allNavItems.filter((item) =>
    item.requiredAction === null || can(role, item.requiredAction)
  )

  const name = session?.user?.name ?? "Minha conta"
  const image = session?.user?.image
  const initials = name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()

  const dockHrefs = navRedesignEnabled
    ? ["/perfil", "/configuracoes/procedimentos", "/configuracoes/pacotes", "/configuracoes/equipe", "/cupons", "/ajuda", "/configuracoes"]
    : ["/configuracoes", "/perfil"]
  const menuActive = dockHrefs.some((href) => pathname === href || pathname.startsWith(href + "/"))

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) setMenuOpen(false)
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

  const cellClass = "flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"

  return (
    <>
      {navRedesignEnabled ? (
        /* Dock — sobe de trás da barra ao abrir "Mais", desce e some ao fechar */
        <div
          ref={sheetRef}
          className={cn(
            "fixed bottom-16 left-0 right-0 z-40 origin-bottom border-t border-border bg-background shadow-xl transition-all duration-200 lg:hidden",
            menuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
          )}
        >
          <div className="p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] space-y-1">
          {/* Linha 1: perfil + cadastros — a quantidade varia por permissão/feature flag */}
          <div className="grid grid-cols-5 gap-1">
            <Link href="/perfil" className={cellClass}>
              <span className="relative">
                <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary overflow-hidden">
                  {image ? (
                    <Image src={mediaUrl(image)} alt="" fill className="object-cover" sizes="20px" unoptimized />
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                    </svg>
                  )}
                </div>
                {profileIncomplete && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary ring-1 ring-background" />
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium">Perfil</span>
            </Link>

            {can(role, "org:update") && (
              <Link href="/configuracoes/procedimentos" className={cellClass}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M11 2v6a2 2 0 0 0 .59 1.41L20 18a2 2 0 0 1-1.41 3.42H5.41A2 2 0 0 1 4 18l8.41-8.59A2 2 0 0 0 13 8V2" />
                  <path d="M8.5 2h7" />
                  <path d="M7 16h10" />
                </svg>
                <span className="text-[10px] font-medium">Procedim.</span>
              </Link>
            )}

            {can(role, "org:update") && (
              <Link href="/configuracoes/pacotes" className={cellClass}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8Z" />
                  <path d="M3.27 6.96 12 12l8.73-5.04M12 22V12" />
                </svg>
                <span className="text-[10px] font-medium">Pacotes</span>
              </Link>
            )}

            {role === "owner" && (
              <Link href="/configuracoes/equipe" className={cellClass}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  <path d="M17 11l1.5 1.5L21 10" />
                </svg>
                <span className="text-[10px] font-medium">Equipe</span>
              </Link>
            )}

            {can(role, "financial:write") && couponsEnabled && (
              <Link href="/cupons" className={cellClass}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M2 9a3 3 0 1 0 0 6" />
                  <path d="M20 9a3 3 0 1 1 0 6" />
                  <rect x="4" y="6" width="16" height="12" rx="2" />
                  <line x1="12" y1="6" x2="12" y2="18" strokeDasharray="2 2" />
                </svg>
                <span className="text-[10px] font-medium">Cupons</span>
              </Link>
            )}
          </div>

          {/* Linha 2: sistema/conta — sempre os mesmos 5, alinhados abaixo independente da linha 1 */}
          <div className="grid grid-cols-5 gap-1">
            <WhatsNewModal
              hasNew={changelogHasNew}
              entries={changelogEntries}
              stacked
              onOpen={() => setMenuOpen(false)}
              triggerClassName={cn(cellClass, "w-auto")}
            />

            <Link href="/ajuda" className={cellClass}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="9" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <circle cx="12" cy="17" r="0.5" fill="currentColor" />
              </svg>
              <span className="text-[10px] font-medium">Ajuda</span>
            </Link>

            <Link href="/configuracoes" className={cellClass}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span className="text-[10px] font-medium">Config.</span>
            </Link>

            <ThemeMenu stacked triggerClassName={cn(cellClass, "w-auto")} />

            <button onClick={handleLogout} className={cn(cellClass, "text-destructive hover:bg-destructive/10 hover:text-destructive")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span className="text-[10px] font-medium">Sair</span>
            </button>
          </div>
          </div>
        </div>
      ) : (
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
              <div className="relative shrink-0">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary overflow-hidden">
                  {image ? (
                    <Image src={mediaUrl(image)} alt={name} fill className="object-cover" sizes="40px" unoptimized />
                  ) : initials}
                </div>
                {profileIncomplete && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary ring-1 ring-background" />
                  </span>
                )}
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
                {profileIncomplete && (
                  <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-primary" />
                )}
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

              {can(role, "financial:write") && couponsEnabled && (
                <Link
                  href="/cupons"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm hover:bg-accent transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M2 9a3 3 0 1 0 0 6" />
                    <path d="M20 9a3 3 0 1 1 0 6" />
                    <rect x="4" y="6" width="16" height="12" rx="2" />
                    <line x1="12" y1="6" x2="12" y2="18" strokeDasharray="2 2" />
                  </svg>
                  Cupons e vale-presentes
                </Link>
              )}

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

              <ThemeMenu triggerClassName="rounded-xl px-4 py-3 font-normal" />

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
        </>
      )}

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
            menuOpen || menuActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-accent"
          )}
        >
          <span className="relative">
            <svg
              width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"
              className={cn("transition-transform duration-200", navRedesignEnabled && menuOpen && "rotate-90")}
            >
              <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
            </svg>
            {profileIncomplete && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary ring-1 ring-background" />
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">Mais</span>
        </button>
      </nav>
    </>
  )
}
