"use client"

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts"

type RevenuePoint = { month: string; total: number }
type ProcedurePoint = { name: string; count: number }
type StatusPoint = { status: string; count: number }

const STATUS_LABELS: Record<string, string> = {
  completed: "Concluído",
  confirmed: "Confirmado",
  waiting: "Aguardando",
  missed: "Faltou",
  cancelled: "Cancelado",
}

const STATUS_COLORS: Record<string, string> = {
  completed: "#b06070",
  confirmed: "#7c9e87",
  waiting: "#c4a45a",
  missed: "#a0948e",
  cancelled: "#d4b8be",
}

function formatBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function EmptyChart({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 px-4 text-center text-sm text-muted-foreground">
      {children}
    </div>
  )
}

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const hasData = data.some((d) => d.total > 0)
  const total = data.reduce((sum, d) => sum + d.total, 0)
  const bestMonth = data.reduce((best, item) => item.total > best.total ? item : best, data[0] ?? { month: "-", total: 0 })

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Receita</h2>
          <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums">{formatBRL(total)}</p>
          <p className="text-xs text-muted-foreground">total no período</p>
        </div>
      </div>

      {!hasData ? (
        <EmptyChart>Nenhuma receita registrada ainda.</EmptyChart>
      ) : (
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={32} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                dy={8}
              />
            <YAxis hide />
            <Tooltip
              formatter={(v: unknown) => formatBRL(v as number)}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
              <Bar dataKey="total" fill="var(--primary)" radius={[8, 8, 2, 2]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasData && (
        <div className="mt-4 rounded-lg bg-muted/35 px-3 py-2 text-xs text-muted-foreground">
          Melhor mês: <span className="font-medium text-foreground">{bestMonth.month}</span> com{" "}
          <span className="font-medium text-foreground">{formatBRL(bestMonth.total)}</span>
        </div>
      )}
    </section>
  )
}

export function ProceduresChart({ data }: { data: ProcedurePoint[] }) {
  const hasData = data.length > 0
  const max = Math.max(...data.map((d) => d.count), 1)
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Procedimentos mais realizados</h2>
          <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
        </div>
        <div className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {total} registro{total === 1 ? "" : "s"}
        </div>
      </div>

      {!hasData ? (
        <EmptyChart>Nenhum procedimento registrado ainda.</EmptyChart>
      ) : (
        <div className="space-y-3">
          {data.map((p) => (
            <div key={p.name} className="rounded-lg border border-border/70 bg-background px-3 py-3">
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{p.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{p.count}x</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(p.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function StatusChart({ data }: { data: StatusPoint[] }) {
  const hasData = data.length > 0
  const chartData = data.map((d) => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] ?? "#a0948e",
  }))
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold">Atendimentos por status</h2>
          <p className="text-xs text-muted-foreground">Este mês</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums">{total}</p>
          <p className="text-xs text-muted-foreground">atendimentos</p>
        </div>
      </div>

      {!hasData ? (
        <EmptyChart>Nenhum atendimento este mês.</EmptyChart>
      ) : (
        <div className="grid min-h-60 gap-4 sm:grid-cols-[220px_1fr] sm:items-center">
          <div className="relative h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={82}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="var(--card)"
                  strokeWidth={2}
                >
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [String(value), String(name)]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
                />
                <Legend wrapperStyle={{ display: "none" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums">{total}</span>
              <span className="text-[11px] text-muted-foreground">total</span>
            </div>
          </div>

          <div className="space-y-2">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 rounded-lg bg-muted/35 px-3 py-2 text-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground tabular-nums">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
