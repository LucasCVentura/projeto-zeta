"use client"

import { useState, useRef, useEffect } from "react"
import { extendTrialAction, cancelOrgAction, setLifetimeAction, adminChatAction, markInboundEmailReadAction, saveWhatsAppTemplateSettingAction } from "@/actions/admin"
import { AdminChat } from "@/components/admin/admin-chat"
import {
  Send, Loader2, Trophy, TrendingUp, Users, DollarSign, ChevronDown, ChevronUp,
  Sprout, Rocket, Gem, Coins, Star, Activity, MessageSquare, Mail, MailOpen,
  Wallet, CalendarDays, LayoutDashboard, Building2, MessageCircle, Settings,
  Phone, BarChart3, Menu, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import { PushToggle } from "./push-toggle"
import { ContentSchedule } from "./content-schedule"

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Org = {
  id: string; name: string; slug: string
  subscriptionStatus: string; trialEndsAt: Date | null; createdAt: Date
  clients: number; appointments: number; photos: number
  owner: { email: string; name: string } | null
}
type Metrics = {
  totalOrgs: number; activeOrgs: number; trialingOrgs: number
  incompleteBoletoOrgs: number; cancelledOrgs: number
  newOrgsThisMonth: number; newOrgsLastMonth: number; mrr: number; netMrr: number; orgs: Org[]
}
type Service = { name: string; category: string; tier: string; monthlyCost: number | null; notes: string; url: string }
type ChatMessage = { role: "user" | "assistant"; content: string }
type FeedbackItem = { id: string; content: string; createdAt: Date; orgName: string | null; userName: string | null }
type FeedbackSummary = { summary: string; feedbackCount: number; generatedAt: Date } | null
type InboundEmail = { id: string; from: string; subject: string; body: string; read: boolean; receivedAt: Date }
type WhatsAppLog = {
  id: string; messageId: string | null; organizationId: string | null; organizationName: string | null
  destination: string | null; templateId: string | null; eventType: string; error: string | null
  createdAt: Date; updatedAt: Date
}
type WhatsAppTemplateSetting = {
  bookingSummaryTemplateId: string | null; packageSummaryTemplateId: string | null
  reminderConfirmationTemplateId: string | null; postVisitTemplateId: string | null; trialOutreachTemplateId: string | null
}

// ── Constantes ────────────────────────────────────────────────────────────────

const SERVICES: Service[] = [
  { name: "Vercel",   category: "Hosting",    tier: "Hobby (free)",  monthlyCost: 0,    notes: "100 deploys/dia, sem SLA",         url: "" },
  { name: "Supabase", category: "Banco",      tier: "Free",          monthlyCost: 0,    notes: "500 MB DB, 1 GB storage, 50k MAU", url: "" },
  { name: "Resend",   category: "Email",      tier: "Free",          monthlyCost: 0,    notes: "3k emails/mês, 100/dia",           url: "" },
  { name: "Groq",     category: "IA",         tier: "Free",          monthlyCost: 0,    notes: "Rate-limited, só no admin",         url: "" },
  { name: "Stripe",   category: "Pagamentos", tier: "Pay-as-you-go", monthlyCost: null, notes: "3,99% + R$0,39 por cobrança",      url: "" },
]
const GOALS = [
  { label: "Primeiros clientes", target: 10,     icon: Sprout, metric: (m: Metrics) => m.totalOrgs },
  { label: "50 clínicas",        target: 50,     icon: Rocket, metric: (m: Metrics) => m.totalOrgs },
  { label: "100 clínicas",       target: 100,    icon: Gem,    metric: (m: Metrics) => m.totalOrgs },
  { label: "R$1k MRR",           target: 100000, icon: Coins,  metric: (m: Metrics) => m.mrr },
  { label: "R$5k MRR",           target: 500000, icon: Trophy, metric: (m: Metrics) => m.mrr },
  { label: "10 ativas",          target: 10,     icon: Star,   metric: (m: Metrics) => m.activeOrgs },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}
function statusColor(status: string) {
  if (status === "active" || status === "lifetime") return "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
  if (status === "trialing") return "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30"
  if (status === "incomplete") return "text-amber-700 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30"
  return "text-muted-foreground bg-muted"
}
function statusLabel(status: string) {
  if (status === "active") return "Ativa"
  if (status === "lifetime") return "Vitalício"
  if (status === "trialing") return "Trial"
  if (status === "incomplete") return "Boleto"
  if (status === "canceled") return "Cancelada"
  return status
}

// ── Nav items ─────────────────────────────────────────────────────────────────

type NavItem = { id: string; label: string; icon: React.ElementType; badge?: number }

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({
  items, active, onSelect, mrr, activeOrgs, open, onClose,
}: {
  items: NavItem[]; active: string; onSelect: (id: string) => void
  mrr: number; activeOrgs: number; open: boolean; onClose: () => void
}) {
  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-border bg-card transition-transform duration-200 lg:relative lg:translate-x-0 lg:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-border">
          <div>
            <p className="font-heading font-bold text-base tracking-tight">Kira</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Admin</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-muted-foreground hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        {/* MRR pill */}
        <div className="px-4 py-3 border-b border-border">
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs text-green-700 dark:text-green-400 font-medium">MRR</span>
            <span className="text-sm font-bold text-green-700 dark:text-green-400 tabular-nums">{formatBRL(mrr)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5 px-1">
            {activeOrgs} clínica{activeOrgs !== 1 ? "s" : ""} ativa{activeOrgs !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id); onClose() }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-left",
                  active === item.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon size={16} />
                <span className="flex-1">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span className={cn(
                    "flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold px-1",
                    active === item.id ? "bg-primary text-primary-foreground" : "bg-destructive/15 text-destructive"
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border">
          <PushToggle />
        </div>
      </aside>
    </>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function AdminDashboard({
  metrics, feedbacks = [], feedbackSummary,
  inboundEmails: initialInboundEmails = [], whatsappLogs = [], whatsappTemplateSettings,
}: {
  metrics: Metrics; feedbacks?: FeedbackItem[]; feedbackSummary: FeedbackSummary
  inboundEmails?: InboundEmail[]; whatsappLogs?: WhatsAppLog[]; whatsappTemplateSettings: WhatsAppTemplateSetting
}) {
  const [orgs, setOrgs] = useState(metrics.orgs)
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [inboundEmails, setInboundEmails] = useState(initialInboundEmails)
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [bookingTemplateId, setBookingTemplateId] = useState(whatsappTemplateSettings.bookingSummaryTemplateId ?? "")
  const [packageTemplateId, setPackageTemplateId] = useState(whatsappTemplateSettings.packageSummaryTemplateId ?? "")
  const [reminderTemplateId, setReminderTemplateId] = useState(whatsappTemplateSettings.reminderConfirmationTemplateId ?? "")
  const [postVisitTemplateId, setPostVisitTemplateId] = useState(whatsappTemplateSettings.postVisitTemplateId ?? "")
  const [trialOutreachTemplateId, setTrialOutreachTemplateId] = useState(whatsappTemplateSettings.trialOutreachTemplateId ?? "")
  const [pendingCancelOrg, setPendingCancelOrg] = useState<{ id: string; name: string } | null>(null)
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const unreadCount = inboundEmails.filter(e => !e.read).length
  const metricsContext = `Total orgs: ${metrics.totalOrgs}, Ativas: ${metrics.activeOrgs}, Trial: ${metrics.trialingOrgs}, MRR: ${formatBRL(metrics.mrr)}`

  const NAV_ITEMS: NavItem[] = [
    { id: "overview",       label: "Visão Geral",     icon: LayoutDashboard },
    { id: "clinicas",       label: `Clínicas (${orgs.length})`, icon: Building2 },
    { id: "growth",         label: "Growth IA",       icon: TrendingUp },
    { id: "feedback",       label: "Feedback",        icon: MessageSquare, badge: feedbacks.length },
    { id: "financeiro",     label: "Financeiro",      icon: Wallet },
    { id: "whatsapp",       label: `WhatsApp (${whatsappLogs.length})`, icon: Phone },
    { id: "conteudo",       label: "Conteúdo",        icon: CalendarDays },
    { id: "chat",           label: "Chat",            icon: MessageCircle },
    { id: "suporte",        label: "Suporte",         icon: Mail, badge: unreadCount },
    { id: "whatsapp-config",label: "Config WhatsApp", icon: Settings },
  ]

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleExtendTrial(orgId: string, days: number) {
    setActionLoading(orgId)
    await extendTrialAction(orgId, days)
    setOrgs(prev => prev.map(o => {
      if (o.id !== orgId) return o
      const base = o.trialEndsAt && o.trialEndsAt > new Date() ? new Date(o.trialEndsAt) : new Date()
      base.setDate(base.getDate() + days)
      return { ...o, trialEndsAt: base, subscriptionStatus: "trialing" }
    }))
    setActionLoading(null)
  }

  async function handleCancel(orgId: string) {
    setActionLoading(orgId)
    await cancelOrgAction(orgId)
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, subscriptionStatus: "canceled" } : o))
    setActionLoading(null)
    setPendingCancelOrg(null)
  }

  async function handleSetLifetime(orgId: string) {
    setActionLoading(orgId)
    await setLifetimeAction(orgId)
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, subscriptionStatus: "lifetime" } : o))
    setActionLoading(null)
  }

  async function handleExpandEmail(id: string) {
    setExpandedEmail(expandedEmail === id ? null : id)
    const email = inboundEmails.find(e => e.id === id)
    if (email && !email.read) {
      await markInboundEmailReadAction(id)
      setInboundEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e))
    }
  }

  async function handleChat(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || chatLoading) return
    const userMsg: ChatMessage = { role: "user", content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setChatLoading(true)
    const reply = await adminChatAction([...messages, userMsg], metricsContext)
    setMessages(prev => [...prev, { role: "assistant", content: reply }])
    setChatLoading(false)
  }

  async function handleSaveTemplate() {
    setTemplateSaving(true); setTemplateError(null)
    try {
      await saveWhatsAppTemplateSettingAction({
        bookingSummaryTemplateId: bookingTemplateId, packageSummaryTemplateId: packageTemplateId,
        reminderConfirmationTemplateId: reminderTemplateId, postVisitTemplateId, trialOutreachTemplateId,
      })
    } catch { setTemplateError("Não foi possível salvar. Tente novamente.") }
    finally { setTemplateSaving(false) }
  }

  const sectionLabel = NAV_ITEMS.find(i => i.id === activeSection)?.label ?? ""

  // ── Render seção ────────────────────────────────────────────────────────────

  function renderSection() {
    switch (activeSection) {

      case "overview": return (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total",       value: metrics.totalOrgs,          icon: Users,       color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
              { label: "Ativas",      value: metrics.activeOrgs,         icon: TrendingUp,  color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" },
              { label: "Em trial",    value: metrics.trialingOrgs,       icon: Activity,    color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400" },
              { label: "MRR líquido", value: formatBRL(metrics.netMrr),  icon: DollarSign,  color: "bg-primary/10 text-primary" },
            ].map((m) => {
              const Icon = m.icon
              return (
                <div key={m.label} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", m.color)}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="font-heading text-xl font-bold tabular-nums">{m.value}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Novas este mês */}
          {(metrics.newOrgsThisMonth > 0 || metrics.newOrgsLastMonth > 0) && (
            <div className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Sprout size={18} className="text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Novas clínicas este mês</p>
                <p className="text-xs text-muted-foreground">{metrics.newOrgsLastMonth} no mês passado</p>
              </div>
              <p className="font-heading text-3xl font-bold text-primary">{metrics.newOrgsThisMonth}</p>
            </div>
          )}

          {/* Metas */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <Trophy size={13} /> Metas
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {GOALS.map((goal) => {
                const current = goal.metric(metrics)
                const pct = Math.min((current / goal.target) * 100, 100)
                const done = pct >= 100
                const Icon = goal.icon
                return (
                  <div key={goal.label} className={cn(
                    "rounded-xl border p-4 space-y-3",
                    done ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                  )}>
                    <div className="flex items-center justify-between">
                      <span className={cn("flex items-center gap-1.5 text-xs font-medium", done ? "text-primary" : "text-muted-foreground")}>
                        <Icon size={13} />{goal.label}
                      </span>
                      {done && <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">✓</span>}
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-500", done ? "bg-primary" : "bg-primary/40")} style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[11px] text-muted-foreground tabular-nums">
                        {goal.label.includes("MRR") ? formatBRL(current) : current}
                        <span className="opacity-50"> / {goal.label.includes("MRR") ? formatBRL(goal.target) : goal.target}</span>
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )

      case "clinicas": return (
        <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
          {orgs.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">Nenhuma clínica cadastrada.</div>}
          {orgs.map((org) => {
            const initials = org.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
            return (
              <div key={org.id}>
                <button
                  onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{org.name}</span>
                      <span className={cn("shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full", statusColor(org.subscriptionStatus))}>
                        {statusLabel(org.subscriptionStatus)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{org.owner?.email} · {org.clients} clientes</p>
                  </div>
                  {expandedOrg === org.id ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
                </button>
                {expandedOrg === org.id && (
                  <div className="px-5 pb-5 pt-3 bg-muted/20 space-y-3 border-t border-border/50">
                    <div className="grid grid-cols-3 gap-2">
                      {[{ label: "Clientes", value: org.clients }, { label: "Atendimentos", value: org.appointments }, { label: "Fotos", value: org.photos }].map(s => (
                        <div key={s.label} className="rounded-lg bg-background border border-border p-3 text-center">
                          <p className="font-bold text-lg tabular-nums">{s.value}</p>
                          <p className="text-[11px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg bg-background border border-border px-3 py-2.5 text-xs space-y-1 text-muted-foreground">
                      <p><span className="text-foreground font-medium">{org.owner?.name}</span> · {org.owner?.email}</p>
                      <p>Cadastro: <span className="text-foreground">{new Date(org.createdAt).toLocaleDateString("pt-BR")}</span>
                        {org.trialEndsAt && <> · Trial até <span className="text-foreground">{new Date(org.trialEndsAt).toLocaleDateString("pt-BR")}</span></>}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" disabled={actionLoading === org.id} onClick={() => handleExtendTrial(org.id, 7)} className="h-7 text-xs">+7 dias trial</Button>
                      <Button size="sm" variant="outline" disabled={actionLoading === org.id} onClick={() => handleExtendTrial(org.id, 30)} className="h-7 text-xs">+30 dias trial</Button>
                      {org.subscriptionStatus !== "lifetime" && (
                        <Button size="sm" variant="outline" disabled={actionLoading === org.id} onClick={() => handleSetLifetime(org.id)} className="h-7 text-xs text-amber-600 border-amber-300 hover:border-amber-500">♾ Vitalício</Button>
                      )}
                      {org.subscriptionStatus !== "canceled" && org.subscriptionStatus !== "lifetime" && (
                        <Button size="sm" variant="outline" disabled={actionLoading === org.id} onClick={() => setPendingCancelOrg({ id: org.id, name: org.name })} className="h-7 text-xs text-destructive border-destructive/30 hover:border-destructive/60">Cancelar</Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )

      case "growth": return (
        <div className="rounded-xl border border-border overflow-hidden flex flex-col" style={{ height: 600 }}>
          <div className="px-5 py-4 border-b border-border flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10"><TrendingUp size={15} className="text-primary" /></div>
            <div>
              <p className="text-sm font-semibold">Consultor de Growth</p>
              <p className="text-xs text-muted-foreground">Com acesso às métricas atuais do Kira</p>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {messages.length === 0 && (
              <div className="h-full flex items-center justify-center text-center">
                <div className="space-y-3">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                    <TrendingUp size={22} className="text-primary" />
                  </div>
                  <p className="text-sm font-medium">Pergunte sobre crescimento</p>
                  <p className="text-xs text-muted-foreground max-w-xs">Conversão de trials, estratégias de marketing, análise de churn…</p>
                </div>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                  msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
                )}>{msg.content}</div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
                  {[0, 150, 300].map(d => <span key={d} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="border-t border-border p-4">
            <form onSubmit={handleChat} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="Como aumentar conversão de trials..." className="h-9 text-sm" disabled={chatLoading} />
              <Button type="submit" size="sm" disabled={chatLoading || !input.trim()} className="h-9 px-3">
                {chatLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              </Button>
            </form>
          </div>
        </div>
      )

      case "feedback": return (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10"><Activity size={14} className="text-primary" /></div>
                <p className="text-sm font-semibold">Resumo da IA</p>
              </div>
              {feedbackSummary && <span className="text-xs text-muted-foreground">{new Date(feedbackSummary.generatedAt).toLocaleDateString("pt-BR")} · {feedbackSummary.feedbackCount} feedbacks</span>}
            </div>
            {feedbackSummary
              ? <p className="text-sm leading-relaxed whitespace-pre-wrap">{feedbackSummary.summary}</p>
              : <p className="text-sm text-muted-foreground">Nenhum resumo gerado ainda. O cron roda toda segunda-feira às 9h.</p>
            }
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Feedbacks recebidos ({feedbacks.length})</p>
          {feedbacks.length === 0
            ? <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Nenhum feedback recebido ainda.</div>
            : (
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {feedbacks.map(fb => (
                  <div key={fb.id} className="px-5 py-4 space-y-1.5">
                    <p className="text-sm leading-relaxed">{fb.content}</p>
                    <p className="text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/70">{fb.orgName ?? "—"}</span>{" · "}{fb.userName ?? "—"}{" · "}{new Date(fb.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )

      case "financeiro": return (
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20"><DollarSign size={14} className="text-green-600 dark:text-green-400" /></div>
              <p className="text-sm font-semibold">Receita Mensal</p>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-start justify-between text-sm"><span className="text-muted-foreground">MRR bruto ({metrics.activeOrgs} × R$49,90)</span><span className="font-medium tabular-nums">{formatBRL(metrics.mrr)}</span></div>
              <div className="flex items-start justify-between text-sm"><span className="text-muted-foreground">Taxa Stripe (3,99% + R$0,39/cobrança)</span><span className="text-destructive tabular-nums">− {formatBRL(metrics.mrr - metrics.netMrr)}</span></div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">MRR líquido</span>
                <span className="text-xl font-bold text-green-600 dark:text-green-400 tabular-nums">{formatBRL(metrics.netMrr)}</span>
              </div>
            </div>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Serviços terceiros</p>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {SERVICES.map(s => {
              const stripeFee = s.monthlyCost === null ? metrics.mrr - metrics.netMrr : null
              const displayCost = s.monthlyCost !== null ? formatBRL(s.monthlyCost) : formatBRL(stripeFee ?? 0)
              return (
                <div key={s.name} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{s.tier}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.notes}</p>
                  </div>
                  <span className={cn("text-sm font-semibold tabular-nums shrink-0", s.monthlyCost === 0 ? "text-green-600" : s.monthlyCost === null ? "text-destructive" : "text-foreground")}>
                    {s.monthlyCost === 0 ? "Grátis" : s.monthlyCost === null ? `− ${displayCost}` : displayCost}
                  </span>
                </div>
              )
            })}
            <div className="flex items-center justify-between px-5 py-3.5 bg-muted/30">
              <span className="text-sm font-semibold">Total estimado</span>
              <span className="text-sm font-bold tabular-nums">{formatBRL(metrics.mrr - metrics.netMrr)}<span className="text-xs font-normal text-muted-foreground ml-1">/mês</span></span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Stripe é o único custo real — variável com a receita.</p>
        </div>
      )

      case "whatsapp": return (
        <div className="rounded-xl border border-border overflow-hidden">
          {whatsappLogs.length === 0
            ? <div className="py-16 text-center text-sm text-muted-foreground">Nenhum log de WhatsApp ainda.</div>
            : (
              <div className="divide-y divide-border">
                {whatsappLogs.map(log => (
                  <div key={log.id} className="px-5 py-4 space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium truncate">{log.organizationName ?? "—"}</p>
                      <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0",
                        log.eventType === "delivered" || log.eventType === "read" ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20" :
                        log.eventType === "failed" ? "text-destructive bg-destructive/10" : "text-muted-foreground bg-muted"
                      )}>{log.eventType}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Template: {log.templateId ?? "—"} · Destino: {log.destination ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">MsgId: {log.messageId ?? "—"}</p>
                    {log.error && <p className="text-xs text-destructive">Erro: {log.error}</p>}
                    <p className="text-[11px] text-muted-foreground">{new Date(log.updatedAt).toLocaleString("pt-BR")}</p>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )

      case "conteudo": return <ContentSchedule />

      case "whatsapp-config": return (
        <div className="max-w-lg space-y-5">
          <p className="text-sm text-muted-foreground">IDs globais dos templates Gupshup — todas as clínicas usarão estes IDs.</p>
          <div className="rounded-xl border border-border p-5 space-y-4">
            {[
              { label: "Resumo de agendamento", placeholder: "UUID do template", value: bookingTemplateId, onChange: setBookingTemplateId },
              { label: "Resumo de pacote", placeholder: "UUID do template de pacote", value: packageTemplateId, onChange: setPackageTemplateId },
              { label: "Lembrete + confirmação", placeholder: "UUID do template de lembrete", value: reminderTemplateId, onChange: setReminderTemplateId },
              { label: "Pós-consulta", placeholder: "UUID do template pós-consulta", value: postVisitTemplateId, onChange: setPostVisitTemplateId },
            ].map(f => (
              <div key={f.label} className="space-y-1.5">
                <p className="text-sm font-medium">{f.label}</p>
                <Input value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} className="font-mono text-xs" />
              </div>
            ))}
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Abordagem trial <code className="text-xs bg-muted px-1.5 py-0.5 rounded ml-1">kira_trial_outreach</code></p>
              <Input value={trialOutreachTemplateId} onChange={e => setTrialOutreachTemplateId(e.target.value)} placeholder="UUID do template trial outreach" className="font-mono text-xs" />
            </div>
            {templateError && <p className="text-xs text-destructive">{templateError}</p>}
            <Button onClick={handleSaveTemplate} disabled={templateSaving} className="w-full">
              {templateSaving ? "Salvando..." : "Salvar configurações"}
            </Button>
          </div>
        </div>
      )

      case "chat": return <AdminChat trialOutreachTemplateId={whatsappTemplateSettings.trialOutreachTemplateId} />

      case "suporte": return (
        <div className="space-y-4">
          {inboundEmails.length === 0
            ? (
              <div className="rounded-xl border border-border bg-card p-14 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted"><MailOpen size={20} className="text-muted-foreground" /></div>
                <p className="text-sm font-medium">Caixa de entrada vazia</p>
                <p className="text-xs text-muted-foreground">Emails para <span className="font-medium">suporte@kiraclinic.com.br</span> aparecem aqui.</p>
              </div>
            )
            : (
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {inboundEmails.map(email => (
                  <div key={email.id}>
                    <button
                      onClick={() => handleExpandEmail(email.id)}
                      className={cn("w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/30 transition-colors text-left", !email.read && "bg-primary/5")}
                    >
                      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full", email.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
                        {email.read ? <MailOpen size={14} /> : <Mail size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-sm block truncate", !email.read && "font-semibold")}>{email.subject}</span>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{email.from} · {new Date(email.receivedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                      {expandedEmail === email.id ? <ChevronUp size={14} className="text-muted-foreground shrink-0" /> : <ChevronDown size={14} className="text-muted-foreground shrink-0" />}
                    </button>
                    {expandedEmail === email.id && (
                      <div className="px-5 pb-5 pt-3 bg-muted/20 space-y-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">De: <span className="text-foreground">{email.from}</span></p>
                        <div className="rounded-lg bg-background border border-border p-4 text-sm whitespace-pre-wrap leading-relaxed">{email.body || "(sem conteúdo)"}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )

      default: return null
    }
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ConfirmDialog
        open={!!pendingCancelOrg}
        title="Cancelar organização"
        description={pendingCancelOrg ? `Confirmar cancelamento da organização ${pendingCancelOrg.name}?` : ""}
        confirmLabel="Cancelar organização"
        loading={!!pendingCancelOrg && actionLoading === pendingCancelOrg.id}
        onCancel={() => setPendingCancelOrg(null)}
        onConfirm={() => pendingCancelOrg && handleCancel(pendingCancelOrg.id)}
      />

      <Sidebar
        items={NAV_ITEMS}
        active={activeSection}
        onSelect={setActiveSection}
        mrr={metrics.mrr}
        activeOrgs={metrics.activeOrgs}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground">
            <Menu size={20} />
          </button>
          <h1 className="font-heading font-semibold text-lg">{sectionLabel}</h1>
        </header>

        {/* Conteúdo */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderSection()}
        </main>
      </div>
    </div>
  )
}
