"use client"

import { useState, useEffect, useRef } from "react"
import {
  getAdminChatConversationsAction,
  getAdminChatMessagesAction,
  sendAdminChatMessageAction,
  sendAdminChatTemplateAction,
  getTrialOrgsForChatAction,
  getExpiredTrialOrgsForChatAction,
  getActiveSubscribersForChatAction,
  getWinbackOrgsForChatAction,
  generateReactivationTokenAction,
  archiveConversationAction,
} from "@/actions/admin"
import type { AdminChatMessage } from "@/db/schema"
import { Send, MessageSquare, Plus, ChevronLeft, Sparkles, Search, Phone, Archive, ArchiveRestore } from "lucide-react"
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
  archived: boolean
}

type TrialOrg = {
  orgId: string
  orgName: string
  ownerName: string
  phone: string | null
  status: string
  trialEndsAt: Date | null
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

type OutreachTab = "trial" | "expired" | "testimonial" | "winback"

function NewConversationPanel({
  trialOrgs,
  expiredOrgs,
  activeSubscribers,
  winbackOrgs,
  trialOutreachTemplateId,
  trialExpiredOutreachTemplateId,
  testimonialOutreachTemplateId,
  winbackOutreachTemplateId,
  onStarted,
  onClose,
}: {
  trialOrgs: TrialOrg[]
  expiredOrgs: TrialOrg[]
  activeSubscribers: TrialOrg[]
  winbackOrgs: TrialOrg[]
  trialOutreachTemplateId: string | null
  trialExpiredOutreachTemplateId: string | null
  testimonialOutreachTemplateId: string | null
  winbackOutreachTemplateId: string | null
  onStarted: (phone: string, name: string) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<OutreachTab>("trial")
  const [loading, setLoading] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")

  const activeOrgs =
    tab === "trial" ? trialOrgs :
    tab === "expired" ? expiredOrgs :
    tab === "testimonial" ? activeSubscribers :
    winbackOrgs
  const activeTemplateId =
    tab === "trial" ? trialOutreachTemplateId :
    tab === "expired" ? trialExpiredOutreachTemplateId :
    tab === "testimonial" ? testimonialOutreachTemplateId :
    winbackOutreachTemplateId
  const templateName =
    tab === "trial" ? "kira_trial_outreach" :
    tab === "expired" ? "kira_trial_expired_outreach" :
    tab === "testimonial" ? "kira_testimonial_outreach" :
    "kira_winback_outreach"

  const filtered = activeOrgs.filter(o =>
    o.phone && (
      o.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orgName.toLowerCase().includes(search.toLowerCase())
    )
  )

  async function handleSendTemplate(org: TrialOrg) {
    if (!org.phone || !activeTemplateId) return
    setLoading(org.orgId)
    try {
      const firstName = org.ownerName.split(" ")[0]
      let content: string | undefined
      let templateParams: string[] = [firstName]

      if (tab === "expired") {
        content = `Oi ${firstName}, tudo bem? 😊\n\nAqui é o Lucas, do Kira. Vi que seu período de teste acabou e queria entender melhor como foi sua experiência.\n\nTeve alguma dificuldade? Posso te ajudar com algo? Me conta!`
      } else if (tab === "testimonial") {
        content = `Olá ${firstName}, ficamos muito felizes que você escolheu o Kira e sua assinatura já consta como ativa! 🎉\n\nGostaríamos de saber o que te fez assinar o Kira, e o que ele te ajuda no dia a dia da sua clínica — e com a sua permissão gostaríamos de adicionar esse feedback no nosso site e instagram. 😊`
      } else if (tab === "winback") {
        const token = await generateReactivationTokenAction(org.orgId)
        const link = `https://www.kiraclinic.com.br/reativar/${token}`
        templateParams = [firstName, link]
        content = `Olá ${firstName}, nós do Kira estamos sentindo sua falta! 😢\n\nO que falta pra você começar a organizar sua agenda e financeiro tudo em um só lugar?\n\nClica no link abaixo e reative sua conta ganhando mais *7 dias grátis* pra testar novamente — tenho certeza que não vai se arrepender! 🎁\n\n${link}`
      }

      await sendAdminChatTemplateAction(org.phone, org.ownerName, activeTemplateId, {
        content,
        templateUsed: templateName,
        templateParams,
      })
      setSent(prev => new Set([...prev, org.orgId]))
      onStarted(org.phone, org.ownerName)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  function resetTab(t: OutreachTab) {
    setTab(t)
    setSearch("")
    setSent(new Set())
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft size={18} />
        </button>
        <p className="font-semibold text-sm">Nova conversa</p>
      </div>

      {/* Abas */}
      <div className="flex flex-wrap px-3 pt-2 pb-0 gap-1 border-b border-border">
        <button
          onClick={() => resetTab("trial")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors",
            tab === "trial"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Em trial ({trialOrgs.filter(o => o.phone).length})
        </button>
        <button
          onClick={() => resetTab("expired")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors",
            tab === "expired"
              ? "bg-red-600 text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Trial expirado ({expiredOrgs.filter(o => o.phone).length})
        </button>
        <button
          onClick={() => resetTab("winback")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors",
            tab === "winback"
              ? "bg-orange-500 text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Inativos ({winbackOrgs.filter(o => o.phone).length})
        </button>
        <button
          onClick={() => resetTab("testimonial")}
          className={cn(
            "px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors",
            tab === "testimonial"
              ? "bg-emerald-600 text-white"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Assinantes ({activeSubscribers.filter(o => o.phone).length})
        </button>
      </div>

      {!activeTemplateId && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
          Configure o ID do template <strong>{templateName}</strong> em Config WhatsApp.
        </div>
      )}

      {tab === "winback" && activeTemplateId && (
        <div className="px-4 py-2.5 bg-orange-50 border-b border-orange-200 text-xs text-orange-700">
          Trial expirado há mais de 1 mês. O link de reativação (+7 dias) é gerado automaticamente ao contatar.
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
              {(tab === "expired" || tab === "winback") && org.trialEndsAt && (
                <p className="text-[10px] text-red-500 mt-0.5">
                  Expirou em {new Date(org.trialEndsAt).toLocaleDateString("pt-BR")}
                </p>
              )}
            </div>
            <Button
              size="sm"
              variant={sent.has(org.orgId) ? "outline" : "default"}
              disabled={!!loading || sent.has(org.orgId) || !activeTemplateId}
              onClick={() => handleSendTemplate(org)}
              className={cn(
                "shrink-0 h-7 text-xs gap-1",
                !sent.has(org.orgId) && tab === "expired" && "bg-red-600 hover:bg-red-700 text-white border-0",
                !sent.has(org.orgId) && tab === "winback" && "bg-orange-500 hover:bg-orange-600 text-white border-0",
                !sent.has(org.orgId) && tab === "testimonial" && "bg-emerald-600 hover:bg-emerald-700 text-white border-0",
              )}
            >
              <Sparkles size={11} />
              {sent.has(org.orgId) ? "Enviado" : loading === org.orgId ? "..." : "Contatar"}
            </Button>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="px-4 py-10 text-sm text-muted-foreground text-center">
            {search
              ? "Nenhum resultado."
              : tab === "expired"
              ? "Nenhum trial expirado encontrado."
              : tab === "winback"
              ? "Nenhum inativo há mais de 1 mês com telefone cadastrado."
              : tab === "testimonial"
              ? "Nenhum assinante ativo com telefone cadastrado."
              : "Nenhum usuário em trial com telefone cadastrado."}
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
  onArchive,
}: {
  conversations: Conversation[]
  activePhone: string | null
  onSelect: (conv: Conversation) => void
  onNewConversation: () => void
  onArchive: (phone: string, archived: boolean) => void
}) {
  const [search, setSearch] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  const filtered = conversations.filter(c => {
    if (c.archived !== showArchived) return false
    const name = (c.userName ?? c.senderName ?? c.phone).toLowerCase()
    return name.includes(search.toLowerCase()) || c.phone.includes(search)
  })

  const archivedCount = conversations.filter(c => c.archived).length

  function getDisplayName(conv: Conversation) {
    return conv.userName ?? conv.senderName ?? formatPhone(conv.phone)
  }

  return (
    <div className="flex flex-col h-full border-r border-border/60">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="font-semibold text-sm">{showArchived ? "Arquivadas" : "Conversas"}</p>
        <div className="flex items-center gap-1">
          {archivedCount > 0 && (
            <button
              onClick={() => { setShowArchived(v => !v); setSearch("") }}
              className={cn(
                "flex items-center gap-1 h-7 px-2 rounded-full text-xs transition-colors",
                showArchived
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title={showArchived ? "Ver ativas" : "Ver arquivadas"}
            >
              <Archive size={12} />
              {archivedCount}
            </button>
          )}
          {!showArchived && (
            <button
              onClick={onNewConversation}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              title="Nova conversa"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
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
              {search
                ? "Nenhuma conversa encontrada."
                : showArchived
                ? "Nenhuma conversa arquivada."
                : "Nenhuma conversa ainda.\nUse + para contatar usuários em trial."}
            </p>
          </div>
        )}
        {filtered.map((conv) => (
          <div
            key={conv.phone}
            className={cn(
              "group flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors",
              activePhone === conv.phone && "bg-accent"
            )}
          >
            <button className="flex items-center gap-3 flex-1 min-w-0 text-left" onClick={() => onSelect(conv)}>
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
            <button
              onClick={() => onArchive(conv.phone, !conv.archived)}
              className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground p-1 rounded"
              title={conv.archived ? "Desarquivar" : "Arquivar"}
            >
              {conv.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AdminChat({
  trialOutreachTemplateId,
  trialExpiredOutreachTemplateId,
  testimonialOutreachTemplateId,
  winbackOutreachTemplateId,
}: {
  trialOutreachTemplateId: string | null
  trialExpiredOutreachTemplateId: string | null
  testimonialOutreachTemplateId: string | null
  winbackOutreachTemplateId: string | null
}) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [trialOrgs, setTrialOrgs] = useState<TrialOrg[]>([])
  const [expiredOrgs, setExpiredOrgs] = useState<TrialOrg[]>([])
  const [activeSubscribers, setActiveSubscribers] = useState<TrialOrg[]>([])
  const [winbackOrgs, setWinbackOrgs] = useState<TrialOrg[]>([])
  const [activeConv, setActiveConv] = useState<Conversation | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAdminChatConversationsAction(true),
      getTrialOrgsForChatAction(),
      getExpiredTrialOrgsForChatAction(),
      getActiveSubscribersForChatAction(),
      getWinbackOrgsForChatAction(),
    ]).then(([convs, orgs, expired, subscribers, winback]) => {
      setConversations(convs as Conversation[])
      setTrialOrgs(orgs as TrialOrg[])
      setExpiredOrgs(expired as TrialOrg[])
      setActiveSubscribers(subscribers as TrialOrg[])
      setWinbackOrgs(winback as TrialOrg[])
      setLoading(false)
    })

    const interval = setInterval(async () => {
      const convs = await getAdminChatConversationsAction(true)
      setConversations(convs as Conversation[])
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  async function refreshConversations() {
    const convs = await getAdminChatConversationsAction(true)
    setConversations(convs as Conversation[])
  }

  async function handleArchive(phone: string, archived: boolean) {
    await archiveConversationAction(phone, archived)
    setConversations(prev => prev.map(c => c.phone === phone ? { ...c, archived } : c))
    if (archived && activeConv?.phone === phone) setActiveConv(null)
  }

  function handleSelectConv(conv: Conversation) {
    setActiveConv({ ...conv, unread: 0 })
    setConversations(prev => prev.map(c => c.phone === conv.phone ? { ...c, unread: 0 } : c))
    setShowNew(false)
  }

  async function handleConvStarted(phone: string, name: string) {
    await refreshConversations()
    const convs = await getAdminChatConversationsAction() as Conversation[]
    const conv = convs.find(c => c.phone === phone) ?? {
      phone, senderName: name, userName: name, orgName: null,
      lastMessage: "", lastDirection: "outbound", lastAt: new Date(), unread: 0, queue: null, archived: false,
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
            expiredOrgs={expiredOrgs}
            activeSubscribers={activeSubscribers}
            winbackOrgs={winbackOrgs}
            trialOutreachTemplateId={trialOutreachTemplateId}
            trialExpiredOutreachTemplateId={trialExpiredOutreachTemplateId}
            testimonialOutreachTemplateId={testimonialOutreachTemplateId}
            winbackOutreachTemplateId={winbackOutreachTemplateId}
            onStarted={handleConvStarted}
            onClose={() => setShowNew(false)}
          />
        ) : (
          <ConversationList
            conversations={conversations}
            activePhone={activeConv?.phone ?? null}
            onSelect={handleSelectConv}
            onNewConversation={() => setShowNew(true)}
            onArchive={handleArchive}
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
