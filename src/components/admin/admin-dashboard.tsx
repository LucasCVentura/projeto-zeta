"use client"

import { useState, useRef, useEffect } from "react"
import { extendTrialAction, cancelOrgAction, adminChatAction } from "@/actions/admin"
import { Send, Loader2, Trophy, TrendingUp, Users, DollarSign, ChevronDown, ChevronUp, Sprout, Rocket, Gem, Coins, Star, Activity, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

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
  cancelledOrgs: number
  newOrgsThisMonth: number
  newOrgsLastMonth: number
  mrr: number
  orgs: Org[]
}

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
  return "text-muted-foreground bg-muted"
}

function statusLabel(status: string) {
  if (status === "active") return "Ativa"
  if (status === "trialing") return "Trial"
  if (status === "canceled") return "Cancelada"
  return status
}

export function AdminDashboard({
  metrics,
  feedbacks,
  feedbackSummary,
}: {
  metrics: Metrics
  feedbacks: FeedbackItem[]
  feedbackSummary: FeedbackSummary
}) {
  const [orgs, setOrgs] = useState(metrics.orgs)
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const metricsContext = `
- Total de organizações: ${metrics.totalOrgs}
- Ativas (pagantes): ${metrics.activeOrgs}
- Em trial: ${metrics.trialingOrgs}
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
    if (!confirm("Cancelar essa organização?")) return
    setActionLoading(orgId)
    await cancelOrgAction(orgId)
    setOrgs(prev => prev.map(o => o.id === orgId ? { ...o, subscriptionStatus: "canceled" } : o))
    setActionLoading(null)
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-5 py-10 space-y-8">

        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold">Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral da plataforma Kira</p>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="clinicas">Clínicas ({orgs.length})</TabsTrigger>
            <TabsTrigger value="growth" className="flex items-center gap-1.5"><TrendingUp size={13} />Growth</TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-1.5"><MessageSquare size={13} />Feedback {feedbacks.length > 0 && <span className="ml-0.5 text-[10px] bg-primary/15 text-primary rounded-full px-1.5 py-0.5 font-medium">{feedbacks.length}</span>}</TabsTrigger>
          </TabsList>

          {/* Aba: Visão Geral */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total de clínicas", value: metrics.totalOrgs, icon: <Users size={16} /> },
                { label: "Ativas", value: metrics.activeOrgs, icon: <TrendingUp size={16} /> },
                { label: "Em trial", value: metrics.trialingOrgs, icon: <Users size={16} /> },
                { label: "MRR", value: formatBRL(metrics.mrr), icon: <DollarSign size={16} /> },
              ].map((m) => (
                <div key={m.label} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">{m.icon}{m.label}</div>
                  <p className="font-heading text-2xl font-bold">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-primary" />
                <h2 className="font-semibold text-sm">Metas</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {GOALS.map((goal) => {
                  const current = goal.metric(metrics)
                  const pct = Math.min((current / goal.target) * 100, 100)
                  const done = pct >= 100
                  return (
                    <div key={goal.label} className={cn(
                      "rounded-xl border p-4 space-y-2.5 transition-colors",
                      done ? "border-primary/30 bg-primary/5" : "border-border bg-card"
                    )}>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-medium">
                          <goal.icon size={13} className={done ? "text-primary" : "text-muted-foreground"} />
                          {goal.label}
                        </span>
                        {done && <Activity size={13} className="text-primary" />}
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", done ? "bg-primary" : "bg-primary/50")}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums">
                        {goal.label.includes("MRR") ? formatBRL(current) : current} / {goal.label.includes("MRR") ? formatBRL(goal.target) : goal.target}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </TabsContent>

          {/* Aba: Clínicas */}
          <TabsContent value="clinicas">
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {orgs.map((org) => (
                <div key={org.id}>
                  <button
                    onClick={() => setExpandedOrg(expandedOrg === org.id ? null : org.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{org.name}</span>
                        <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", statusColor(org.subscriptionStatus))}>
                          {statusLabel(org.subscriptionStatus)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {org.owner?.email} · {org.clients} clientes · {org.appointments} atendimentos
                      </p>
                    </div>
                    <div className="text-muted-foreground shrink-0">
                      {expandedOrg === org.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </button>

                  {expandedOrg === org.id && (
                    <div className="px-4 pb-4 pt-1 bg-muted/20 space-y-3">
                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="rounded-lg bg-background border border-border p-2.5 space-y-0.5">
                          <p className="text-muted-foreground">Clientes</p>
                          <p className="font-semibold text-base">{org.clients}</p>
                        </div>
                        <div className="rounded-lg bg-background border border-border p-2.5 space-y-0.5">
                          <p className="text-muted-foreground">Atendimentos</p>
                          <p className="font-semibold text-base">{org.appointments}</p>
                        </div>
                        <div className="rounded-lg bg-background border border-border p-2.5 space-y-0.5">
                          <p className="text-muted-foreground">Fotos</p>
                          <p className="font-semibold text-base">{org.photos}</p>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <p>Owner: <span className="text-foreground">{org.owner?.name} ({org.owner?.email})</span></p>
                        <p>Cadastro: <span className="text-foreground">{new Date(org.createdAt).toLocaleDateString("pt-BR")}</span></p>
                        {org.trialEndsAt && (
                          <p>Trial até: <span className="text-foreground">{new Date(org.trialEndsAt).toLocaleDateString("pt-BR")}</span></p>
                        )}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === org.id}
                          onClick={() => handleExtendTrial(org.id, 7)}
                          className="text-xs h-7"
                        >
                          +7 dias trial
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === org.id}
                          onClick={() => handleExtendTrial(org.id, 30)}
                          className="text-xs h-7"
                        >
                          +30 dias trial
                        </Button>
                        {org.subscriptionStatus !== "canceled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionLoading === org.id}
                            onClick={() => handleCancel(org.id)}
                            className="text-xs h-7 text-destructive hover:text-destructive border-destructive/30 hover:border-destructive/60"
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Aba: Growth */}
          <TabsContent value="growth">
            <div className="rounded-xl border border-border overflow-hidden flex flex-col" style={{ height: 520 }}>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center text-center px-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Olá! Sou seu consultor de growth.</p>
                      <p className="text-xs text-muted-foreground">Tenho acesso às métricas atuais do Kira. Pergunte sobre estratégias de marketing, conversão de trials, ou qualquer coisa sobre crescimento.</p>
                    </div>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn(
                      "max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-xl px-3.5 py-2.5">
                      <Loader2 size={14} className="animate-spin text-muted-foreground" />
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
          <TabsContent value="feedback" className="space-y-6">
            {/* Resumo da IA */}
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-primary" />
                  <h2 className="font-semibold text-sm">Resumo da IA</h2>
                </div>
                {feedbackSummary && (
                  <span className="text-[11px] text-muted-foreground">
                    Gerado em {new Date(feedbackSummary.generatedAt).toLocaleDateString("pt-BR")} · {feedbackSummary.feedbackCount} feedbacks
                  </span>
                )}
              </div>
              {feedbackSummary ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{feedbackSummary.summary}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum resumo gerado ainda. O cron roda toda segunda-feira às 9h.</p>
              )}
            </div>

            {/* Lista de feedbacks brutos */}
            <div className="space-y-2">
              <h2 className="font-semibold text-sm text-muted-foreground">Feedbacks recebidos ({feedbacks.length})</h2>
              {feedbacks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum feedback recebido ainda.</p>
              ) : (
                <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {feedbacks.map((fb) => (
                    <div key={fb.id} className="px-4 py-3 space-y-1">
                      <p className="text-sm">{fb.content}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {fb.orgName ?? "—"} · {fb.userName ?? "—"} · {new Date(fb.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>

      </div>
    </div>
  )
}
