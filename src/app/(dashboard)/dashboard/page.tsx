import { CalendarDays, Users, CalendarCheck, TrendingUp, Clock, AlertTriangle, Cake, UserX, CalendarRange } from "lucide-react"
import { getDashboardDataAction } from "@/actions/dashboard"
import { getLowStockSuppliesAction } from "@/actions/supplies"
import { getOnboardingStatusAction } from "@/actions/onboarding"
import { StatusBadge } from "@/components/agenda/status-badge"
import { RevenueChart, ProceduresChart, StatusChart } from "@/components/dashboard/dashboard-charts"
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist"
import Link from "next/link"
import { requireSession } from "@/lib/session"
import { can } from "@/lib/permissions"
import { cn } from "@/lib/utils"

function formatCurrency(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatDateBR(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })
}

export default async function DashboardPage() {
  const [session, data, lowStock, onboarding] = await Promise.all([
    requireSession(),
    getDashboardDataAction(),
    getLowStockSuppliesAction(),
    getOnboardingStatusAction(),
  ])
  const dismissStorageKey = `kira:onboarding-dismissed:${session.organizationId}:${session.userId}`
  const canSeeFinancial = can(session.role, "financial:read")

  const stats = [
    { label: "Agendamentos hoje", value: String(data.todayCount), icon: CalendarDays },
    { label: "Clientes", value: String(data.totalClients), icon: Users },
    {
      label: "Taxa de confirmação",
      value: data.confirmationRate !== null ? `${data.confirmationRate}%` : "—",
      icon: CalendarCheck,
      sub: `${data.confirmedToday} confirmados`,
    },
    ...(canSeeFinancial ? [{
      label: "Receita do mês",
      value: formatCurrency(data.monthRevenue),
      icon: TrendingUp,
    }] : []),
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

      {/* Onboarding */}
      <OnboardingChecklist dismissStorageKey={dismissStorageKey} role={session.role} {...onboarding} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, sub }: any) => (
          <div key={label} className="surface space-y-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Icon size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
            </div>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Linha de alertas: aniversariantes + clientes sem retorno */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Aniversariantes */}
        {(data.birthdays ?? []).length > 0 && (
          <div className="surface space-y-3">
            <div className="flex items-center gap-2">
              <Cake size={16} className="text-pink-500" />
              <p className="text-sm font-medium">Aniversariantes da semana</p>
            </div>
            <div className="space-y-2">
              {(data.birthdays ?? []).map(b => (
                <Link key={b.id} href={`/clientes/${b.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-muted/40 transition-colors no-underline">
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(b.birthDate + "T00:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Clientes sem retorno */}
        {(data.lostClients ?? []).length > 0 && (
          <div className="surface space-y-3">
            <div className="flex items-center gap-2">
              <UserX size={16} className="text-amber-500" />
              <p className="text-sm font-medium">Clientes sem retorno há 30+ dias</p>
            </div>
            <div className="space-y-2">
              {(data.lostClients ?? []).map(c => (
                <Link key={c.id} href={`/clientes/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-muted/40 transition-colors no-underline">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.lastDate ? `Último: ${new Date(c.lastDate + "T00:00:00").toLocaleDateString("pt-BR")}` : "Sem atendimentos"}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Procedimentos mais realizados */}
        {(data.topProcedures ?? []).length > 0 && (
          <div className="surface space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <p className="text-sm font-medium">Procedimentos mais realizados</p>
            </div>
            <div className="space-y-2">
              {(data.topProcedures ?? []).map((p, i) => {
                const max = data.topProcedures[0]?.count ?? 1
                const pct = Math.round((p.count / max) * 100)
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">{p.count}x</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Visão da clínica */}
      {canSeeFinancial && (
        <section className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold">Visão da clínica</h2>
              <p className="text-sm text-muted-foreground">Receita, atendimentos e procedimentos em um só lugar.</p>
            </div>
            <Link href="/financeiro" className="text-xs font-medium text-primary hover:underline underline-offset-4">
              Ver financeiro
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <RevenueChart data={data.revenueChart} />
            <StatusChart data={data.statusCounts} />
          </div>
        </section>
      )}

      {/* Agenda de hoje */}
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
            <p className="text-sm text-muted-foreground">Nenhum atendimento pendente hoje.</p>
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
                    {appt.procedure && <p className="text-xs text-muted-foreground truncate">{appt.procedure}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium tabular-nums">{appt.startTime.slice(0, 5)}</span>
                  <StatusBadge status={appt.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Próximos agendamentos da semana */}
      {(data.weekAppointments ?? []).length > 0 && (
        <div className="surface space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarRange size={16} className="text-primary" />
              <p className="text-sm font-medium">Próximos da semana</p>
            </div>
            <Link href="/agenda" className="text-xs text-primary hover:underline underline-offset-4">
              Ver agenda
            </Link>
          </div>
          <div className="space-y-2">
            {(data.weekAppointments ?? []).map((appt) => (
              <div key={appt.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {appt.clientName[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{appt.clientName}</p>
                    {appt.procedure && <p className="text-xs text-muted-foreground truncate">{appt.procedure}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <p className="text-sm font-medium tabular-nums">{appt.startTime.slice(0, 5)}</p>
                    <p className="text-xs text-muted-foreground">{formatDateBR(appt.date)}</p>
                  </div>
                  <StatusBadge status={appt.status as any} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
