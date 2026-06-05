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
import { Send, MessageSquare, Phone, Plus, ChevronLeft, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

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
  trialEndsAt: Date | null
}

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

// ── Painel de nova conversa ───────────────────────────────────────────────────

function NewConversationPanel({
  trialOrgs,
  trialOutreachTemplateId,
  onStarted,
  onClose,
}: {
  trialOrgs: TrialOrg[]
  trialOutreachTemplateId: string | null
  onStarted: (phone: string) => void
  onClose: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [sent, setSent] = useState<Set<string>>(new Set())

  async function handleSendTemplate(org: TrialOrg) {
    if (!org.phone || !trialOutreachTemplateId) return
    setLoading(org.orgId)
    try {
      await sendAdminChatTemplateAction(org.phone, org.ownerName, trialOutreachTemplateId)
      setSent(prev => new Set([...prev, org.orgId]))
      onStarted(org.phone)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={18} />
        </button>
        <p className="font-medium text-sm">Iniciar conversa — Trial</p>
      </div>

      {!trialOutreachTemplateId && (
        <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
          <p className="text-xs text-amber-700">Configure o ID do template <strong>kira_trial_outreach</strong> nas configurações de WhatsApp do admin.</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {trialOrgs.filter(o => o.phone).map((org) => (
          <div key={org.orgId} className="flex items-center justify-between px-4 py-3 gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{org.ownerName}</p>
              <p className="text-xs text-muted-foreground truncate">{org.orgName} · {formatPhone(org.phone!)}</p>
            </div>
            <Button
              size="sm"
              variant={sent.has(org.orgId) ? "outline" : "default"}
              disabled={!!loading || sent.has(org.orgId) || !trialOutreachTemplateId}
              onClick={() => handleSendTemplate(org)}
              className="shrink-0 text-xs h-7 gap-1"
            >
              <Sparkles size={11} />
              {sent.has(org.orgId) ? "Enviado" : loading === org.orgId ? "Enviando..." : "Contatar"}
            </Button>
          </div>
        ))}
        {trialOrgs.filter(o => o.phone).length === 0 && (
          <p className="px-4 py-8 text-sm text-muted-foreground text-center">Nenhum usuário em trial com telefone cadastrado.</p>
        )}
      </div>
    </div>
  )
}

// ── Chat view ─────────────────────────────────────────────────────────────────

function ChatView({
  phone,
  displayName,
  onBack,
}: {
  phone: string
  displayName: string
  onBack: () => void
}) {
  const [messages, setMessages] = useState<AdminChatMessage[]>([])
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getAdminChatMessagesAction(phone).then(setMessages)
  }, [phone])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
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
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border shrink-0">
        <button onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ChevronLeft size={18} />
        </button>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground">{formatPhone(phone)}</p>
        </div>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-8">Nenhuma mensagem ainda.</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn("flex", msg.direction === "outbound" ? "justify-end" : "justify-start")}
          >
            <div className={cn(
              "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
              msg.direction === "outbound"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            )}>
              <p className="whitespace-pre-wrap leading-snug">{msg.content}</p>
              <div className="flex items-center justify-end gap-1 mt-1">
                {msg.templateUsed && (
                  <span className="text-[10px] opacity-60">template</span>
                )}
                <span className="text-[10px] opacity-60">{formatTime(msg.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2 border-t border-border shrink-0">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite uma mensagem..."
          className="flex-1 h-9 text-sm"
          disabled={sending}
        />
        <Button type="submit" size="sm" disabled={!text.trim() || sending} className="h-9 w-9 p-0">
          <Send size={15} />
        </Button>
      </form>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AdminChat({
  trialOutreachTemplateId,
}: {
  trialOutreachTemplateId: string | null
}) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [trialOrgs, setTrialOrgs] = useState<TrialOrg[]>([])
  const [activePhone, setActivePhone] = useState<string | null>(null)
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
  }, [])

  async function refreshConversations() {
    const convs = await getAdminChatConversationsAction()
    setConversations(convs as Conversation[])
  }

  function getDisplayName(conv: Conversation) {
    return conv.userName ?? conv.senderName ?? formatPhone(conv.phone)
  }

  function getDisplayNameByPhone(phone: string) {
    const conv = conversations.find(c => c.phone === phone)
    if (conv?.userName) return conv.userName
    if (conv?.senderName) return conv.senderName
    const org = trialOrgs.find(o => o.phone?.replace(/\D/g, "").replace(/^55/, "") === phone.replace(/\D/g, "").replace(/^55/, ""))
    return org?.ownerName ?? formatPhone(phone)
  }

  function getQueueBadge(queue: string | null) {
    if (!queue) return null
    if (queue === "support") return <span className="rounded-full bg-blue-100 text-blue-700 px-1.5 py-0.5 text-[10px] font-medium">Suporte</span>
    if (queue === "commercial") return <span className="rounded-full bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-medium">Comercial</span>
    return null
  }

  if (activePhone) {
    return (
      <div className="h-150 flex flex-col border border-border rounded-xl overflow-hidden bg-background">
        <ChatView
          phone={activePhone}
          displayName={getDisplayNameByPhone(activePhone)}
          onBack={async () => { setActivePhone(null); await refreshConversations() }}
        />
      </div>
    )
  }

  if (showNew) {
    return (
      <div className="h-150 flex flex-col border border-border rounded-xl overflow-hidden bg-background">
        <NewConversationPanel
          trialOrgs={trialOrgs}
          trialOutreachTemplateId={trialOutreachTemplateId}
          onStarted={(phone) => { setActivePhone(phone); setShowNew(false) }}
          onClose={() => setShowNew(false)}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Conversas</p>
        <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setShowNew(true)}>
          <Plus size={12} />
          Nova conversa
        </Button>
      </div>

      <div className="border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <MessageSquare size={24} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
            <p className="text-xs text-muted-foreground">Use "Nova conversa" para contatar usuários em trial.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <button
                key={conv.phone}
                onClick={() => setActivePhone(conv.phone)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                  {(conv.senderName ?? conv.phone)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-medium truncate">{getDisplayName(conv)}</p>
                      {getQueueBadge(conv.queue)}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{formatTime(conv.lastAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
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
        )}
      </div>
    </div>
  )
}
