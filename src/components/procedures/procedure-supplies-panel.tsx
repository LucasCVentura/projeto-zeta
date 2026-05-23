"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  getProcedureSuppliesAction,
  addProcedureSupplyAction,
  removeProcedureSupplyAction,
  getSuppliesAction,
} from "@/actions/supplies"
import { X, Plus } from "lucide-react"

type ProcedureSupply = {
  id: string
  supplyId: string
  supplyName: string
  unit: string
  quantityPerSession: string
  costPerUnit: number
}

type Supply = { id: string; name: string; unit: string }

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function ProcedureSuppliesPanel({ procedureId }: { procedureId: string }) {
  const [linked, setLinked] = useState<ProcedureSupply[]>([])
  const [supplies, setSupplies] = useState<Supply[]>([])
  const [supplyId, setSupplyId] = useState("")
  const [qty, setQty] = useState("1")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getProcedureSuppliesAction(procedureId).then((d) => setLinked(d as ProcedureSupply[]))
    getSuppliesAction().then((d) => {
      setSupplies(d as Supply[])
      if (d.length > 0) setSupplyId((d[0] as Supply).id)
    })
  }, [procedureId])

  async function handleAdd() {
    if (!supplyId || !qty) return
    setLoading(true)
    await addProcedureSupplyAction({ procedureId, supplyId, quantityPerSession: parseFloat(qty) })
    const data = await getProcedureSuppliesAction(procedureId)
    setLinked(data as ProcedureSupply[])
    setQty("1")
    setLoading(false)
  }

  async function handleRemove(id: string) {
    setLoading(true)
    await removeProcedureSupplyAction(id)
    setLinked((prev) => prev.filter((p) => p.id !== id))
    setLoading(false)
  }

  if (supplies.length === 0) return null

  return (
    <div className="col-span-2 border-t pt-3 space-y-3">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Insumos consumidos</p>

      {linked.length > 0 && (
        <div className="space-y-1.5">
          {linked.map((ps) => (
            <div key={ps.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{ps.supplyName}</p>
                <p className="text-xs text-muted-foreground">
                  {ps.quantityPerSession} {ps.unit}/sessão · custo: {formatPrice(ps.costPerUnit * parseFloat(ps.quantityPerSession))}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(ps.id)}
                disabled={loading}
                className="text-muted-foreground hover:text-destructive transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">Insumo</Label>
          <Select value={supplyId} onValueChange={(v) => v && setSupplyId(v)}>
            <SelectTrigger className="w-full h-9">
              <SelectValue>
                {supplies.find((s) => s.id === supplyId)?.name
                  ? `${supplies.find((s) => s.id === supplyId)!.name} (${supplies.find((s) => s.id === supplyId)!.unit})`
                  : "Selecione..."}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {supplies.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name} ({s.unit})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-24 space-y-1">
          <Label className="text-xs">Qtd/sessão</Label>
          <Input value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" className="h-9 text-sm" />
        </div>
        <Button type="button" size="sm" disabled={loading} onClick={handleAdd} className="h-9">
          <Plus size={14} />
        </Button>
      </div>
    </div>
  )
}
