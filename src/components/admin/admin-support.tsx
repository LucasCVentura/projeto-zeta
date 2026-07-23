"use client"

import { useState, useEffect, useRef } from "react"
import {
  getSupportThreadsAction,
  getSupportMessagesAction,
  sendAdminSupportMessageAction,
  setSupportThreadStatusAction,
  getOrCreateSupportThreadForOrgAction,
} from "@/actions/admin"
import type { SupportMessage } from "@/db/schema"
import { mediaUrl } from "@/lib/media-url"
import { Send, MessagesSquare, Search, ImagePlus, X, CheckCircle2, RotateCcw, Plus, ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Thread = {
  id: string
  organizationId: string
  orgName: string
  status: string
  lastMessageAt: Date
  lastMessagePreview: string | null
  unreadByAdmin: boolean
}

function formatTime(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="shrink-0 flex items-center justify-center h-9 w-9 rounded-full bg-primary/15 text-primary font-bold text-sm">
      {(name.match(/[a-zA-Z0-9]/)?.[0] ?? "#").toUpperCase()}
    </div>
  )
}

// ── Thread de mensagens ───────────────────────────────────────────────────────

function ThreadView({ thread, onStatusChange }: { thread: Thread; onStatusChange: (status: string) => void }) {
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [text, setText] = useState("")
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMessages([])
    setError(null)
    getSupportMessagesAction(thread.id).then(setMessages)

    const interval = setInterval(async () => {
      setMessages(await getSupportMessagesAction(thread.id))
    }, 3000)

    return () => clearInterval(interval)
  }, [thread.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handlePickImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) { setError("Formato inválido."); return }
    if (file.size > 10 * 1024 * 1024) { setError("Imagem muito grande. Máximo 10MB."); return }
    setError(null)
    setImage({ file, preview: URL.createObjectURL(file) })
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if ((!text.trim() && !image) || sending) return
    setSending(true)
    setError(null)

    const formData = new FormData()
    if (text.trim()) formData.set("content", text.trim())
    if (image) formData.set("image", image.file)

    const result = await sendAdminSupportMessageAction(thread.id, formData)
    if (!result.success) {
      setError(result.error ?? "Não foi possível enviar.")
      setSending(false)
      return
    }

    setText("")
    setImage(null)
    setMessages(await getSupportMessagesAction(thread.id))
    setSending(false)
  }

  async function toggleStatus() {
    const next = thread.status === "resolved" ? "open" : "resolved"
    await setSupportThreadStatusAction(thread.id, next)
    onStatusChange(next)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <Avatar name={thread.orgName} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{thread.orgName}</p>
          <p className="text-xs text-muted-foreground">{thread.status === "resolved" ? "Resolvido" : "Aberto"}</p>
        </div>
        <button
          onClick={toggleStatus}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
            thread.status === "resolved"
              ? "bg-muted text-muted-foreground hover:bg-accent"
              : "bg-green-100 text-green-700 hover:bg-green-200"
          )}
        >
          {thread.status === "resolved" ? <><RotateCcw size={12} /> Reabrir</> : <><CheckCircle2 size={12} /> Marcar resolvido</>}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5" style={{ background: "var(--muted)" }}>
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-10">Nenhuma mensagem ainda.</p>
        )}
        {messages.map((msg, i) => {
          const isOut = msg.senderType === "admin"
          const prevSame = i > 0 && messages[i - 1].senderType === msg.senderType
          return (
            <div key={msg.id} className={cn("flex", isOut ? "justify-end" : "justify-start", prevSame ? "mt-0.5" : "mt-2")}>
              <div className={cn(
                "max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm",
                isOut ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card text-foreground rounded-bl-sm"
              )}>
                {msg.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mediaUrl(msg.imageUrl)} alt="" className="rounded-lg max-w-full mb-1.5" />
                )}
                {msg.content && <p className="text-sm whitespace-pre-wrap leading-snug">{msg.content}</p>}
                <p className="text-[10px] opacity-50 mt-1 text-right">{formatTime(msg.createdAt)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-3 pt-2 shrink-0">
          <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs text-destructive">{error}</p>
        </div>
      )}

      {image && (
        <div className="px-3 pt-2 shrink-0">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.preview} alt="" className="h-16 w-16 rounded-lg object-cover" />
            <button
              onClick={() => setImage(null)}
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-background shrink-0">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handlePickImage(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
        >
          <ImagePlus size={17} />
        </button>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 h-9 text-sm rounded-full"
          disabled={sending}
        />
        <Button type="submit" size="sm" disabled={(!text.trim() && !image) || sending} className="h-9 w-9 p-0 rounded-full shrink-0">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </Button>
      </form>
    </div>
  )
}

