"use client"

import React, { useState, useEffect } from "react"
import { getTransactionsAction, getFinanceiroSummaryAction } from "@/actions/financial"
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Zap, CreditCard,
  CalendarRange, Banknote, Award, Users, Stethoscope, Clock, Info, X,
  BarChart2, Star,
} from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type { PaymentMethod } from "@/db/schema"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from "recharts"

type Transaction = {
  id: string
  amount: number
  commissionAmount: number | null
  cost: number
  description: string | null
  date: string
  appointmentId: string | null
  paymentMethod: PaymentMethod | null
  professionalId: string
  professionalName: string
}

type Summary = {
  prevTotal: number
  history: { year: number; month: number; total: number }[]
  procedures: { name: string; total: number; count: number }[]
  topClients: { name: string; total: number; count: number }[]
  projected: number
  hasTeam: boolean
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]
const MONTH_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

const PAYMENT_CONFIG: Record<PaymentMethod, { label: string; icon: React.ElementType; color: string }> = {
  pix:            { label: "Pix",       icon: Zap,           color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cartao_debito:  { label: "Débito",    icon: CreditCard,    color: "bg-blue-50 text-blue-700 border-blue-200" },
  cartao_credito: { label: "Crédito",   icon: CreditCard,    color: "bg-violet-50 text-violet-700 border-violet-200" },
  parcelado:      { label: "Parcelado", icon: CalendarRange, color: "bg-orange-50 text-orange-700 border-orange-200" },
  dinheiro:       { label: "Dinheiro",  icon: Banknote,      color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          <Info size={13} />
        </TooltipTrigger>
        <TooltipContent side="top" align="start">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function DeltaBadge({ current, prev }: { current: number; prev: number }) {
  if (prev === 0) return null
  const pct = Math.round(((current - prev) / prev) * 100)
  const up = pct >= 0
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", up ? "text-emerald-600" : "text-red-500")}>
      {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {Math.abs(pct)}%
    </span>
  )
}

function PaymentBadge({ method }: { method: PaymentMethod }) {
  const cfg = PAYMENT_CONFIG[method]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cfg.color)}>
      <cfg.icon size={11} strokeWidth={2} />
      {cfg.label}
    </span>
  )
}

