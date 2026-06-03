"use client"

import { useState, useRef, useEffect } from "react"
import { extendTrialAction, cancelOrgAction, setLifetimeAction, adminChatAction, markInboundEmailReadAction, saveWhatsAppTemplateSettingAction } from "@/actions/admin"
import { Send, Loader2, Trophy, TrendingUp, Users, DollarSign, ChevronDown, ChevronUp, Sprout, Rocket, Gem, Coins, Star, Activity, MessageSquare, Mail, MailOpen, Wallet, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { cn } from "@/lib/utils"
import { PushToggle } from "./push-toggle"
import { ContentSchedule } from "./content-schedule"

type Org = {
  id: string
  name: string
  slug: string
  subscriptionStatus: string
  trialEndsAt: Date | null
  createdAt: Date
  clients: number
  appointments: number
  photos: number
  owner: { email: string; name: string } | null
}

type Metrics = {
  totalOrgs: number
  activeOrgs: number
  trialingOrgs: number
  incompleteBoletoOrgs: number
  cancelledOrgs: number
  newOrgsThisMonth: number
  newOrgsLastMonth: number
  mrr: number
  netMrr: number
  orgs: Org[]
}

type Service = {
  name: string
  category: string
  tier: string
  monthlyCost: number | null  // null = variável
  notes: string
  url: string
}

const SERVICES: Service[] = [
  { name: "Vercel",    category: "Hosting",    tier: "Hobby (free)",  monthlyCost: 0,    notes: "100 deploys/dia, sem SLA",          url: "https://vercel.com/pricing" },
  { name: "Supabase",  category: "Banco",      tier: "Free",          monthlyCost: 0,    notes: "500 MB DB, 1 GB storage, 50k MAU",  url: "https://supabase.com/pricing" },
  { name: "Resend",    category: "Email",      tier: "Free",          monthlyCost: 0,    notes: "3k emails/mês, 100/dia",            url: "https://resend.com/pricing" },
  { name: "Groq",      category: "IA",         tier: "Free",          monthlyCost: 0,    notes: "Rate-limited, só no admin",          url: "https://groq.com/pricing" },
  { name: "Stripe",    category: "Pagamentos", tier: "Pay-as-you-go", monthlyCost: null, notes: "3,99% + R$0,39 por cobrança",       url: "https://stripe.com/br/pricing" },
]

type ChatMessage = { role: "user" | "assistant"; content: string }

type FeedbackItem = {
  id: string
  content: string
  createdAt: Date
  orgName: string | null
  userName: string | null
}

type FeedbackSummary = {
  summary: string
  feedbackCount: number
  generatedAt: Date
} | null

type InboundEmail = {
  id: string
  from: string
  subject: string
  body: string
  read: boolean
  receivedAt: Date
}

type WhatsAppLog = {
  id: string
  messageId: string | null
  organizationId: string | null
  organizationName: string | null
  destination: string | null
  templateId: string | null
  eventType: string
  error: string | null
  createdAt: Date
  updatedAt: Date
}

type WhatsAppTemplateSetting = {
  bookingSummaryTemplateId: string | null
  packageSummaryTemplateId: string | null
  reminderConfirmationTemplateId: string | null
  postVisitTemplateId: string | null
}

const GOALS = [
  { label: "Primeiros clientes", target: 10, icon: Sprout, metric: (m: Metrics) => m.totalOrgs },
  { label: "50 clínicas", target: 50, icon: Rocket, metric: (m: Metrics) => m.totalOrgs },
  { label: "100 clínicas", target: 100, icon: Gem, metric: (m: Metrics) => m.totalOrgs },
  { label: "R$1k MRR", target: 100000, icon: Coins, metric: (m: Metrics) => m.mrr },
  { label: "R$5k MRR", target: 500000, icon: Trophy, metric: (m: Metrics) => m.mrr },
  { label: "10 ativas", target: 10, icon: Star, metric: (m: Metrics) => m.activeOrgs },
]

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function statusColor(status: string) {
  if (status === "active") return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20"
  if (status === "trialing") return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
  if (status === "incomplete") return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20"
  return "text-muted-foreground bg-muted"
}

function statusLabel(status: string) {
  if (status === "active") return "Ativa"
  if (status === "trialing") return "Trial"
  if (status === "incomplete") return "Boleto"
  if (status === "canceled") return "Cancelada"
  return status
}

export function AdminDashboard({
  metrics,
  feedbacks = [],
  feedbackSummary,
  inboundEmails: initialInboundEmails = [],
  whatsappLogs = [],
  whatsappTemplateSettings,
}: {
  metrics: Metrics
  feedbacks?: FeedbackItem[]
  feedbackSummary: FeedbackSummary
  inboundEmails?: InboundEmail[]
  whatsappLogs?: WhatsAppLog[]
  whatsappTemplateSettings: WhatsAppTemplateSetting
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
  const [pendingCancelOrg, setPendingCancelOrg] = useState<{ id: string; name: string } | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const metricsContext = `
- Total de organizações: ${metrics.totalOrgs}
- Ativas (pagantes): ${metrics.activeOrgs}
- Em trial (inclui boleto pendente): ${metrics.trialingOrgs} (${metrics.incompleteBoletoOrgs} aguardando boleto)
- Canceladas: ${metrics.cancelledOrgs}
- Novas este mês: ${metrics.newOrgsThisMonth}
- MRR atual: ${formatBRL(metrics.mrr)}
- Top orgs por uso: ${orgs.slice(0, 5).map(o => `${o.name} (${o.clients} clientes, ${o.appointments} atendimentos)`).join("; ")}
`.trim()

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

  const unreadCount = inboundEmails.filter(e => !e.read).length

  async function handleSaveTemplate() {
    setTemplateSaving(true)
    setTemplateError(null)
    try {
      await saveWhatsAppTemplateSettingAction({
        bookingSummaryTemplateId: bookingTemplateId,
        packageSummaryTemplateId: packageTemplateId,
        reminderConfirmationTemplateId: reminderTemplateId,
        postVisitTemplateId,
      })
    } catch {
      setTemplateError("Não foi possível salvar agora. Tente novamente em alguns segundos.")
    } finally {
      setTemplateSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <ConfirmDialog
        open={!!pendingCancelOrg}
        title="Cancelar organização"
        description={pendingCancelOrg ? `Confirmar cancelamento da organização ${pendingCancelOrg.name}?` : ""}
        confirmLabel="Cancelar organização"
        loading={!!pendingCancelOrg && actionLoading === pendingCancelOrg.id}
        onCancel={() => setPendingCancelOrg(null)}
        onConfirm={() => pendingCancelOrg && handleCancel(pendingCancelOrg.id)}
      />
      <div className="max-w-5xl mx-auto px-5 py-6 sm:py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-primary mb-1">Kira Admin</p>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold">Visão Geral</h1>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <div className="text-right">
              <p className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">{formatBRL(metrics.mrr)}</p>
              <p className="text-xs text-muted-foreground">MRR · {metrics.activeOrgs} ativa{metrics.activeOrgs !== 1 ? "s" : ""}</p>
            </div>
            <PushToggle />
          </div>
        </div>

        <Tabs defaultValue="overview">
          <div className="-mx-5 px-5 overflow-x-auto sm:mx-0 sm:px-0">
            <TabsList variant="line" className="mb-6 w-max gap-0">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="clinicas">Clínicas ({orgs.length})</TabsTrigger>
              <TabsTrigger value="growth" className="flex items-center gap-1.5"><TrendingUp size={13} />Growth</TabsTrigger>
              <TabsTrigger value="feedback" className="flex items-center gap-1.5">
                <MessageSquare size={13} />Feedback
                {feedbacks.length > 0 && <span className="ml-0.5 text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-medium">{feedbacks.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="flex items-center gap-1.5"><Wallet size={13} />Financeiro</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp ({whatsappLogs.length})</TabsTrigger>
              <TabsTrigger value="conteudo" className="flex items-center gap-1.5"><CalendarDays size={13} />Conteúdo</TabsTrigger>
              <TabsTrigger value="whatsapp-config">Config WhatsApp</TabsTrigger>
              <TabsTrigger value="suporte" className="flex items-center gap-1.5">
                <Mail size={13} />Suporte
                {unreadCount > 0 && (
                  <span className="ml-0.5 text-[10px] bg-destructive/15 text-destructive rounded-full px-1.5 py-0.5 font-medium">{unreadCount}</span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Aba: Visão Geral */}
          <TabsContent value="overview" className="space-y-8">
            {/* Métricas principais */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total", value: metrics.totalOrgs, icon: <Users size={18} />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" },
                { label: "Ativas", value: metrics.activeOrgs, icon: <TrendingUp size={18} />, color: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" },
                {
                  label: "Em trial",
                  value: metrics.trialingOrgs,
                  sub: metrics.incompleteBoletoOrgs > 0 ? `${metrics.incompleteBoletoOrgs} boleto pendente` : null,
                  icon: <Activity size={18} />,
                  color: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
                },
                { label: "MRR líquido", value: formatBRL(metrics.netMrr), icon: <DollarSign size={18} />, color: "bg-primary/10 text-primary" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", m.color)}>
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="font-heading text-xl font-bold tabular-nums">{m.value}</p>
                    {"sub" in m && m.sub && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{m.sub}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Crescimento do mês */}
            {(metrics.newOrgsThisMonth > 0 || metrics.newOrgsLastMonth > 0) && (
              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Sprout size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Novas clínicas este mês</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.newOrgsLastMonth} no mês passado
                  </p>
                </div>
                <p className="font-heading text-2xl font-bold text-primary shrink-0">{metrics.newOrgsThisMonth}</p>
              </div>
            )}

            {/* Metas */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <Trophy size={13} /> Metas
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GOALS.map((goal) => {
                  const current = goal.metric(metrics)
                  const pct = Math.min((current / goal.target) * 100, 100)
                  const done = pct >= 100
                  return (
                    <div key={goal.label} className={cn(
                      "rounded-xl border p-4 space-y-3 transition-colors",
                      done ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className={cn("flex items-center gap-1.5 text-xs font-medium", done ? "text-primary" : "text-muted-foreground")}>
                          <goal.icon size={13} />
                          {goal.label}
                        </span>
                        {done && <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">✓</span>}
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-500", done ? "bg-primary" : "bg-primary/40")}
                            style={{ width: `${pct}%` }}
                          />
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
          </TabsContent>

          <TabsContent value="whatsapp">
            <div className="rounded-xl border border-border overflow-hidden">
              {whatsappLogs.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">Nenhum log de WhatsApp ainda.</div>
              ) : (
                <div className="divide-y divide-border">
                  {whatsappLogs.map((log) => (
                    <div key={log.id} className="px-4 py-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium truncate">{log.organizationName ?? "—"}</p>
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0",
                          log.eventType === "delivered" || log.eventType === "read" ? "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/20" :
                            log.eventType === "failed" ? "text-destructive bg-destructive/10" :
                              "text-muted-foreground bg-muted"
                        )}>
                          {log.eventType}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Template: {log.templateId ?? "—"} · Destino: {log.destination ?? "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        MsgId: {log.messageId ?? "—"}
                      </p>
                      {log.error && <p className="text-xs text-destructive">Erro: {log.error}</p>}
                      <p className="text-[11px] text-muted-foreground">
                        Atualizado em {new Date(log.updatedAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="conteudo">
            <ContentSchedule />
          </TabsContent>

          <TabsContent value="whatsapp-config">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Configure o ID global do template de resumo de agendamento (todas as clínicas usarão este ID).
              </p>
              <div className="rounded-xl border border-border p-4 space-y-2">
                <p className="text-sm font-medium">Template resumo de agendamento (global)</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    value={bookingTemplateId}
                    onChange={(e) => setBookingTemplateId(e.target.value)}
                    placeholder="Ex.: c6aecef6-bcb0-4fb1-8100-28c094e3bc6b"
                  />
                  <Button
                    onClick={() => handleSaveTemplate()}
                    disabled={templateSaving}
                  >
                    {templateSaving ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
                <p className="text-sm font-medium pt-2">Template resumo de pacote (global)</p>
                <Input
                  value={packageTemplateId}
                  onChange={(e) => setPackageTemplateId(e.target.value)}
                  placeholder="UUID do template de resumo de pacote"
                />
                <p className="text-sm font-medium pt-2">Template lembrete + confirmação (global)</p>
                <Input
                  value={reminderTemplateId}
                  onChange={(e) => setReminderTemplateId(e.target.value)}
                  placeholder="UUID do template de lembrete/confirmacao"
                />
                <p className="text-sm font-medium pt-2">Template pós-consulta (global)</p>
                <Input
                  value={postVisitTemplateId}
                  onChange={(e) => setPostVisitTemplateId(e.target.value)}
                  placeholder="UUID do template pós-consulta"
                />
                {templateError && (
                  <p className="text-xs text-destructive pt-1">{templateError}</p>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Aba: Clínicas */}
          <TabsContent value="clinicas">
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {orgs.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">Nenhuma clínica cadastrada.</div>
              )}
              {orgs.map((org) => {
                const initials = org.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
                return (
                  <div key={org.id}>
                    <button
                      onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{org.name}</span>
                          <span className={cn("shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-full", statusColor(org.subscriptionStatus))}>
                            {statusLabel(org.subscriptionStatus)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {org.owner?.email} · {org.clients} clientes
                        </p>
                      </div>
                      <div className="text-muted-foreground shrink-0">
                        {expandedOrg === org.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    {expandedOrg === org.id && (
                      <div className="px-4 pb-4 pt-2 bg-muted/20 space-y-3 border-t border-border/50">
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Clientes", value: org.clients },
                            { label: "Atendimentos", value: org.appointments },
                            { label: "Fotos", value: org.photos },
                          ].map(stat => (
                            <div key={stat.label} className="rounded-lg bg-background border border-border p-3 text-center space-y-0.5">
                              <p className="font-bold text-lg tabular-nums">{stat.value}</p>
                              <p className="text-[11px] text-muted-foreground">{stat.label}</p>
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
                          <Button size="sm" variant="outline" disabled={actionLoading === org.id}
                            onClick={() => handleExtendTrial(org.id, 7)} className="text-xs h-7">
                            +7 dias trial
                          </Button>
                          <Button size="sm" variant="outline" disabled={actionLoading === org.id}
                            onClick={() => handleExtendTrial(org.id, 30)} className="text-xs h-7">
                            +30 dias trial
                          </Button>
                          {org.subscriptionStatus !== "lifetime" && (
                            <Button size="sm" variant="outline" disabled={actionLoading === org.id}
                              onClick={() => handleSetLifetime(org.id)}
                              className="text-xs h-7 text-amber-600 hover:text-amber-700 border-amber-300 hover:border-amber-500">
                              ♾ Vitalício
                            </Button>
                          )}
                          {org.subscriptionStatus !== "canceled" && org.subscriptionStatus !== "lifetime" && (
                            <Button size="sm" variant="outline" disabled={actionLoading === org.id}
                              onClick={() => setPendingCancelOrg({ id: org.id, name: org.name })}
                              className="text-xs h-7 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60">
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </TabsContent>

          {/* Aba: Growth */}
          <TabsContent value="growth">
            <div className="rounded-xl border border-border overflow-hidden flex flex-col" style={{ height: 520 }}>
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp size={14} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">Consultor de Growth</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Com acesso às métricas atuais do Kira</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-center px-6">
                    <div className="space-y-3">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <TrendingUp size={20} className="text-primary" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Pergunte sobre crescimento</p>
                        <p className="text-xs text-muted-foreground">Conversão de trials, estratégias de marketing, análise de churn…</p>
                      </div>
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted text-foreground rounded-bl-sm"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="border-t border-border p-3">
                <form onSubmit={handleChat} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Como aumentar conversão de trials..."
                    className="h-9 text-sm"
                    disabled={chatLoading}
                  />
                  <Button type="submit" size="sm" disabled={chatLoading || !input.trim()} className="h-9 px-3">
                    <Send size={14} />
                  </Button>
                </form>
              </div>
            </div>
          </TabsContent>

          {/* Aba: Feedback */}
          <TabsContent value="feedback" className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                    <Activity size={14} className="text-primary" />
                  </div>
                  <p className="text-sm font-medium">Resumo da IA</p>
                </div>
                {feedbackSummary && (
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {new Date(feedbackSummary.generatedAt).toLocaleDateString("pt-BR")} · {feedbackSummary.feedbackCount} feedbacks
                  </span>
                )}
              </div>
              {feedbackSummary ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{feedbackSummary.summary}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum resumo gerado ainda. O cron roda toda segunda-feira às 9h.</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Feedbacks recebidos ({feedbacks.length})
              </p>
              {feedbacks.length === 0 ? (
                <div className="rounded-xl border border-border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground">Nenhum feedback recebido ainda.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {feedbacks.map((fb) => (
                    <div key={fb.id} className="px-4 py-3.5 space-y-1.5">
                      <p className="text-sm leading-relaxed">{fb.content}</p>
                      <p className="text-[11px] text-muted-foreground">
                        <span className="font-medium text-foreground/70">{fb.orgName ?? "—"}</span>
                        {" · "}{fb.userName ?? "—"}
                        {" · "}{new Date(fb.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Aba: Financeiro */}
          <TabsContent value="financeiro" className="space-y-5">
            <div className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 dark:bg-green-900/20">
                  <DollarSign size={14} className="text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium">Receita Mensal</p>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">MRR bruto ({metrics.activeOrgs} × R$49,90)</span>
                  <span className="font-medium tabular-nums shrink-0">{formatBRL(metrics.mrr)}</span>
                </div>
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-muted-foreground">Taxa Stripe (3,99% + R$0,39/cobrança)</span>
                  <span className="text-destructive tabular-nums shrink-0">− {formatBRL(metrics.mrr - metrics.netMrr)}</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">MRR líquido</span>
                  <span className="text-lg font-bold text-green-600 dark:text-green-400 tabular-nums">{formatBRL(metrics.netMrr)}</span>
                </div>
              </div>
              {metrics.activeOrgs === 0 && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">Nenhuma org ativa ainda — os valores aparecerão quando houver assinantes.</p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Serviços terceiros</p>
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {SERVICES.map((s) => {
                  const stripeFee = s.monthlyCost === null ? metrics.mrr - metrics.netMrr : null
                  const displayCost = s.monthlyCost !== null ? formatBRL(s.monthlyCost) : formatBRL(stripeFee ?? 0)
                  return (
                    <div key={s.name} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{s.name}</span>
                          <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">{s.tier}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{s.notes}</p>
                      </div>
                      <span className={cn(
                        "text-sm font-semibold tabular-nums shrink-0",
                        s.monthlyCost === 0 ? "text-green-600 dark:text-green-400" :
                        s.monthlyCost === null ? "text-destructive" : "text-foreground"
                      )}>
                        {s.monthlyCost === 0 ? "Grátis" : s.monthlyCost === null ? `− ${displayCost}` : displayCost}
                      </span>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                  <span className="text-sm font-semibold">Total estimado</span>
                  <span className="text-sm font-bold tabular-nums">
                    {formatBRL(metrics.mrr - metrics.netMrr)}
                    <span className="text-xs font-normal text-muted-foreground ml-1">/mês</span>
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Stripe é o único custo real — variável com a receita.</p>
            </div>
          </TabsContent>

          {/* Aba: Suporte */}
          <TabsContent value="suporte" className="space-y-3">
            {inboundEmails.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <MailOpen size={20} className="text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Caixa de entrada vazia</p>
                  <p className="text-xs text-muted-foreground">Emails para <span className="font-medium">suporte@kiraclinic.com.br</span> aparecem aqui.</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {inboundEmails.map((email) => (
                  <div key={email.id}>
                    <button
                      onClick={() => handleExpandEmail(email.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors text-left",
                        !email.read && "bg-primary/5"
                      )}
                    >
                      <div className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        email.read ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                      )}>
                        {email.read ? <MailOpen size={14} /> : <Mail size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={cn("text-sm block truncate", !email.read && "font-semibold")}>{email.subject}</span>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {email.from} · {new Date(email.receivedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="text-muted-foreground shrink-0">
                        {expandedEmail === email.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>

                    {expandedEmail === email.id && (
                      <div className="px-4 pb-4 pt-2 bg-muted/20 space-y-2 border-t border-border/50">
                        <p className="text-xs text-muted-foreground">De: <span className="text-foreground">{email.from}</span></p>
                        <div className="rounded-lg bg-background border border-border p-3 text-sm whitespace-pre-wrap leading-relaxed">
                          {email.body || "(sem conteúdo)"}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

        </Tabs>

      </div>
    </div>
  )
}
