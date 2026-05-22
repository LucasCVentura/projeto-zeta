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

export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const hasData = data.some((d) => d.total > 0)
  return (
    <div className="surface space-y-4">
      <p className="text-sm font-medium">Receita — últimos 6 meses</p>
      {!hasData ? (
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
          Nenhuma receita registrada ainda.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} barSize={28}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              formatter={(v: number) => formatBRL(v)}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
              cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            />
            <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function ProceduresChart({ data }: { data: ProcedurePoint[] }) {
  const hasData = data.length > 0
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="surface space-y-4">
      <p className="text-sm font-medium">Procedimentos mais realizados</p>
      {!hasData ? (
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
          Nenhum procedimento registrado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((p) => (
            <div key={p.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="truncate max-w-[75%]">{p.name}</span>
                <span className="text-muted-foreground tabular-nums">{p.count}x</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${(p.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function StatusChart({ data }: { data: StatusPoint[] }) {
  const hasData = data.length > 0
  const chartData = data.map((d) => ({
    name: STATUS_LABELS[d.status] ?? d.status,
    value: d.count,
    color: STATUS_COLORS[d.status] ?? "#a0948e",
  }))

  return (
    <div className="surface space-y-4">
      <p className="text-sm font-medium">Atendimentos por status — este mês</p>
      {!hasData ? (
        <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
          Nenhum atendimento este mês.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number, name: string) => [v, name]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
