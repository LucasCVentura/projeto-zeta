"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { useState, useRef, useEffect, useCallback } from "react"
import { getLowStockSuppliesAction } from "@/actions/supplies"
import { getNotificationsAction, markNotificationReadAction, markAllNotificationsReadAction } from "@/actions/notifications"
import { getMySupportUnreadAction } from "@/actions/support"
import { MessagesSquare } from "lucide-react"
import type { Notification } from "@/db/schema"

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

const STORAGE_KEY = "kira:dismissed-notifications"

type LowStockItem = { id: string; name: string; currentStock: string; minStock: string; unit: string }

function getDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function saveDismissed(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
}

export function Header({ supportTicketsEnabled }: { supportTicketsEnabled?: boolean } = {}) {
  const pathname = usePathname()
  const title = Object.entries(titles).find(([key]) =>
    pathname === key || pathname.startsWith(key + "/")
  )?.[1] ?? "Kira"

  const [open, setOpen] = useState(false)
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [dbNotifs, setDbNotifs] = useState<Notification[]>([])
  const [loaded, setLoaded] = useState(false)
  const [supportUnread, setSupportUnread] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!supportTicketsEnabled) return
    getMySupportUnreadAction().then(setSupportUnread).catch(() => {})
    const interval = setInterval(() => {
      getMySupportUnreadAction().then(setSupportUnread).catch(() => {})
    }, 30_000)
    return () => clearInterval(interval)
  }, [supportTicketsEnabled])

  const loadAll = useCallback(async () => {
    setDismissed(getDismissed())
    const [stock, notifs] = await Promise.all([
      getLowStockSuppliesAction(),
      getNotificationsAction(),
    ])
    setLowStockItems(stock as LowStockItem[])
    setDbNotifs(notifs as Notification[])
    setLoaded(true)
  }, [])

  useEffect(() => { loadAll() }, [pathname, loadAll])

  // Notificações podem chegar sem navegação (ex.: cliente agendando pelo link público)
  useEffect(() => {
    const interval = setInterval(loadAll, 30_000)
    return () => clearInterval(interval)
  }, [loadAll])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const unreadStock = lowStockItems.filter((i) => !dismissed.has(i.id))
  const unreadDb = dbNotifs.filter((n) => !n.read)
  const totalUnread = unreadStock.length + unreadDb.length

  function dismissStockOne(id: string) {
    const next = new Set(dismissed)
    next.add(id)
    setDismissed(next)
    saveDismissed(next)
  }

  async function dismissDbOne(id: string) {
    await markNotificationReadAction(id)
    setDbNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
  }

  async function dismissAll() {
    // estoque
    const next = new Set(lowStockItems.map((i) => i.id))
    setDismissed(next)
    saveDismissed(next)
    // banco
    await markAllNotificationsReadAction()
    setDbNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      <h1 className="font-heading text-lg font-semibold">{title}</h1>

      <div className="flex items-center gap-2">
        {supportTicketsEnabled && (
          <Link
            href="/chamado"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground touch-target"
            title="Chamado"
          >
            <MessagesSquare size={18} strokeWidth={1.75} />
            {supportUnread && (
              <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
              </span>
            )}
          </Link>
        )}
        <div ref={ref} className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground touch-target"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {loaded && totalUnread > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                {totalUnread > 9 ? "9+" : totalUnread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-1 w-76 rounded-lg border bg-popover shadow-lg z-50 overflow-hidden">
              <div className="flex items-center justify-between border-b px-3 py-2.5">
                <p className="text-sm font-medium">Notificações</p>
                {totalUnread > 0 && (
                  <button
                    onClick={dismissAll}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              {totalUnread === 0 ? (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-border">
                  {/* Notificações do banco (cancelamentos, etc.) */}
                  {unreadDb.map((notif) => (
                    <div key={notif.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-accent transition-colors group">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                      <Link
                        href={notif.href ?? "/agenda"}
                        onClick={() => { dismissDbOne(notif.id); setOpen(false) }}
                        className="min-w-0 flex-1"
                      >
                        <p className="text-sm font-medium truncate">{notif.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notif.body}</p>
                      </Link>
                      <button
                        onClick={() => dismissDbOne(notif.id)}
                        className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}

                  {/* Alertas de estoque baixo */}
                  {unreadStock.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-accent transition-colors group">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-destructive">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                      <Link
                        href="/estoque"
                        onClick={() => setOpen(false)}
                        className="min-w-0 flex-1"
                      >
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Estoque: {item.currentStock} {item.unit} (mínimo: {item.minStock} {item.unit})
                        </p>
                      </Link>
                      <button
                        onClick={() => dismissStockOne(item.id)}
                        className="mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
