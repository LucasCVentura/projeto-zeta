import { CalendarDays, Users, CalendarCheck, TrendingUp, Clock, AlertTriangle } from "lucide-react"
import { getDashboardDataAction } from "@/actions/dashboard"
import { getLowStockSuppliesAction } from "@/actions/supplies"
import { getOnboardingStatusAction } from "@/actions/onboarding"
import { StatusBadge } from "@/components/agenda/status-badge"
import { RevenueChart, ProceduresChart, StatusChart } from "@/components/dashboard/dashboard-charts"
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"
import Link from "next/link"

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default async function DashboardPage() {
  const [data, lowStock, onboarding] = await Promise.all([
    getDashboardDataAction(),
    getLowStockSuppliesAction(),
    getOnboardingStatusAction(),
  ])

  const stats = [
    {
      label: "Agendamentos hoje",
      value: String(data.todayCount),
      icon: CalendarDays,
    },
    {
      label: "Clientes",
      value: String(data.totalClients),
      icon: Users,
    },
    {
      label: "Confirmados hoje",
      value: String(data.confirmedToday),
      icon: CalendarCheck,
    },
    {
      label: "Receita do mês",
      value: formatCurrency(data.monthRevenue),
      icon: TrendingUp,
    },
  ]

  return (
    <div className="container-page py-6 space-y-6">
      {/* Alerta de estoque baixo */}
      {lowStock.length > 0 && (
        <Link href="/estoque" className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors no-underline">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-medium">{lowStock.length} insumo{lowStock.length > 1 ? "s" : ""} com estoque baixo:</span>{" "}
            {lowStock.map((s) => s.name).join(", ")}
          </p>
        </Link>
      )}

      {/* Onboarding — aparece até o usuário dispensar */}
      <OnboardingChecklist {...onboarding} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="surface space-y-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Icon size={18} className="text-primary" />
            </div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueChart data={data.revenueChart} />
        <StatusChart data={data.statusCounts} />
      </div>
      <ProceduresChart data={data.topProcedures} />

      {/* Atendimentos de hoje */}
      <div className="surface space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Agenda de hoje</p>
          <Link href={`/agenda?data=${data.today}`} className="text-xs text-primary hover:underline underline-offset-4">
            Ver agenda
          </Link>
        </div>

        {data.upcomingToday.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Clock size={16} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhum atendimento pendente hoje.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.upcomingToday.map((appt) => (
              <div key={appt.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {appt.clientName[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{appt.clientName}</p>
                    {appt.procedure && (
                      <p className="text-xs text-muted-foreground truncate">{appt.procedure}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium tabular-nums">
                    {appt.startTime.slice(0, 5)}
                  </span>
                  <StatusBadge status={appt.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
