"use client"

import { useState, useEffect, useCallback } from "react"
import { extendTrialAction, cancelOrgAction, setLifetimeAction, markInboundEmailReadAction, saveWhatsAppTemplateSettingAction, getInboundEmailsAction, getWhatsAppMessageLogsAction, getAdminMetricsAction, getWhatsAppTemplateSettingsAction, getClinicDetailAction } from "@/actions/admin"
import type { WhatsAppLogsParams, ClinicDetail } from "@/actions/admin"
import { getAllFeedbackAction, getLatestFeedbackSummaryAction } from "@/actions/feedback"
import { AdminChat } from "@/components/admin/admin-chat"
import {
  Trophy, TrendingUp, Users, DollarSign, ChevronDown, ChevronUp,
  Sprout, Rocket, Gem, Coins, Star, Activity, MessageSquare, Mail, MailOpen,
  Wallet, CalendarDays, LayoutDashboard, Building2, MessageCircle, Settings,
  Phone, BarChart3, Menu, X, ArrowLeft, Image as ImageIcon, Stethoscope,
  Package, Send, Clock, AlertTriangle, ClipboardList, UserCircle, AtSign, MapPin,
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
  revenue: number; team: number; lastActivityAt: string | null
}
type Metrics = {
  totalOrgs: number; activeOrgs: number; trialingOrgs: number
  incompleteBoletoOrgs: number; cancelledOrgs: number
  newOrgsThisMonth: number; newOrgsLastMonth: number; mrr: number; netMrr: number; orgs: Org[]
}
type Service = { name: string; category: string; tier: string; monthlyCost: number | null; notes: string; url: string }
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
  reminderConfirmationTemplateId: string | null; postVisitTemplateId: string | null
  trialOutreachTemplateId: string | null; trialExpiredOutreachTemplateId: string | null
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

// ── Painel de detalhe da clínica ───────────────────────────────────────────────

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix", cartao_credito: "Crédito", cartao_debito: "Débito",
  dinheiro: "Dinheiro", parcelado: "Parcelado",
}
const APPT_STATUS_LABELS: Record<string, string> = {
  waiting: "Aguardando", confirmed: "Confirmados", completed: "Concluídos",
  missed: "Faltas", cancelled: "Cancelados",
}

function StatusBadgeLabel({ status }: { status: string }) {
  return <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", statusColor(status))}>{statusLabel(status)}</span>
}

