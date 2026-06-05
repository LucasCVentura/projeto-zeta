"use client"

import { useState, useEffect, useRef } from "react"
import {
  getAdminChatConversationsAction,
  getAdminChatMessagesAction,
  sendAdminChatMessageAction,
  sendAdminChatTemplateAction,
  getTrialOrgsForChatAction,
} from "@/actions/admin"
import type { AdminChatMessage } from "@/db/schema"
import { Send, MessageSquare, Plus, ChevronLeft, Sparkles, Search, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Conversation = {
  phone: string
  senderName: string | null
  lastMessage: string
  lastDirection: string
  lastAt: Date
  unread: number
  queue: string | null
  userName: string | null
  orgName: string | null
}

type TrialOrg = {
  orgId: string
  orgName: string
  ownerName: string
  phone: string | null
  status: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
}

function formatPhone(phone: string) {
  const d = phone.replace(/\D/g, "").replace(/^55/, "")
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return phone
}

function QueueBadge({ queue }: { queue: string | null }) {
  if (!queue) return null
  if (queue === "support")    return <span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-semibold">Suporte</span>
  if (queue === "commercial") return <span className="rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-semibold">Comercial</span>
  return null
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"
  return (
    <div className={cn("shrink-0 flex items-center justify-center rounded-full bg-primary/15 text-primary font-bold", s)}>
      {(name.match(/[a-zA-Z0-9]/)?.[0] ?? "#").toUpperCase()}
    </div>
  )
}

// ── Painel de nova conversa ───────────────────────────────────────────────────

function NewConversationPanel({
  trialOrgs,
  trialOutreachTemplateId,
  onStarted,
  onClose,
}: {
  trialOrgs: TrialOrg[]
  trialOutreachTemplateId: string | null
  onStarted: (phone: string, name: string) => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")

  const filtered = trialOrgs.filter(o =>
    o.phone && (
      o.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orgName.toLowerCase().includes(search.toLowerCase())
    )
  )

  async function handleSendTemplate(org: TrialOrg) {
    if (!org.phone || !trialOutreachTemplateId) return
    setLoading(org.orgId)
    try {
      await sendAdminChatTemplateAction(org.phone, org.ownerName, trialOutreachTemplateId)
      setSent(prev => new Set([...prev, org.orgId]))
      onStarted(org.phone, org.ownerName)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} />
        </button>
        <p className="font-semibold text-sm">Nova conversa — Trial</p>
      </div>

      {!trialOutreachTemplateId && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          Configure o ID do template <strong>kira_trial_outreach</strong> em Config WhatsApp.
        </div>
      )}

      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nome ou clínica..."
            className="w-full rounded-lg bg-muted pl-8 pr-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {filtered.map((org) => (
          <div key={org.orgId} className="flex items-center gap-3 px-4 py-3">
            <Avatar name={org.ownerName} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{org.ownerName}</p>
              <p className="text-xs text-muted-foreground truncate">{org.orgName} · {formatPhone(org.phone!)}</p>
            </div>
            <Button
              size="sm"
              variant={sent.has(org.orgId) ? "outline" : "default"}
              disabled={!!loading || sent.has(org.orgId) || !trialOutreachTemplateId}
              onClick={() => handleSendTemplate(org)}
              className="shrink-0 h-7 text-xs gap-1"
            >
              <Sparkles size={11} />
              {sent.has(org.orgId) ? "Enviado" : loading === org.orgId ? "..." : "Contatar"}
            </Button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-10 text-sm text-muted-foreground text-center">
            {search ? "Nenhum resultado." : "Nenhum usuário em trial com telefone cadastrado."}
          </p>
        )}
      </div>
    </div>
  )
}

// ── Área de mensagens ─────────────────────────────────────────────────────────

