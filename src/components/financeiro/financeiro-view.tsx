"use client"

import { useState, useEffect } from "react"
import { getTransactionsAction } from "@/actions/financial"
import { ChevronLeft, ChevronRight, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

type Transaction = {
  id: string
  amount: number
  description: string | null
  date: string
  appointmentId: string | null
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "short",
  })
}

export function FinanceiroView() {
  const [year, setYear] = useState(() => {
    const now = new Date(new Date().toLocaleString("en-CA", { timeZone: "America/Sao_Paulo", hour12: false }))
    return now.getFullYear()
  })
  const [month, setMonth] = useState(() => {
    const now = new Date(new Date().toLocaleString("en-CA", { timeZone: "America/Sao_Paulo", hour12: false }))
    return now.getMonth() + 1
  })
  const [data, setData] = useState<{ rows: Transaction[]; total: number } | null>(null)
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
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
    if (isCurrentMonth) return
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

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

      {/* Card total */}
      <div className="surface flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50">
          <TrendingUp size={20} className="text-green-600" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Total do mês</p>
          <p className="text-2xl font-bold">
            {isLoading ? "—" : formatCurrency(data?.total ?? 0)}
          </p>
        </div>
        {!isLoading && data && (
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-muted-foreground/40">{data.rows.length}</p>
            <p className="text-xs text-muted-foreground">atendimento{data.rows.length !== 1 ? "s" : ""}</p>
          </div>
        )}
      </div>

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
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{tx.description ?? "Atendimento"}</p>
                <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
              </div>
              <span className="text-sm font-semibold text-green-600 shrink-0">
                {formatCurrency(tx.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