function ClinicDetailPanel({
  detail, loading, actionLoading, onBack, onExtendTrial, onSetLifetime, onCancel,
}: {
  detail: ClinicDetail | null
  loading: boolean
  actionLoading: string | null
  onBack: () => void
  onExtendTrial: (id: string, days: number) => void
  onSetLifetime: (id: string) => void
  onCancel: (id: string, name: string) => void
}) {
  if (loading || !detail) {
    return (
      <div className="space-y-4">
        <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Voltar
        </button>
        <div className="py-24 text-center text-sm text-muted-foreground">Carregando detalhes...</div>
      </div>
    )
  }

  const { org, owner, team, clients, appointments, photos, anamnesisFilled, procedures, packages, financial, whatsapp } = detail
  const initials = org.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
  const now = new Date()
  const trialEnd = org.trialEndsAt ? new Date(org.trialEndsAt) : null
  const busy = actionLoading === org.id

  const kpis = [
    { label: "Clientes", value: clients.total, icon: Users },
    { label: "Atendimentos", value: appointments.total, icon: CalendarDays },
    { label: "Fotos", value: photos, icon: ImageIcon },
    { label: "Receita", value: formatBRL(financial.totalRevenue), icon: DollarSign },
    { label: "Equipe", value: team.total, icon: UserCircle },
    { label: "Procedimentos", value: procedures, icon: Stethoscope },
    { label: "Pacotes", value: packages, icon: Package },
    { label: "Anamneses", value: anamnesisFilled, icon: ClipboardList },
  ]

  const maxStatus = Math.max(1, ...Object.values(appointments.byStatus))

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Voltar para clínicas
      </button>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">{initials}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-heading text-xl font-semibold">{org.name}</h2>
              <StatusBadgeLabel status={org.subscriptionStatus} />
            </div>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {owner && <p className="flex items-center gap-1.5 text-muted-foreground"><UserCircle size={13} /> {owner.name} · <span className="truncate">{owner.email}</span></p>}
              {org.phone && <p className="flex items-center gap-1.5 text-muted-foreground"><Phone size={13} /> {org.phone}</p>}
              {org.instagram && <p className="flex items-center gap-1.5 text-muted-foreground"><AtSign size={13} /> {org.instagram}</p>}
              {org.address && <p className="flex items-center gap-1.5 text-muted-foreground truncate"><MapPin size={13} /> {org.address}</p>}
              <p className="flex items-center gap-1.5 text-muted-foreground"><CalendarDays size={13} /> Cadastro: {new Date(org.createdAt).toLocaleDateString("pt-BR")}</p>
              {trialEnd && <p className="flex items-center gap-1.5 text-muted-foreground"><Clock size={13} /> Trial até {trialEnd.toLocaleDateString("pt-BR")}</p>}
            </div>
          </div>
        </div>
        {/* Ações admin */}
        <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-1.5">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onExtendTrial(org.id, 7)} className="h-7 text-xs px-2.5">+7 dias</Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => onExtendTrial(org.id, 30)} className="h-7 text-xs px-2.5">+30 dias</Button>
          {org.subscriptionStatus !== "lifetime" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onSetLifetime(org.id)} className="h-7 text-xs px-2.5 text-amber-600 border-amber-300 hover:border-amber-500">Vitalício ♾</Button>
          )}
          {org.subscriptionStatus !== "canceled" && org.subscriptionStatus !== "lifetime" && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onCancel(org.id, org.name)} className="h-7 text-xs px-2.5 text-destructive border-destructive/30 hover:border-destructive/60">Cancelar ✕</Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(k => {
          const Icon = k.icon
          return (
            <div key={k.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Icon size={14} /><span className="text-[11px]">{k.label}</span>
              </div>
              <p className="font-heading text-lg font-bold tabular-nums">{k.value}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Atendimentos por status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold mb-3">Atendimentos por status</p>
          <div className="space-y-2">
            {Object.keys(APPT_STATUS_LABELS).map(st => {
              const v = appointments.byStatus[st] ?? 0
              return (
                <div key={st} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-24 shrink-0">{APPT_STATUS_LABELS[st]}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(v / maxStatus) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium tabular-nums w-8 text-right">{v}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-center">
            <div><p className="text-base font-bold tabular-nums text-green-600">{appointments.completionRate}%</p><p className="text-[10px] text-muted-foreground">Conclusão</p></div>
            <div><p className="text-base font-bold tabular-nums text-destructive">{appointments.missRate}%</p><p className="text-[10px] text-muted-foreground">Faltas</p></div>
            <div><p className="text-base font-bold tabular-nums">{appointments.upcoming}</p><p className="text-[10px] text-muted-foreground">Próximos</p></div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold mb-3">Financeiro</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Receita total</span><span className="font-semibold tabular-nums">{formatBRL(financial.totalRevenue)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Receita do mês</span><span className="font-medium tabular-nums">{formatBRL(financial.monthRevenue)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Ticket médio</span><span className="font-medium tabular-nums">{formatBRL(financial.avgTicket)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Comissões</span><span className="font-medium tabular-nums">{formatBRL(financial.commissions)}</span></div>
          </div>
          {financial.byPaymentMethod.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Por forma de pagamento</p>
              {financial.byPaymentMethod.map(p => (
                <div key={p.method ?? "none"} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{p.method ? (PAYMENT_LABELS[p.method] ?? p.method) : "Não informado"} ({p.count})</span>
                  <span className="tabular-nums">{formatBRL(p.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Atividade recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Últimos atendimentos */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Últimos atendimentos</p>
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Send size={11} /> {whatsapp.sent} msgs{whatsapp.errors > 0 && <span className="text-destructive"> · {whatsapp.errors} erros</span>}</span>
          </div>
          {appointments.recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum atendimento ainda.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {appointments.recent.map((a, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5">
                  <span className="text-sm flex-1 truncate">{a.clientName}</span>
                  {a.procedure && <span className="text-[11px] text-muted-foreground truncate max-w-[40%]">{a.procedure}</span>}
                  <span className="text-[11px] text-muted-foreground tabular-nums">{new Date(a.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clientes recentes */}
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-sm font-semibold mb-3">Clientes recentes</p>
          {clients.recent.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum cliente cadastrado.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {clients.recent.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-sm truncate">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{new Date(c.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
              ))}
            </div>
          )}
          {team.members.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Equipe ({team.total})</p>
              <div className="flex flex-wrap gap-1.5">
                {team.members.map((m, i) => (
                  <span key={i} className={cn("text-[11px] px-2 py-0.5 rounded-full", m.active ? "bg-muted" : "bg-muted/40 text-muted-foreground line-through")}>
                    {m.name} · {m.role}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

const EMPTY_METRICS: Metrics = {
  totalOrgs: 0, activeOrgs: 0, trialingOrgs: 0, incompleteBoletoOrgs: 0,
  cancelledOrgs: 0, newOrgsThisMonth: 0, newOrgsLastMonth: 0, mrr: 0, netMrr: 0, orgs: [],
}

export function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>(EMPTY_METRICS)
  const [metricsLoading, setMetricsLoading] = useState(true)
  const [orgs, setOrgs] = useState<Org[]>([])
  const [selectedClinic, setSelectedClinic] = useState<string | null>(null)
  const [clinicDetail, setClinicDetail] = useState<ClinicDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [clinicSearch, setClinicSearch] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [inboundEmails, setInboundEmails] = useState<InboundEmail[]>([])
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null)
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([])
  const [feedbackSummary, setFeedbackSummary] = useState<FeedbackSummary>(null)
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>([])
  const [whatsappTotal, setWhatsappTotal] = useState(0)
  const [whatsappPage, setWhatsappPage] = useState(1)
  const [whatsappPeriod, setWhatsappPeriod] = useState<WhatsAppLogsParams["period"]>("7d")
  const [whatsappLoading, setWhatsappLoading] = useState(false)
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set())
  const [templateSaving, setTemplateSaving] = useState(false)
  const [templateError, setTemplateError] = useState<string | null>(null)
  const [bookingTemplateId, setBookingTemplateId] = useState("")
  const [packageTemplateId, setPackageTemplateId] = useState("")
  const [reminderTemplateId, setReminderTemplateId] = useState("")
  const [postVisitTemplateId, setPostVisitTemplateId] = useState("")
  const [trialOutreachTemplateId, setTrialOutreachTemplateId] = useState("")
  const [trialExpiredOutreachTemplateId, setTrialExpiredOutreachTemplateId] = useState("")
  const [pendingCancelOrg, setPendingCancelOrg] = useState<{ id: string; name: string } | null>(null)
  const [activeSection, setActiveSection] = useState("overview")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logFilterOrg, setLogFilterOrg] = useState("")
  const [logFilterEvent, setLogFilterEvent] = useState("")
  const [logFilterError, setLogFilterError] = useState(false)
  const unreadCount = inboundEmails.filter(e => !e.read).length

  // Busca tudo no client — página abre instantaneamente
  useEffect(() => {
    getAdminMetricsAction()
      .then(m => {
        setMetrics(m)
        setOrgs(m.orgs)
        setMetricsLoading(false)
      }).catch((err) => {
        console.error("[Admin] Falha ao carregar métricas:", err)
        setMetricsLoading(false)
      })

    getWhatsAppTemplateSettingsAction().then(t => {
      setBookingTemplateId(t.bookingSummaryTemplateId ?? "")
      setPackageTemplateId(t.packageSummaryTemplateId ?? "")
      setReminderTemplateId(t.reminderConfirmationTemplateId ?? "")
      setPostVisitTemplateId(t.postVisitTemplateId ?? "")
      setTrialOutreachTemplateId(t.trialOutreachTemplateId ?? "")
      setTrialExpiredOutreachTemplateId(t.trialExpiredOutreachTemplateId ?? "")
    }).catch(() => {})
  }, [])

  const fetchLogs = useCallback(async (params: WhatsAppLogsParams) => {
    setWhatsappLoading(true)
    try {
      const result = await getWhatsAppMessageLogsAction(params)
      setWhatsappLogs(result.logs as WhatsAppLog[])
      setWhatsappTotal(result.total)
    } catch { /* ignore */ }
    finally { setWhatsappLoading(false) }
  }, [])

  const loadTab = useCallback(async (section: string) => {
    if (loadedTabs.has(section)) return
    setLoadedTabs(prev => new Set([...prev, section]))

    if (section === "feedback") {
      const [fb, summary] = await Promise.all([getAllFeedbackAction(), getLatestFeedbackSummaryAction()])
      setFeedbacks(fb ?? [])
      setFeedbackSummary(summary)
    }
    if (section === "whatsapp") {
      await fetchLogs({ page: 1, period: "7d" })
    }
    if (section === "suporte") {
      const emails = await getInboundEmailsAction().catch(() => [])
      setInboundEmails(emails as InboundEmail[])
    }
  }, [loadedTabs, fetchLogs])

  useEffect(() => {
    loadTab(activeSection)
  }, [activeSection, loadTab])

  const NAV_ITEMS: NavItem[] = [
    { id: "overview",       label: "Visão Geral",     icon: LayoutDashboard },
    { id: "clinicas",       label: `Clínicas (${orgs.length})`, icon: Building2 },
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

  async function openClinic(orgId: string) {
    setSelectedClinic(orgId)
    setClinicDetail(null)
    setLoadingDetail(true)
    try {
      const detail = await getClinicDetailAction(orgId)
      setClinicDetail(detail)
    } catch (err) {
      console.error("[Admin] Falha ao carregar detalhe da clínica:", err)
    } finally {
      setLoadingDetail(false)
    }
  }

  function closeClinic() {
    setSelectedClinic(null)
    setClinicDetail(null)
  }

  async function handleExpandEmail(id: string) {
    setExpandedEmail(expandedEmail === id ? null : id)
    const email = inboundEmails.find(e => e.id === id)
    if (email && !email.read) {
      await markInboundEmailReadAction(id)
      setInboundEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e))
    }
  }


  async function handleSaveTemplate() {
    setTemplateSaving(true); setTemplateError(null)
    try {
      await saveWhatsAppTemplateSettingAction({
        bookingSummaryTemplateId: bookingTemplateId, packageSummaryTemplateId: packageTemplateId,
        reminderConfirmationTemplateId: reminderTemplateId, postVisitTemplateId,
        trialOutreachTemplateId, trialExpiredOutreachTemplateId,
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
                    {metricsLoading
                      ? <div className="h-7 w-12 rounded bg-muted animate-pulse mt-0.5" />
                      : <p className="font-heading text-xl font-bold tabular-nums">{m.value}</p>
                    }
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

      case "clinicas": {
        // ── Detalhe inline de uma clínica ──
        if (selectedClinic) {
          return (
            <ClinicDetailPanel
              detail={clinicDetail}
              loading={loadingDetail}
              actionLoading={actionLoading}
              onBack={closeClinic}
              onExtendTrial={handleExtendTrial}
              onSetLifetime={handleSetLifetime}
              onCancel={(id, name) => setPendingCancelOrg({ id, name })}
            />
          )
        }

        // ── Dashboard geral + grade ──
        const now = new Date()
        const agg = orgs.reduce((acc, o) => {
          acc.clients += o.clients; acc.appointments += o.appointments
          acc.photos += o.photos; acc.revenue += o.revenue
          return acc
        }, { clients: 0, appointments: 0, photos: 0, revenue: 0 })

        const statusDist = orgs.reduce<Record<string, number>>((acc, o) => {
          const trialEnd = o.trialEndsAt ? new Date(o.trialEndsAt) : null
          const expired = o.subscriptionStatus === "trialing" && trialEnd !== null && trialEnd < now
          const key = expired ? "expired" : o.subscriptionStatus
          acc[key] = (acc[key] ?? 0) + 1
          return acc
        }, {})

        const ranking = [...orgs].sort((a, b) => b.appointments - a.appointments).slice(0, 5)

        const trialEndingSoon = orgs.filter(o => {
          if (o.subscriptionStatus !== "trialing" || !o.trialEndsAt) return false
          const days = Math.ceil((new Date(o.trialEndsAt).getTime() - now.getTime()) / 86400000)
          return days >= 0 && days <= 3
        })
        const inactive = orgs.filter(o => {
          if (o.subscriptionStatus === "canceled") return false
          if (!o.lastActivityAt) return true
          const days = Math.floor((now.getTime() - new Date(o.lastActivityAt + "T12:00:00").getTime()) / 86400000)
          return days > 30
        })

        const search = clinicSearch.trim().toLowerCase()
        const filteredOrgs = search
          ? orgs.filter(o => o.name.toLowerCase().includes(search) || o.owner?.name?.toLowerCase().includes(search) || o.owner?.email?.toLowerCase().includes(search))
          : orgs

        const STATUS_PILLS: { key: string; label: string }[] = [
          { key: "active", label: "Ativas" }, { key: "trialing", label: "Em trial" },
          { key: "expired", label: "Trial expirado" }, { key: "incomplete", label: "Boleto" },
          { key: "lifetime", label: "Vitalício" }, { key: "canceled", label: "Canceladas" },
        ]

        return (
          <div className="space-y-6">
            {orgs.length === 0 && (
              <div className="py-16 text-center text-sm text-muted-foreground">Nenhuma clínica cadastrada.</div>
            )}

            {orgs.length > 0 && (
              <>
                {/* KPIs agregados */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Clientes (todas)",   value: agg.clients,            icon: Users },
                    { label: "Atendimentos",        value: agg.appointments,       icon: CalendarDays },
                    { label: "Fotos",               value: agg.photos,             icon: ImageIcon },
                    { label: "Receita registrada",  value: formatBRL(agg.revenue), icon: DollarSign },
                  ].map(m => {
                    const Icon = m.icon
                    return (
                      <div key={m.label} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={18} /></div>
                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">{m.label}</p>
                          <p className="font-heading text-xl font-bold tabular-nums">{m.value}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Distribuição por status */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-sm font-semibold mb-3">Distribuição por status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_PILLS.filter(s => (statusDist[s.key] ?? 0) > 0).map(s => (
                      <div key={s.key} className={cn("flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium", s.key === "expired" ? "text-destructive bg-destructive/10" : statusColor(s.key))}>
                        {s.label}<span className="font-bold tabular-nums">{statusDist[s.key]}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Ranking mais ativas */}
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy size={15} className="text-amber-500" />
                      <p className="text-sm font-semibold">Clínicas mais ativas</p>
                    </div>
                    <div className="space-y-1">
                      {ranking.map((o, i) => (
                        <button key={o.id} onClick={() => openClinic(o.id)} className="w-full flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors text-left">
                          <span className="text-xs font-bold text-muted-foreground w-4 tabular-nums">{i + 1}</span>
                          <span className="text-sm flex-1 truncate">{o.name}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">{o.appointments} atend.</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clínicas em risco */}
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle size={15} className="text-destructive" />
                      <p className="text-sm font-semibold">Clínicas em risco</p>
                    </div>
                    {trialEndingSoon.length === 0 && inactive.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Nenhuma clínica em risco no momento.</p>
                    ) : (
                      <div className="space-y-3">
                        {trialEndingSoon.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-600 mb-1">Trial acabando (≤3 dias)</p>
                            <div className="space-y-0.5">
                              {trialEndingSoon.map(o => (
                                <button key={o.id} onClick={() => openClinic(o.id)} className="w-full flex items-center justify-between rounded-lg px-2 py-1 hover:bg-accent transition-colors text-left">
                                  <span className="text-sm truncate">{o.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {inactive.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Sem atividade (30+ dias)</p>
                            <div className="space-y-0.5">
                              {inactive.slice(0, 6).map(o => (
                                <button key={o.id} onClick={() => openClinic(o.id)} className="w-full flex items-center justify-between rounded-lg px-2 py-1 hover:bg-accent transition-colors text-left">
                                  <span className="text-sm truncate">{o.name}</span>
                                  <span className="text-[11px] text-muted-foreground">{o.lastActivityAt ? new Date(o.lastActivityAt + "T12:00:00").toLocaleDateString("pt-BR") : "nunca"}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Busca + grade */}
                <div className="space-y-3">
                  <Input
                    placeholder="Buscar clínica por nome ou dono..."
                    value={clinicSearch}
                    onChange={e => setClinicSearch(e.target.value)}
                    className="max-w-sm"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredOrgs.map((org) => {
                      const initials = org.name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase()
                      const trialEnd = org.trialEndsAt ? new Date(org.trialEndsAt) : null
                      const trialExpired = org.subscriptionStatus === "trialing" && trialEnd !== null && trialEnd < now
                      const trialDaysLeft = trialEnd && !trialExpired
                        ? Math.ceil((trialEnd.getTime() - now.getTime()) / 86400000)
                        : null
                      const trialDaysAgo = trialExpired && trialEnd
                        ? Math.floor((now.getTime() - trialEnd.getTime()) / 86400000)
                        : null

                      return (
                        <div key={org.id} className={cn(
                          "rounded-xl border bg-card flex flex-col overflow-hidden",
                          trialExpired ? "border-destructive/40" : "border-border"
                        )}>
                          {trialExpired && (
                            <div className="bg-destructive/10 px-4 py-1.5 flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-destructive">
                                Trial encerrado há {trialDaysAgo === 0 ? "menos de 1 dia" : `${trialDaysAgo} dia${trialDaysAgo !== 1 ? "s" : ""}`}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-3 px-4 py-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{initials}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold truncate">{org.name}</span>
                                <span className={cn(
                                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                                  trialExpired ? "text-destructive bg-destructive/10" : statusColor(org.subscriptionStatus)
                                )}>
                                  {trialExpired ? "Trial expirado" : statusLabel(org.subscriptionStatus)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{org.owner?.name}</p>
                            </div>
                            {trialDaysLeft !== null && (
                              <div className={cn(
                                "shrink-0 text-center rounded-lg px-2 py-1",
                                trialDaysLeft <= 3 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-muted"
                              )}>
                                <p className={cn("text-base font-bold tabular-nums leading-none", trialDaysLeft <= 3 ? "text-amber-600 dark:text-amber-400" : "text-foreground")}>
                                  {trialDaysLeft}
                                </p>
                                <p className={cn("text-[9px] font-medium", trialDaysLeft <= 3 ? "text-amber-500" : "text-muted-foreground")}>
                                  {trialDaysLeft === 1 ? "dia" : "dias"}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-4 gap-px bg-border mx-4 rounded-lg overflow-hidden mb-4">
                            {[
                              { label: "Clientes", value: org.clients },
                              { label: "Atend.", value: org.appointments },
                              { label: "Receita", value: formatBRL(org.revenue) },
                              { label: "Equipe", value: org.team },
                            ].map(s => (
                              <div key={s.label} className="bg-muted/40 py-2.5 text-center">
                                <p className="font-bold text-sm tabular-nums">{s.value}</p>
                                <p className="text-[10px] text-muted-foreground">{s.label}</p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-auto border-t border-border/50 px-4 py-3 flex flex-wrap gap-1.5 items-center">
                            <button onClick={() => openClinic(org.id)} className="text-xs font-medium text-primary hover:underline transition-colors mr-auto">
                              Ver detalhes
                            </button>
                            <Button size="sm" variant="outline" disabled={actionLoading === org.id} onClick={() => handleExtendTrial(org.id, 7)} className="h-6 text-[11px] px-2">+7d</Button>
                            <Button size="sm" variant="outline" disabled={actionLoading === org.id} onClick={() => handleExtendTrial(org.id, 30)} className="h-6 text-[11px] px-2">+30d</Button>
                            {org.subscriptionStatus !== "lifetime" && (
                              <Button size="sm" variant="outline" disabled={actionLoading === org.id} onClick={() => handleSetLifetime(org.id)} className="h-6 text-[11px] px-2 text-amber-600 border-amber-300 hover:border-amber-500">♾</Button>
                            )}
                            {org.subscriptionStatus !== "canceled" && org.subscriptionStatus !== "lifetime" && (
                              <Button size="sm" variant="outline" disabled={actionLoading === org.id} onClick={() => setPendingCancelOrg({ id: org.id, name: org.name })} className="h-6 text-[11px] px-2 text-destructive border-destructive/30 hover:border-destructive/60">✕</Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )
      }


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

      case "whatsapp": {
        const PAGE_SIZE = 25
        const totalPages = Math.max(1, Math.ceil(whatsappTotal / PAGE_SIZE))

        function applyFilters(overrides: Partial<WhatsAppLogsParams> = {}) {
          const params: WhatsAppLogsParams = {
            page: whatsappPage,
            pageSize: PAGE_SIZE,
            period: whatsappPeriod,
            orgName: logFilterOrg || undefined,
            eventType: logFilterEvent || undefined,
            errorOnly: logFilterError || undefined,
            ...overrides,
          }
          if (overrides.page === undefined) { params.page = 1; setWhatsappPage(1) }
          fetchLogs(params)
        }

        const eventColor = (type: string) =>
          type === "delivered" || type === "read" ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20" :
          type === "failed" ? "text-destructive bg-destructive/10" :
          type === "submitted" ? "text-blue-700 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20" :
          "text-muted-foreground bg-muted"

        const eventLabel: Record<string, string> = {
          submitted: "Enviado", enqueued: "Na fila", sent: "Entregue ao WA",
          delivered: "Entregue", read: "Lido", failed: "Falhou",
        }

        const formatBR = (d: Date) => new Date(d).toLocaleString("pt-BR", {
          timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit",
          year: "numeric", hour: "2-digit", minute: "2-digit",
        })

        const PERIODS: { value: WhatsAppLogsParams["period"]; label: string }[] = [
          { value: "today", label: "Hoje" },
          { value: "7d",    label: "7 dias" },
          { value: "30d",   label: "30 dias" },
          { value: "all",   label: "Tudo" },
        ]

        const EVENT_FILTERS = [
          { value: "",          label: "Todos os eventos" },
          { value: "submitted", label: "Enviados" },
          { value: "delivered", label: "Entregues" },
          { value: "read",      label: "Lidos" },
          { value: "failed",    label: "Com falha" },
        ]

        return (
          <div className="space-y-4">
            {/* Filtros */}
            <div className="space-y-2">
              {/* Período */}
              <div className="flex rounded-lg border border-border overflow-hidden w-fit">
                {PERIODS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => { setWhatsappPeriod(p.value); setWhatsappPage(1); applyFilters({ period: p.value, page: 1 }) }}
                    className={cn(
                      "px-3 py-1.5 text-xs transition-colors border-r border-border last:border-r-0",
                      whatsappPeriod === p.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Linha de filtros */}
              <div className="flex flex-wrap gap-2 items-center">
                <Input
                  placeholder="Filtrar por clínica..."
                  value={logFilterOrg}
                  onChange={e => setLogFilterOrg(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && applyFilters({ orgName: logFilterOrg || undefined })}
                  className="h-8 text-xs w-44"
                />
                <select
                  value={logFilterEvent}
                  onChange={e => { setLogFilterEvent(e.target.value); applyFilters({ eventType: e.target.value || undefined }) }}
                  className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
                >
                  {EVENT_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <button
                  onClick={() => { const next = !logFilterError; setLogFilterError(next); applyFilters({ errorOnly: next }) }}
                  className={cn("h-8 px-3 rounded-lg border text-xs transition-colors", logFilterError ? "border-destructive bg-destructive/10 text-destructive" : "border-border text-muted-foreground hover:border-foreground")}
                >
                  Só com erro
                </button>
                <button
                  onClick={() => applyFilters({ orgName: logFilterOrg || undefined })}
                  className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent transition-colors"
                >
                  Buscar
                </button>
                <span className="text-xs text-muted-foreground ml-auto tabular-nums">
                  {whatsappTotal} registro{whatsappTotal !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Lista */}
            <div className="rounded-xl border border-border overflow-hidden">
              {whatsappLoading ? (
                <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
              ) : whatsappLogs.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">Nenhum log encontrado.</div>
              ) : (
                <div className="divide-y divide-border">
                  {whatsappLogs.map(log => (
                    <div key={log.id} className="px-5 py-3.5 space-y-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium truncate">{log.organizationName ?? <span className="text-muted-foreground">Sem org</span>}</p>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0", eventColor(log.eventType))}>
                          {eventLabel[log.eventType] ?? log.eventType}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Destino: <span className="text-foreground/70">{log.destination ?? "—"}</span>
                        {log.templateId && <> · Template: <span className="font-mono text-[10px]">{log.templateId.length > 20 ? log.templateId.slice(0, 20) + "…" : log.templateId}</span></>}
                      </p>
                      {log.error && <p className="text-xs text-destructive">⚠ {log.error}</p>}
                      <p className="text-[11px] text-muted-foreground">{formatBR(log.updatedAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <button
                  disabled={whatsappPage <= 1 || whatsappLoading}
                  onClick={() => { const p = whatsappPage - 1; setWhatsappPage(p); applyFilters({ page: p }) }}
                  className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Anterior
                </button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  Página {whatsappPage} de {totalPages}
                </span>
                <button
                  disabled={whatsappPage >= totalPages || whatsappLoading}
                  onClick={() => { const p = whatsappPage + 1; setWhatsappPage(p); applyFilters({ page: p }) }}
                  className="h-8 px-3 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima →
                </button>
              </div>
            )}
          </div>
        )
      }

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
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Reativação trial expirado <code className="text-xs bg-muted px-1.5 py-0.5 rounded ml-1">kira_trial_expired_outreach</code></p>
              <Input value={trialExpiredOutreachTemplateId} onChange={e => setTrialExpiredOutreachTemplateId(e.target.value)} placeholder="UUID do template trial expirado" className="font-mono text-xs" />
            </div>
            {templateError && <p className="text-xs text-destructive">{templateError}</p>}
            <Button onClick={handleSaveTemplate} disabled={templateSaving} className="w-full">
              {templateSaving ? "Salvando..." : "Salvar configurações"}
            </Button>
          </div>
        </div>
      )

      case "chat": return <AdminChat trialOutreachTemplateId={trialOutreachTemplateId || null} trialExpiredOutreachTemplateId={trialExpiredOutreachTemplateId || null} />

      case "suporte": {
        const selectedEmail = inboundEmails.find(e => e.id === expandedEmail) ?? null
        return (
          <div className="flex gap-0 h-full">
            {/* Lista */}
            <div className="w-80 shrink-0 border-r border-border flex flex-col">
              <div className="px-4 py-3 border-b border-border shrink-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Entrada · {inboundEmails.length} {unreadCount > 0 && <span className="text-primary">{unreadCount} não lidos</span>}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {inboundEmails.length === 0 && (
                  <div className="flex flex-col items-center gap-2 py-14 text-center px-4">
                    <MailOpen size={20} className="text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Caixa de entrada vazia</p>
                  </div>
                )}
                {inboundEmails.map(email => (
                  <button
                    key={email.id}
                    onClick={() => handleExpandEmail(email.id)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3.5 hover:bg-accent transition-colors text-left",
                      expandedEmail === email.id && "bg-accent",
                      !email.read && "bg-primary/5"
                    )}
                  >
                    <div className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", !email.read ? "bg-primary" : "bg-transparent")} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={cn("text-xs truncate", !email.read ? "font-semibold text-foreground" : "text-muted-foreground")}>{email.from.split("<")[0].trim() || email.from}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{new Date(email.receivedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                      </div>
                      <p className={cn("text-sm truncate", !email.read ? "font-medium" : "")}>{email.subject}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{(email.body ?? "").slice(0, 60)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              {selectedEmail ? (
                <>
                  <div className="px-6 py-4 border-b border-border shrink-0 space-y-1">
                    <h2 className="font-semibold text-base">{selectedEmail.subject}</h2>
                    <p className="text-xs text-muted-foreground">
                      De: <span className="text-foreground">{selectedEmail.from}</span>
                      {" · "}
                      {new Date(selectedEmail.receivedAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto px-6 py-5">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedEmail.body || "(sem conteúdo)"}</p>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center text-muted-foreground">
                  <Mail size={28} className="opacity-20" />
                  <p className="text-sm">Selecione um email para ler</p>
                </div>
              )}
            </div>
          </div>
        )
      }

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
        <main className={cn("flex-1 overflow-y-auto", (activeSection === "chat" || activeSection === "suporte") ? "p-0 overflow-hidden" : "p-6")}>
          {renderSection()}
        </main>
      </div>
    </div>
  )
}
