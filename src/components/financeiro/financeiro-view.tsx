"use client"

import { useState, useEffect } from "react"
import { getTransactionsAction } from "@/actions/financial"
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PaymentMethod } from "@/db/schema"

type Transaction = {
  id: string
  amount: number
  cost: number
  description: string | null
  date: string
  appointmentId: string | null
  paymentMethod: PaymentMethod | null
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

const PAYMENT_CONFIG: Record<PaymentMethod, { label: string; emoji: string; color: string }> = {
  pix:            { label: "Pix",      emoji: "⚡", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cartao_debito:  { label: "Débito",   emoji: "💳", color: "bg-blue-50 text-blue-700 border-blue-200" },
  cartao_credito: { label: "Crédito",  emoji: "💳", color: "bg-violet-50 text-violet-700 border-violet-200" },
  parcelado:      { label: "Parcelado",emoji: "📆", color: "bg-orange-50 text-orange-700 border-orange-200" },
  dinheiro:       { label: "Dinheiro", emoji: "💵", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
}

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "short",
  })
}

function PaymentBadge({ method }: { method: PaymentMethod }) {
  const cfg = PAYMENT_CONFIG[method]
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium", cfg.color)}>
      <span className="text-[11px] leading-none">{cfg.emoji}</span>
      {cfg.label}
    </span>
  )
}

function PaymentBreakdown({ rows }: { rows: Transaction[] }) {
  const withMethod = rows.filter((r) => r.paymentMethod)
  if (withMethod.length === 0) return null

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
                  <span>{cfg.emoji}</span>
                  {cfg.label}
                  <span className="text-xs text-muted-foreground font-normal">({count})</span>
                </span>
                <div className="text-right">
                  <span className="font-semibold">{formatCurrency(total)}</span>
                  <span className="ml-1.5 text-xs text-muted-foreground">{pct}%</span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
      {withMethod.length < rows.length && (
        <p className="text-xs text-muted-foreground">
          {rows.length - withMethod.length} atendimento{rows.length - withMethod.length !== 1 ? "s" : ""} sem forma registrada.
        </p>
      )}
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
  const [data, setData] = useState<{ rows: Transaction[]; total: number; totalCost: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    getTransactionsAction(year, month).then((d) => {
      setData(d)
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

  return (
    <div className="space-y-4">
      {/* Navegação de mês */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium">
          {MONTH_NAMES[month - 1]} {year}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border border-border transition-colors",
            isCurrentMonth ? "opacity-30 cursor-not-allowed" : "hover:bg-accent"
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="surface col-span-2 sm:col-span-3 flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50">
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">Receita bruta</p>
            <p className="text-2xl font-bold">
              {isLoading ? "—" : formatCurrency(data?.total ?? 0)}
            </p>
          </div>
          {!isLoading && data && (
            <div className="ml-auto text-right shrink-0">
              <p className="text-2xl font-bold text-muted-foreground/40">{data.rows.length}</p>
              <p className="text-xs text-muted-foreground">atendimento{data.rows.length !== 1 ? "s" : ""}</p>
            </div>
          )}
        </div>

        {!isLoading && data && (data.totalCost > 0) && (
          <>
            <div className="surface">
              <p className="text-xs text-muted-foreground">Custo insumos</p>
              <p className="text-lg font-semibold text-orange-600">{formatCurrency(data.totalCost)}</p>
            </div>
            <div className="surface sm:col-span-2">
              <p className="text-xs text-muted-foreground">Lucro líquido</p>
              <p className="text-lg font-semibold text-green-600">{formatCurrency(data.total - data.totalCost)}</p>
            </div>
          </>
        )}
      </div>

      {/* KPI formas de pagamento */}
      {!isLoading && data && <PaymentBreakdown rows={data.rows} />}

      {/* Lista de transações */}
      <div className="surface space-y-0 divide-y divide-border overflow-hidden p-0">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Carregando...</div>
        ) : !data || data.rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <TrendingUp size={24} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Nenhuma receita registrada neste período.</p>
          </div>
        ) : (
          data.rows.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between px-4 py-3 gap-3">
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium truncate">{tx.description ?? "Atendimento"}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                  {tx.paymentMethod && <PaymentBadge method={tx.paymentMethod} />}
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-green-600">{formatCurrency(tx.amount)}</p>
                {tx.cost > 0 && (
                  <p className="text-xs text-orange-500">-{formatCurrency(tx.cost)} insumos</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
