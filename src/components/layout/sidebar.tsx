"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { ThemeMenu } from "./theme-menu"
import { mediaUrl } from "@/lib/media-url"
import { KiraMark } from "@/components/ui/kira-mark"
import { useSidebar } from "./sidebar-context"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { can } from "@/lib/permissions"
import type { OrgRole } from "@/db/schema"
import { WhatsNewModal } from "@/components/changelog/whats-new-modal"
import type { ChangelogEntry } from "@/lib/changelog"

const allNavItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    requiredAction: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
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
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    label: "Cupons",
    href: "/cupons",
    requiredAction: "financial:write" as const,
    requiresCoupons: true,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M2 9a3 3 0 1 0 0 6" />
        <path d="M20 9a3 3 0 1 1 0 6" />
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <line x1="12" y1="6" x2="12" y2="18" strokeDasharray="2 2" />
      </svg>
    ),
  },
  {
    label: "Ajuda",
    href: "/ajuda",
    requiredAction: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <circle cx="12" cy="17" r="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Configurações",
    href: "/configuracoes",
    requiredAction: null,
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
]

export function Sidebar({ role, changelogHasNew, changelogEntries, profileIncomplete, couponsEnabled }: { role: OrgRole; changelogHasNew: boolean; changelogEntries: ChangelogEntry[]; profileIncomplete?: boolean; couponsEnabled?: boolean }) {
  const pathname = usePathname()
  const { collapsed, toggle: toggleSidebar } = useSidebar()

  const navItems = allNavItems.filter((item) =>
    (item.requiredAction === null || can(role, item.requiredAction)) &&
    (!("requiresCoupons" in item) || couponsEnabled)
  )

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-border bg-sidebar transition-all duration-200",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-3">
        <div className={cn("flex items-center gap-2.5 flex-1 min-w-0", collapsed && "justify-center")}>
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
            <KiraMark size={24} />
          </div>
          {!collapsed && <span className="font-semibold tracking-tight truncate">Kira</span>}
        </div>
        <button
          onClick={toggleSidebar}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed
              ? <path d="M9 18l6-6-6-6" />
              : <path d="M15 18l-6-6 6-6" />
            }
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 p-3 min-h-0 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <span className={cn("shrink-0", active ? "text-primary" : "text-muted-foreground")}>
                {item.icon}
              </span>
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Theme menu + User */}
      <div className="border-t border-border p-3 space-y-1">
        <ThemeMenu collapsed={collapsed} />
        <WhatsNewModal hasNew={changelogHasNew} entries={changelogEntries} collapsed={collapsed} />
        <UserMenu collapsed={collapsed} profileIncomplete={profileIncomplete} />
      </div>
    </aside>
  )
}

function UserMenu({ collapsed, profileIncomplete }: { collapsed: boolean; profileIncomplete?: boolean }) {
  const { data: session } = useSession()
  const name = session?.user?.name ?? "Minha conta"
  const image = session?.user?.image
  const initials = name.split(" ").slice(0, 2).map((n: string) => n[0]).join("").toUpperCase()
  const [open, setOpen] = useState(false)
  const [avatarTs, setAvatarTs] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  useEffect(() => {
    function handleAvatarUpdate(e: Event) {
      setAvatarTs(String((e as CustomEvent).detail))
    }
    window.addEventListener("avatar-updated", handleAvatarUpdate)
    return () => window.removeEventListener("avatar-updated", handleAvatarUpdate)
  }, [])

  async function handleLogout() {
    const res = await signOut({ redirect: false, callbackUrl: "/login" })
    window.location.assign(res?.url ?? "/login")
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? name : undefined}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="relative shrink-0">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary overflow-hidden">
            {image ? (
              <Image src={mediaUrl(image) + (avatarTs ? `?t=${avatarTs}` : "")} alt={name} fill className="object-cover" sizes="32px" unoptimized />
            ) : initials}
          </div>
          {profileIncomplete && (
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary ring-1 ring-background" />
            </span>
          )}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium">{name}</p>
              <p className="truncate text-xs text-muted-foreground">Minha conta</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted-foreground">
              <path d="M6 9l6-6 6 6M6 15l6 6 6-6" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border bg-popover shadow-lg overflow-hidden z-50 min-w-40">
          <Link href="/perfil" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            Ver perfil
            {profileIncomplete && (
              <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </Link>
          <Link href="/configuracoes" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-accent transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
            </svg>
            Configurações
          </Link>
          <div className="border-t" />
          <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>
        </div>
      )}
    </div>
  )
}
