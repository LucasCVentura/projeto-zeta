"use client"

import dynamic from "next/dynamic"

// recharts (+ d3) é ~130KB gzip que hoje entra no first-load JS do /dashboard
// — a página mais visitada do app, carregada logo após todo login. `ssr:false`
// só funciona a partir de um Client Component (ver docs do Next), por isso o
// wrapper: o gráfico vira um chunk separado, buscado depois do conteúdo
// principal já ter pintado, em vez de bloquear o carregamento inicial.
function ChartSkeleton() {
  return <div className="min-h-56 animate-pulse rounded-xl border border-border bg-muted/20" />
}

export const RevenueChart = dynamic(
  () => import("./dashboard-charts").then((m) => m.RevenueChart),
  { ssr: false, loading: ChartSkeleton }
)

export const StatusChart = dynamic(
  () => import("./dashboard-charts").then((m) => m.StatusChart),
  { ssr: false, loading: ChartSkeleton }
)