// ── Iniciar chamado com uma clínica que ainda não escreveu ────────────────────

function NewThreadPanel({ orgs, existingOrgIds, onClose, onCreated }: {
  orgs: { id: string; name: string }[]
  existingOrgIds: Set<string>
  onClose: () => void
  onCreated: (thread: Thread) => void
}) {
  const [search, setSearch] = useState("")
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = orgs.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))

  async function handlePick(orgId: string) {
    setLoadingId(orgId)
    const thread = await getOrCreateSupportThreadForOrgAction(orgId)
    setLoadingId(null)
    if (thread) onCreated(thread)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} />
        </button>
        <p className="font-semibold text-sm">Iniciar chamado</p>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar clínica..."
            className="w-full rounded-lg bg-muted pl-7 pr-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
            <Search size={20} className="text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Nenhuma clínica encontrada.</p>
          </div>
        )}
        {filtered.map((o) => (
          <button
            key={o.id}
            onClick={() => handlePick(o.id)}
            disabled={loadingId === o.id}
            className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent transition-colors disabled:opacity-50"
          >
            {loadingId === o.id ? (
              <div className="shrink-0 flex items-center justify-center h-9 w-9">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Avatar name={o.name} />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{o.name}</p>
              {existingOrgIds.has(o.id) && <p className="text-xs text-muted-foreground">Já tem chamado — abre a conversa existente</p>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Lista de chamados ─────────────────────────────────────────────────────────

function ThreadList({ threads, activeId, onSelect, onNewThread }: { threads: Thread[]; activeId: string | null; onSelect: (t: Thread) => void; onNewThread: () => void }) {
  const [search, setSearch] = useState("")

  const filtered = threads.filter((t) => t.orgName.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex flex-col h-full border-r border-border/60">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="font-semibold text-sm">Chamados</p>
        <button
          onClick={onNewThread}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          title="Iniciar chamado"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar clínica..."
            className="w-full rounded-lg bg-muted pl-7 pr-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
            <MessagesSquare size={20} className="text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              {search ? "Nenhuma clínica encontrada." : "Nenhum chamado ainda."}
            </p>
          </div>
        )}
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => onSelect(t)}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-accent transition-colors",
              activeId === t.id && "bg-accent"
            )}
          >
            <Avatar name={t.orgName} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className={cn("text-sm truncate", t.unreadByAdmin ? "font-semibold" : "font-medium")}>{t.orgName}</p>
                <span className="text-[11px] text-muted-foreground shrink-0">{formatTime(t.lastMessageAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <p className="text-xs text-muted-foreground truncate">{t.lastMessagePreview ?? "—"}</p>
                {t.unreadByAdmin && <span className="flex h-2 w-2 rounded-full bg-primary shrink-0" />}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AdminSupport({ orgs }: { orgs: { id: string; name: string }[] }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)

  useEffect(() => {
    async function refresh() {
      const serverThreads = await getSupportThreadsAction()
      setThreads((prev) => {
        // Threads sem mensagem (recém-criadas no seletor, ainda sendo escritas)
        // não voltam do servidor — não deixa a conversa ativa sumir da tela
        // enquanto o admin ainda está digitando a primeira mensagem.
        if (!activeId || serverThreads.some((t) => t.id === activeId)) return serverThreads
        const draft = prev.find((t) => t.id === activeId)
        return draft ? [draft, ...serverThreads] : serverThreads
      })
    }
    refresh()
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [activeId])

  const active = threads.find((t) => t.id === activeId) ?? null

  function handleThreadCreated(thread: Thread) {
    setThreads((prev) => (prev.some((t) => t.id === thread.id) ? prev : [thread, ...prev]))
    setActiveId(thread.id)
    setPicking(false)
  }

  return (
    <div className="grid grid-cols-[280px_1fr] h-full">
      {picking ? (
        <NewThreadPanel
          orgs={orgs}
          existingOrgIds={new Set(threads.map((t) => t.organizationId))}
          onClose={() => setPicking(false)}
          onCreated={handleThreadCreated}
        />
      ) : (
        <ThreadList threads={threads} activeId={activeId} onSelect={(t) => setActiveId(t.id)} onNewThread={() => setPicking(true)} />
      )}
      {active ? (
        <ThreadView
          key={active.id}
          thread={active}
          onStatusChange={(status) => setThreads((prev) => prev.map((t) => (t.id === active.id ? { ...t, status } : t)))}
        />
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
          <MessagesSquare size={28} className="opacity-20" />
          <p className="text-sm">Selecione um chamado</p>
        </div>
      )}
    </div>
  )
}