function PaymentBreakdown({ rows }: { rows: Transaction[] }) {
  const withMethod = rows.filter((r) => r.paymentMethod && r.amount > 0)
  if (withMethod.length === 0) return (
    <div className="surface space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Por forma de pagamento</p>
      <p className="text-sm text-muted-foreground/40 pt-1">Nenhum pagamento registrado neste mês.</p>
    </div>
  )

  const grouped = withMethod.reduce<Record<string, { count: number; total: number }>>((acc, tx) => {
    const key = tx.paymentMethod!
    if (!acc[key]) acc[key] = { count: 0, total: 0 }
    acc[key].count++
    acc[key].total += tx.amount
    return acc
  }, {})

  const totalWithMethod = withMethod.reduce((acc, tx) => acc + tx.amount, 0)
  const entries = Object.entries(grouped)
    .map(([method, stats]) => ({ method: method as PaymentMethod, ...stats }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="surface space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Por forma de pagamento</p>
      <div className="space-y-2">
        {entries.map(({ method, count, total }) => {
          const cfg = PAYMENT_CONFIG[method]
          const pct = totalWithMethod > 0 ? Math.round((total / totalWithMethod) * 100) : 0
          return (
            <div key={method} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <cfg.icon size={14} strokeWidth={1.8} />
                  {cfg.label}
                  <span className="text-xs text-muted-foreground font-normal">({count})</span>
                </span>
                <div className="text-right">
                  <span className="font-semibold">{formatCurrency(total)}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
      {withMethod.length < rows.filter(r => r.amount > 0).length && (
        <p className="text-xs text-muted-foreground">
          {rows.filter(r => r.amount > 0).length - withMethod.length} atendimento{rows.filter(r => r.amount > 0).length - withMethod.length !== 1 ? "s" : ""} sem forma registrada.
        </p>
      )}
    </div>
  )
}

function CommissionBreakdown({ rows }: { rows: Transaction[] }) {
  const grouped = rows.reduce<Record<string, { name: string; total: number; count: number }>>((acc, tx) => {
    if (!tx.commissionAmount) return acc
    if (!acc[tx.professionalId]) acc[tx.professionalId] = { name: tx.professionalName, total: 0, count: 0 }
    acc[tx.professionalId].total += tx.commissionAmount
    acc[tx.professionalId].count++
    return acc
  }, {})

  const entries = Object.entries(grouped).map(([id, v]) => ({ id, ...v })).sort((a, b) => b.total - a.total)
  if (entries.length === 0) return (
    <div className="surface space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comissões a pagar</p>
      <p className="text-sm text-muted-foreground/40 pt-1">Nenhuma comissão gerada neste mês.</p>
    </div>
  )

  const totalCommissions = entries.reduce((acc, e) => acc + e.total, 0)

  return (
    <div className="surface space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comissões a pagar</p>
      <div className="space-y-2">
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Award size={14} className="text-emerald-600 shrink-0" />
              <span className="font-medium">{e.name}</span>
              <span className="text-xs text-muted-foreground">({e.count} atend.)</span>
            </div>
            <span className="font-semibold text-emerald-600">{formatCurrency(e.total)}</span>
          </div>
        ))}
        {entries.length > 1 && (
          <div className="flex items-center justify-between text-sm pt-1 border-t border-border">
            <span className="text-muted-foreground">Total comissões</span>
            <span className="font-bold text-emerald-600">{formatCurrency(totalCommissions)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function RevenueChart({ history, currentMonth }: { history: Summary["history"]; currentMonth: number }) {
  const allZero = history.every(h => h.total === 0)

  const maxVal = Math.max(...history.map(h => h.total), 1)

  const chartData = history.map((h) => ({
    label: MONTH_SHORT[h.month - 1],
    total: h.total,
    isCurrentMonth: h.month === currentMonth,
  }))

  return (
    <div className="surface space-y-3">
      <div className="flex items-center gap-1.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Histórico 6 meses</p>
        <InfoTooltip text="Receita bruta mês a mês nos últimos 6 meses. A barra destacada é o mês atual." />
      </div>
      {allZero ? (
        <div className="h-44 flex items-center justify-center text-sm text-muted-foreground/40">Nenhuma receita registrada nos últimos 6 meses.</div>
      ) : null}
      <div className={cn("h-44", allZero ? "hidden" : "")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="30%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, maxVal * 1.15]} />
            <RechartsTooltip
              formatter={(value: number) => [formatCurrency(value), "Receita"]}
              labelStyle={{ fontSize: 12, color: "var(--muted-foreground)" }}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "var(--card)", color: "var(--card-foreground)" }}
              itemStyle={{ color: "var(--foreground)" }}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isCurrentMonth ? "var(--primary)" : "var(--muted)"}
                  opacity={entry.isCurrentMonth ? 1 : 0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function TopProcedures({ procedures }: { procedures: Summary["procedures"] }) {
  if (procedures.length === 0) return null
  const maxVal = Math.max(...procedures.map(p => p.total), 1)

  return (
    <div className="surface space-y-3">
      <div className="flex items-center gap-1.5">
        <Stethoscope size={14} className="text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Procedimentos (receita)</p>
        <InfoTooltip text="Procedimentos que mais geraram receita neste mês. Útil para saber onde concentrar sua agenda." />
      </div>
      <div className="space-y-3">
        {procedures.map((proc, i) => {
          const pct = Math.round((proc.total / maxVal) * 100)
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate max-w-[55%]">{proc.name}</span>
                <div className="text-right shrink-0">
                  <span className="font-semibold">{formatCurrency(proc.total)}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{proc.count}x</span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary/60 transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TopClients({ clients }: { clients: Summary["topClients"] }) {
  if (clients.length === 0) return null

  return (
    <div className="surface space-y-3">
      <div className="flex items-center gap-1.5">
        <Users size={14} className="text-muted-foreground" />
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top clientes</p>
        <InfoTooltip text="Clientes que mais investiram na clínica neste mês, pelo total gasto em atendimentos." />
      </div>
      <div className="space-y-2">
        {clients.map((c, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-bold text-muted-foreground/50 w-4 shrink-0">{i + 1}</span>
              <span className="font-medium truncate">{c.name}</span>
              <span className="text-xs text-muted-foreground shrink-0">({c.count} atend.)</span>
            </div>
            <span className="font-semibold shrink-0 ml-2">{formatCurrency(c.total)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const WHATS_NEW_KEY = "financeiro_v2_seen"

const WHATS_NEW_ITEMS = [
  { icon: BarChart2, label: "Histórico de 6 meses", desc: "Veja a evolução da sua receita num gráfico mês a mês." },
  { icon: TrendingUp,  label: "Comparativo com mês anterior", desc: "Saiba de imediato se você cresceu ou caiu em relação ao mês passado." },
  { icon: Stethoscope, label: "Top procedimentos", desc: "Descubra quais procedimentos mais geram receita na sua clínica." },
  { icon: Users,       label: "Top clientes",       desc: "Veja os clientes que mais investiram com você no mês." },
  { icon: Clock,       label: "Receita projetada",  desc: "Estimativa do que ainda pode entrar pelos agendamentos futuros." },
  { icon: Star,        label: "Ticket médio",       desc: "Valor médio por atendimento para acompanhar a saúde do seu negócio." },
]

function WhatsNewModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-primary/10 px-5 pt-6 pb-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-background/60 hover:bg-background transition-colors"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/15 rounded-full px-2 py-0.5">Novidade</span>
          </div>
          <p className="text-base font-bold">Financeiro renovado</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Sua tela de financeiro ganhou dados novos pra você entender tudo que acontece na clínica de uma vez só.
          </p>
        </div>

        {/* Lista de novidades */}
        <div className="px-5 py-4 space-y-3">
          {WHATS_NEW_ITEMS.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon size={15} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{label}</p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Entendi, vamos lá!
          </button>
        </div>
      </div>
    </div>
  )
}

export function FinanceiroView() {
  const [year, setYear] = useState(() => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    return now.getFullYear()
  })
  const [month, setMonth] = useState(() => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    return now.getMonth() + 1
  })
  const [data, setData] = useState<{
    rows: Transaction[]
    total: number
    totalCost: number
    totalCommissions?: number
    isProfessional: boolean
  } | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showWhatsNew, setShowWhatsNew] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(WHATS_NEW_KEY)) setShowWhatsNew(true)
  }, [])

  function handleCloseWhatsNew() {
    localStorage.setItem(WHATS_NEW_KEY, "1")
    setShowWhatsNew(false)
  }

  useEffect(() => {
    setIsLoading(true)
    setSummary(null)
    Promise.all([
      getTransactionsAction(year, month),
      getFinanceiroSummaryAction(year, month),
    ]).then(([txData, sumData]) => {
      setData(txData)
      if (sumData) setSummary(sumData)
      setIsLoading(false)
    })
  }, [year, month])

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    const nowBRT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
    const isCurrentMonth = year === nowBRT.getFullYear() && month === nowBRT.getMonth() + 1
    if (isCurrentMonth) return
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const nowBRT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  const isCurrentMonth = year === nowBRT.getFullYear() && month === nowBRT.getMonth() + 1
  const isProfessional = data?.isProfessional ?? false

  const paidCount = data?.rows.filter(r => r.amount > 0).length ?? 0
  const ticketMedio = paidCount > 0 ? Math.round((data?.total ?? 0) / paidCount) : 0

  return (
    <>
    {showWhatsNew && <WhatsNewModal onClose={handleCloseWhatsNew} />}
    <div className="space-y-4">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium">{MONTH_NAMES[month - 1]} {year}</span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className={cn("flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors", isCurrentMonth ? "opacity-30 cursor-not-allowed" : "hover:bg-accent")}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* KPIs principais */}
      {isProfessional ? (
        <div className="surface flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
            <Award size={20} className="text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Suas comissões</p>
            <p className="text-2xl font-bold text-emerald-600">
              {isLoading ? "—" : formatCurrency(data?.total ?? 0)}
            </p>
          </div>
          {!isLoading && data && (
            <div className="ml-auto text-right shrink-0">
              <p className="text-2xl font-bold text-muted-foreground/40">{data.rows.filter(r => r.commissionAmount).length}</p>
              <p className="text-xs text-muted-foreground">atendimento{data.rows.filter(r => r.commissionAmount).length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {/* Receita bruta — full width */}
          <div className="surface col-span-2 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="text-xs text-muted-foreground">Receita bruta</p>
                <InfoTooltip text="Total recebido em atendimentos concluídos no mês, antes de descontar comissões e custos." />
              </div>
              <p className="text-2xl font-bold">
                {isLoading ? "—" : formatCurrency(data?.total ?? 0)}
              </p>
              {!isLoading && summary && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <DeltaBadge current={data?.total ?? 0} prev={summary.prevTotal} />
                  <span className="text-xs text-muted-foreground">vs mês anterior</span>
                </div>
              )}
            </div>
            {!isLoading && data && (
              <div className="ml-auto text-right shrink-0">
                <p className="text-2xl font-bold text-muted-foreground/40">{paidCount}</p>
                <p className="text-xs text-muted-foreground">atendimento{paidCount !== 1 ? "s" : ""}</p>
              </div>
            )}
          </div>

          {/* Ticket médio */}
          <div className="surface">
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <InfoTooltip text="Valor médio por atendimento: receita bruta dividida pelo número de atendimentos pagos no mês." />
            </div>
            <p className={cn("text-lg font-semibold", isLoading || paidCount === 0 ? "text-muted-foreground/40" : "")}>
              {isLoading ? "—" : paidCount === 0 ? "—" : formatCurrency(ticketMedio)}
            </p>
          </div>

          {/* Receita projetada */}
          <div className="surface">
            <div className="flex items-center gap-1 mb-0.5">
              <Clock size={12} className="text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Projetado</p>
              <InfoTooltip text="Soma dos preços dos agendamentos confirmados ou aguardando no mês que ainda não foram faturados. É uma estimativa do que pode entrar." />
            </div>
            <p className={cn("text-lg font-semibold", isLoading || !summary || summary.projected === 0 ? "text-muted-foreground/40" : "text-blue-600")}>
              {isLoading ? "—" : formatCurrency(summary?.projected ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">agendamentos futuros</p>
          </div>

          {/* Custo insumos */}
          <div className="surface">
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">Custo insumos</p>
              <InfoTooltip text="Custo estimado dos insumos consumidos nos procedimentos realizados no mês, com base no cadastro de estoque." />
            </div>
            <p className={cn("text-lg font-semibold", isLoading || !data || data.totalCost === 0 ? "text-muted-foreground/40" : "text-orange-600")}>
              {isLoading ? "—" : formatCurrency(data?.totalCost ?? 0)}
            </p>
          </div>

          {/* Lucro líquido */}
          <div className="surface">
            <div className="flex items-center gap-1">
              <p className="text-xs text-muted-foreground">Lucro líquido</p>
              <InfoTooltip text="Receita bruta menos custo de insumos e comissões. É o que sobra para a clínica no mês." />
            </div>
            <p className={cn("text-lg font-semibold", isLoading || !data || data.total === 0 ? "text-muted-foreground/40" : "text-green-600")}>
              {isLoading ? "—" : formatCurrency((data?.total ?? 0) - (data?.totalCost ?? 0) - (data?.totalCommissions ?? 0))}
            </p>
          </div>

          {/* Total comissões — só se tiver equipe */}
          {summary?.hasTeam && (
            <div className="surface col-span-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={16} className="text-emerald-600" />
                <p className="text-sm text-muted-foreground">Total em comissões</p>
                <InfoTooltip text="Soma das comissões geradas para os profissionais nos atendimentos do mês." />
              </div>
              <p className={cn("text-sm font-semibold", isLoading || !data || (data.totalCommissions ?? 0) === 0 ? "text-muted-foreground/40" : "text-emerald-600")}>
                {isLoading ? "—" : `- ${formatCurrency(data?.totalCommissions ?? 0)}`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Gráfico histórico 6 meses */}
      {!isProfessional && (
        isLoading || !summary
          ? <div className="surface"><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Histórico 6 meses</p><div className="h-44 flex items-center justify-center text-sm text-muted-foreground/40">Carregando...</div></div>
          : <RevenueChart history={summary.history} currentMonth={month} />
      )}

      {/* Top procedimentos */}
      {!isProfessional && (
        isLoading || !summary
          ? null
          : summary.procedures.length === 0
            ? <div className="surface space-y-1"><div className="flex items-center gap-1.5"><Stethoscope size={14} className="text-muted-foreground" /><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Procedimentos (receita)</p></div><p className="text-sm text-muted-foreground/40 pt-1">Nenhum procedimento faturado neste mês.</p></div>
            : <TopProcedures procedures={summary.procedures} />
      )}

      {/* Top clientes */}
      {!isProfessional && (
        isLoading || !summary
          ? null
          : summary.topClients.length === 0
            ? <div className="surface space-y-1"><div className="flex items-center gap-1.5"><Users size={14} className="text-muted-foreground" /><p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top clientes</p></div><p className="text-sm text-muted-foreground/40 pt-1">Nenhum atendimento registrado neste mês.</p></div>
            : <TopClients clients={summary.topClients} />
      )}

      {/* Formas de pagamento */}
      {!isLoading && data && !isProfessional && <PaymentBreakdown rows={data.rows} />}

      {/* Comissões por profissional — só se tiver equipe */}
      {!isLoading && data && !isProfessional && summary?.hasTeam && <CommissionBreakdown rows={data.rows} />}

      {/* Lista de transações */}
      <div className="surface space-y-0 divide-y divide-border overflow-hidden p-0 max-h-120 overflow-y-auto">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : !data || data.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <TrendingUp size={24} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">
              {isProfessional ? "Nenhuma comissão registrada neste período." : "Nenhuma receita registrada neste período."}
            </p>
          </div>
        ) : isProfessional ? (
          data.rows.filter(r => r.commissionAmount).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{tx.description ?? "Atendimento"}</p>
                <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-emerald-600">{formatCurrency(tx.commissionAmount!)}</p>
                {tx.amount > 0 && <p className="text-xs text-muted-foreground">de {formatCurrency(tx.amount)}</p>}
              </div>
            </div>
          ))
        ) : (
          data.rows.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{tx.description ?? "Atendimento"}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                  {tx.paymentMethod && <PaymentBadge method={tx.paymentMethod} />}
                  <span className="text-xs text-muted-foreground">{tx.professionalName}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                {tx.amount > 0 && <p className="text-sm font-semibold text-green-600">{formatCurrency(tx.amount)}</p>}
                {tx.commissionAmount && (
                  <p className="text-xs text-emerald-600">
                    <Award size={10} className="inline mr-0.5" />
                    {formatCurrency(tx.commissionAmount)}
                  </p>
                )}
                {tx.cost > 0 && <p className="text-xs text-orange-500">-{formatCurrency(tx.cost)} insumos</p>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
    </>
  )
}
