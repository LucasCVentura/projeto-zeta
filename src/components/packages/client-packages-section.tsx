"use client"

import { useState } from "react"
import { assignPackageToClientAction, removeClientPackageAction } from "@/actions/packages"
import { Package, Plus, CalendarDays, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { SchedulePackageModal } from "./schedule-package-modal"

type ClientPkg = {
  id: string
  packageName: string
  procedureName: string
  procedureId: string
  totalSessions: number
  sessionsUsed: number
  sessionsRemaining: number
  isActive: boolean
  purchasedAt: string
}

type AvailablePkg = {
  id: string
  name: string
  procedureId: string
  procedureName: string
  totalSessions: number
  price: number
  active: boolean
}

type Props = {
  clientId: string
  clientPhone?: string
  clientName?: string
  clientPackages: ClientPkg[]
  availablePackages: AvailablePkg[]
  orgName: string
  orgAddress?: string
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ClientPackagesSection({ clientId, clientPhone, clientName, clientPackages: initial, availablePackages, orgName, orgAddress }: Props) {
  const [packages, setPackages] = useState(initial)
  const [showAssign, setShowAssign] = useState(false)
  const [schedulingPkg, setSchedulingPkg] = useState<ClientPkg | null>(null)
  const [selectedPkgId, setSelectedPkgId] = useState(availablePackages[0]?.id ?? "")
  const [purchasedAt, setPurchasedAt] = useState(() => new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }))
  const [loading, setLoading] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const activePackages = availablePackages.filter((p) => p.active)

  async function handleRemove(clientPackageId: string) {
    if (!confirm("Remover este pacote? A transação financeira também será excluída.")) return
    setRemovingId(clientPackageId)
    const result = await removeClientPackageAction(clientPackageId)
    if (!result.success) { alert(result.error); setRemovingId(null); return }
    setPackages((prev) => prev.filter((p) => p.id !== clientPackageId))
    setRemovingId(null)
  }

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
        procedureId: pkg.procedureId ?? "",
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
    <>
    {schedulingPkg && (
      <SchedulePackageModal
        open={!!schedulingPkg}
        onClose={() => setSchedulingPkg(null)}
        clientId={clientId}
        clientPhone={clientPhone}
        clientName={clientName}
        clientPackageId={schedulingPkg.id}
        packageName={schedulingPkg.packageName}
        procedureId={schedulingPkg.procedureId}
        procedureName={schedulingPkg.procedureName}
        sessionsRemaining={schedulingPkg.sessionsRemaining}
        orgName={orgName}
        orgAddress={orgAddress}
      />
    )}
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
            <Select value={selectedPkgId} onValueChange={(v) => v && setSelectedPkgId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(() => { const p = activePackages.find((p) => p.id === selectedPkgId); return p ? `${p.name} — ${p.totalSessions} sessões · ${formatPrice(p.price)}` : "Selecione..." })()}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activePackages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — {p.totalSessions} sessões · {formatPrice(p.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                      <p className="text-xs text-muted-foreground truncate">{pkg.procedureName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full",
                      pkg.isActive
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {pkg.isActive ? `${pkg.sessionsRemaining} restante${pkg.sessionsRemaining !== 1 ? "s" : ""}` : "Concluído"}
                    </span>
                    {pkg.sessionsUsed === 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemove(pkg.id)}
                        disabled={removingId === pkg.id}
                        className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-40"
                        title="Remover pacote"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
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
                {pkg.isActive && (
                  <button
                    type="button"
                    onClick={() => setSchedulingPkg(pkg)}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4 w-fit"
                  >
                    <CalendarDays size={12} />
                    Agendar sessões
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
    </>
  )
}
