"use client"

import { useState } from "react"
import { assignPackageToClientAction } from "@/actions/packages"
import { Package, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NativeSelect } from "@/components/ui/native-select"
import { cn } from "@/lib/utils"

type ClientPkg = {
  id: string
  packageName: string
  procedureName: string
  totalSessions: number
  sessionsUsed: number
  sessionsRemaining: number
  isActive: boolean
  purchasedAt: string
}

type AvailablePkg = {
  id: string
  name: string
  procedureName: string
  totalSessions: number
  price: number
  active: boolean
}

type Props = {
  clientId: string
  clientPackages: ClientPkg[]
  availablePackages: AvailablePkg[]
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ClientPackagesSection({ clientId, clientPackages: initial, availablePackages }: Props) {
  const [packages, setPackages] = useState(initial)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedPkgId, setSelectedPkgId] = useState(availablePackages[0]?.id ?? "")
  const [purchasedAt, setPurchasedAt] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)

  const activePackages = availablePackages.filter((p) => p.active)

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPkgId) return
    setLoading(true)
    await assignPackageToClientAction({ clientId, packageId: selectedPkgId, purchasedAt })
    const pkg = availablePackages.find((p) => p.id === selectedPkgId)!
    setPackages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        packageName: pkg.name,
        procedureName: pkg.procedureName,
        totalSessions: pkg.totalSessions,
        sessionsUsed: 0,
        sessionsRemaining: pkg.totalSessions,
        isActive: true,
        purchasedAt,
      },
    ])
    setLoading(false)
    setShowAssign(false)
  }

  return (
    <div className="surface space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Pacotes</p>
        {activePackages.length > 0 && (
          <button
            onClick={() => setShowAssign((v) => !v)}
            className="flex items-center gap-1 text-xs text-primary hover:underline underline-offset-4"
          >
            <Plus size={12} />
            Atribuir pacote
          </button>
        )}
      </div>

      {showAssign && (
        <form onSubmit={handleAssign} className="rounded-lg border border-border p-3 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Pacote</label>
            <NativeSelect value={selectedPkgId} onChange={(e) => setSelectedPkgId(e.target.value)}>
              {activePackages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.totalSessions} sessões · {formatPrice(p.price)}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Data de compra</label>
            <input
              type="date"
              value={purchasedAt}
              onChange={(e) => setPurchasedAt(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAssign(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="flex-1">
              {loading ? "Salvando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      )}

      {packages.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum pacote atribuído.</p>
      ) : (
        <div className="space-y-2">
          {packages.map((pkg) => {
            const pct = Math.round((pkg.sessionsUsed / pkg.totalSessions) * 100)
            return (
              <div key={pkg.id} className="rounded-lg border border-border px-3 py-2.5 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package size={14} className={cn(pkg.isActive ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <p className="text-sm font-medium leading-tight">{pkg.packageName}</p>
                      <p className="text-xs text-muted-foreground">{pkg.procedureName}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "shrink-0 text-xs font-medium px-2 py-0.5 rounded-full",
                    pkg.isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {pkg.isActive ? `${pkg.sessionsRemaining} restante${pkg.sessionsRemaining !== 1 ? "s" : ""}` : "Concluído"}
                  </span>
                </div>
                {/* Barra de progresso */}
                <div className="space-y-1">
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {pkg.sessionsUsed} de {pkg.totalSessions} sessões usadas
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
