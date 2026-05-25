"use client"

import { useState } from "react"
import {
  createSupplyAction, updateSupplyAction, deleteSupplyAction,
} from "@/actions/supplies"
import { Plus, Pencil, Trash2, AlertTriangle, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type SupplyRow = {
  id: string
  name: string
  unit: string
  costPerUnit: number
  currentStock: string
  minStock: string
  organizationId: string
  createdAt: Date
  updatedAt: Date
}

type Props = {
  supplies: SupplyRow[]
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

const UNITS = ["un", "ml", "g", "mg", "L", "kg", "cx", "fr"]

export function SuppliesView({ supplies: initial }: Props) {
  const [supplies, setSupplies] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<SupplyRow | null>(null)
  const [loading, setLoading] = useState(false)

  // form fields
  const [name, setName] = useState("")
  const [unit, setUnit] = useState("un")
  const [costRaw, setCostRaw] = useState("")
  const [stock, setStock] = useState("")
  const [minStock, setMinStock] = useState("")

  function openNew() {
    setEditing(null); setName(""); setUnit("un"); setCostRaw(""); setStock(""); setMinStock(""); setShowForm(true)
  }

  function openEdit(s: SupplyRow) {
    setEditing(s); setName(s.name); setUnit(s.unit)
    setCostRaw((s.costPerUnit / 100).toFixed(2).replace(".", ","))
    setStock(s.currentStock); setMinStock(s.minStock); setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const costPerUnit = Math.round(parseFloat(costRaw.replace(",", ".")) * 100) || 0
    const currentStock = parseFloat(stock.replace(",", ".")) || 0
    const minStockVal = parseFloat(minStock.replace(",", ".")) || 0
    const data = { name, unit, costPerUnit, currentStock, minStock: minStockVal }

    if (editing) {
      await updateSupplyAction(editing.id, data)
      setSupplies((prev) => prev.map((s) => s.id === editing.id
        ? { ...s, name, unit, costPerUnit, currentStock: String(currentStock), minStock: String(minStockVal) }
        : s
      ))
    } else {
      await createSupplyAction(data)
      setSupplies((prev) => [...prev, {
        id: crypto.randomUUID(), organizationId: "", createdAt: new Date(), updatedAt: new Date(),
        name, unit, costPerUnit, currentStock: String(currentStock), minStock: String(minStockVal),
      }])
    }
    setLoading(false); setShowForm(false); setEditing(null)
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este insumo?")) return
    await deleteSupplyAction(id)
    setSupplies((prev) => prev.filter((s) => s.id !== id))
  }

  const lowStock = supplies.filter((s) => parseFloat(s.currentStock) <= parseFloat(s.minStock) && parseFloat(s.minStock) > 0)

  return (
    <div className="container-page max-w-4xl py-8 space-y-6">
      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-1.5"><Plus size={15} /> Novo insumo</Button>
      </div>

      {/* Alertas de estoque baixo */}
      {lowStock.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle size={15} />
            <p className="text-sm font-medium">Estoque baixo</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-2.5 py-0.5 text-xs text-amber-800 dark:text-amber-300">
                {s.name}: {s.currentStock} {s.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Form novo/editar */}
      {showForm && (
        <div className="surface space-y-4">
          <h2 className="font-medium">{editing ? "Editar insumo" : "Novo insumo"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label>Nome *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Ácido hialurônico" required />
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={unit} onValueChange={(v) => v && setUnit(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{unit}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Custo por unidade (R$)</Label>
                <Input value={costRaw} onChange={(e) => setCostRaw(e.target.value)} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Estoque atual</Label>
                <Input value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Estoque mínimo (alerta)</Label>
                <Input value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditing(null) }} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={loading} className="flex-1">{loading ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de insumos */}
      {supplies.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm font-medium">Nenhum insumo cadastrado</p>
          <p className="text-xs text-muted-foreground">Adicione seus insumos para controlar o estoque.</p>
        </div>
      ) : (
        <div className="surface overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Insumo</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Estoque</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Mínimo</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-right font-medium text-muted-foreground">Custo/un</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {supplies.map((s) => {
                  const isLow = parseFloat(s.currentStock) <= parseFloat(s.minStock) && parseFloat(s.minStock) > 0
                  return (
                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isLow && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                          <div>
                            <span className={cn("font-medium", isLow && "text-amber-700 dark:text-amber-400")}>{s.name}</span>
                            <p className="sm:hidden text-xs text-muted-foreground">{formatPrice(s.costPerUnit)}/un</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{s.currentStock} {s.unit}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-right tabular-nums text-muted-foreground">{s.minStock} {s.unit}</td>
                      <td className="hidden sm:table-cell px-4 py-3 text-right tabular-nums">{formatPrice(s.costPerUnit)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(s)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(s.id)} className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