function MessageArea({ phone, displayName, queue, orgName }: {
  phone: string
  displayName: string
  queue: string | null
  orgName: string | null
}) {
  const [messages, setMessages] = useState<AdminChatMessage[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  useEffect(() => {
    setMessages([])
    getAdminChatMessagesAction(phone).then(setMessages)

    const interval = setInterval(async () => {
      const updated = await getAdminChatMessagesAction(phone)
      setMessages(updated)
    }, 3000)

    return () => clearInterval(interval)
  }, [phone])

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const content = text.trim()
    setText("")
    await sendAdminChatMessageAction(phone, content)
    const updated = await getAdminChatMessagesAction(phone)
    setMessages(updated)
    setSending(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header da conversa */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30 shrink-0">
        <Avatar name={displayName} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-sm truncate">{displayName}</p>
            <QueueBadge queue={queue} />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone size={11} />
            <span>{formatPhone(phone)}</span>
            {orgName && <><span>·</span><span className="truncate">{orgName}</span></>}
          </div>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5" style={{ background: "var(--muted)" }}>
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-10">Nenhuma mensagem ainda.</p>
        )}
        {messages.map((msg, i) => {
          const isOut = msg.direction === "outbound"
          const prevSameDir = i > 0 && messages[i - 1].direction === msg.direction
          return (
            <div key={msg.id} className={cn("flex", isOut ? "justify-end" : "justify-start", prevSameDir ? "mt-0.5" : "mt-2")}>
              <div className={cn(
                "max-w-[70%] rounded-2xl px-3.5 py-2 shadow-sm",
                isOut ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card text-foreground rounded-bl-sm"
              )}>
                <p className="text-sm whitespace-pre-wrap leading-snug">{msg.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  {msg.templateUsed && <span className="text-[10px] opacity-50">template</span>}
                  <span className="text-[10px] opacity-50">{formatTime(msg.createdAt)}</span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-background shrink-0">
        <Input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 h-9 text-sm rounded-full"
          disabled={sending}
        />
        <Button type="submit" size="sm" disabled={!text.trim() || sending} className="h-9 w-9 p-0 rounded-full">
          <Send size={15} />
        </Button>
      </form>
    </div>
  )
}

// ── Lista de conversas ────────────────────────────────────────────────────────

function ConversationList({
  conversations,
  activePhone,
  onSelect,
  onNewConversation,
}: {
  conversations: Conversation[]
  activePhone: string | null
  onSelect: (conv: Conversation) => void
  onNewConversation: () => void
}) {
  const [search, setSearch] = useState("")

  const filtered = conversations.filter(c => {
    const name = (c.userName ?? c.senderName ?? c.phone).toLowerCase()
    return name.includes(search.toLowerCase()) || c.phone.includes(search)
  })

  function getDisplayName(conv: Conversation) {
    return conv.userName ?? conv.senderName ?? formatPhone(conv.phone)
  }

  return (
    <div className="flex flex-col h-full border-r border-border/60">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="font-semibold text-sm">Conversas</p>
        <button
          onClick={onNewConversation}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          title="Nova conversa"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Busca */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar conversa..."
            className="w-full rounded-lg bg-muted pl-7 pr-3 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center px-4">
            <MessageSquare size={20} className="text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">
              {search ? "Nenhuma conversa encontrada." : "Nenhuma conversa ainda.\nUse + para contatar usuários em trial."}
            </p>
          </div>
        )}
        {filtered.map((conv) => (
          <button
            key={conv.phone}
            onClick={() => onSelect(conv)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left",
              activePhone === conv.phone && "bg-accent"
            )}
          >
            <Avatar name={getDisplayName(conv)} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className={cn("text-sm truncate", conv.unread > 0 ? "font-semibold" : "font-medium")}>
                    {getDisplayName(conv)}
                  </p>
                  <QueueBadge queue={conv.queue} />
                </div>
                <span className="text-[11px] text-muted-foreground shrink-0">{formatTime(conv.lastAt)}</span>
              </div>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <p className="text-xs text-muted-foreground truncate">
                  {conv.lastDirection === "outbound" ? "Você: " : ""}{conv.lastMessage}
                </p>
                {conv.unread > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shrink-0">
                    {conv.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AdminChat({ trialOutreachTemplateId }: { trialOutreachTemplateId: string | null }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [trialOrgs, setTrialOrgs] = useState<TrialOrg[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAdminChatConversationsAction(),
      getTrialOrgsForChatAction(),
    ]).then(([convs, orgs]) => {
      setConversations(convs as Conversation[])
      setTrialOrgs(orgs as TrialOrg[])
      setLoading(false)
    })

    const interval = setInterval(async () => {
      const convs = await getAdminChatConversationsAction()
      setConversations(convs as Conversation[])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  async function refreshConversations() {
    const convs = await getAdminChatConversationsAction()
    setConversations(convs as Conversation[])
  }

  function handleSelectConv(conv: Conversation) {
    setActiveConv(conv)
    setShowNew(false)
  }

  async function handleConvStarted(phone: string, name: string) {
    await refreshConversations()
    const convs = await getAdminChatConversationsAction() as Conversation[]
    const conv = convs.find(c => c.phone === phone) ?? {
      phone, senderName: name, userName: name, orgName: null,
      lastMessage: "", lastDirection: "outbound", lastAt: new Date(), unread: 0, queue: null,
    }
    setConversations(convs)
    setActiveConv(conv as Conversation)
    setShowNew(false)
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="h-full flex bg-background overflow-hidden">
      {/* Coluna esquerda — lista */}
      <div className={cn("flex flex-col w-80 shrink-0", activeConv && "hidden sm:flex")}>
        {showNew ? (
          <NewConversationPanel
            trialOrgs={trialOrgs}
            trialOutreachTemplateId={trialOutreachTemplateId}
            onStarted={handleConvStarted}
            onClose={() => setShowNew(false)}
          />
        ) : (
          <ConversationList
            conversations={conversations}
            activePhone={activeConv?.phone ?? null}
            onSelect={handleSelectConv}
            onNewConversation={() => setShowNew(true)}
          />
        )}
      </div>

      {/* Coluna direita — mensagens */}
      <div className={cn("flex-1 flex flex-col", !activeConv && "hidden sm:flex")}>
        {activeConv ? (
          <>
            {/* Botão voltar no mobile */}
            <div className="sm:hidden">
              <button
                onClick={() => setActiveConv(null)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground"
              >
                <ChevronLeft size={14} /> Voltar
              </button>
            </div>
            <MessageArea
              phone={activeConv.phone}
              displayName={activeConv.userName ?? activeConv.senderName ?? formatPhone(activeConv.phone)}
              queue={activeConv.queue}
              orgName={activeConv.orgName}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center bg-muted/30">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <MessageSquare size={28} className="text-primary" />
            </div>
            <p className="font-medium text-sm">Selecione uma conversa</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Escolha uma conversa à esquerda ou use <strong>+</strong> para contatar um usuário em trial.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
