"use client"

import { useState } from "react"
import { createPackageAction, updatePackageAction, deletePackageAction } from "@/actions/packages"
import { Plus, Pencil, Trash2, Package } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type PackageRow = {
  id: string
  name: string
  description: string | null
  totalSessions: number
  price: number
  cost: number
  active: boolean
  procedureId: string
  procedureName: string
}

type Procedure = { id: string; name: string; price: number }

type Props = {
  packages: PackageRow[]
  procedures: Procedure[]
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function parsePriceCents(raw: string): number {
  return Math.round(parseFloat(raw.replace(",", ".")) * 100) || 0
}

export function PackagesView({ packages: initialPackages, procedures }: Props) {
  const [packages, setPackages] = useState(initialPackages)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<PackageRow | null>(null)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [procedureId, setProcedureId] = useState("")
  const [totalSessions, setTotalSessions] = useState(4)
  const [priceRaw, setPriceRaw] = useState("")
  const [costRaw, setCostRaw] = useState("")

  function openNew() {
    setEditing(null)
    setName("")
    setDescription("")
    setProcedureId(procedures[0]?.id ?? "")
    setTotalSessions(4)
    setPriceRaw("")
    setCostRaw("")
    setShowForm(true)
  }

  function openEdit(pkg: PackageRow) {
    setEditing(pkg)
    setName(pkg.name)
    setDescription(pkg.description ?? "")
    setProcedureId(pkg.procedureId)
    setTotalSessions(pkg.totalSessions)
    setPriceRaw((pkg.price / 100).toFixed(2).replace(".", ","))
    setCostRaw(pkg.cost > 0 ? (pkg.cost / 100).toFixed(2).replace(".", ",") : "")
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditing(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !procedureId) return
    setLoading(true)
    const price = parsePriceCents(priceRaw)
    const cost = parsePriceCents(costRaw)

    if (editing) {
      await updatePackageAction(editing.id, { name, description, totalSessions, price, cost, active: editing.active })
    } else {
      await createPackageAction({ name, description, procedureId, totalSessions, price, cost })
    }

    const proc = procedures.find((p) => p.id === procedureId)!
    if (editing) {
      setPackages((prev) => prev.map((p) =>
        p.id === editing.id ? { ...p, name, description: description || null, totalSessions, price, cost } : p
      ))
    } else {
      setPackages((prev) => [...prev, {
        id: crypto.randomUUID(), name, description: description || null,
        totalSessions, price, cost, active: true, procedureId, procedureName: proc.name,
      }])
    }
    setLoading(false)
    closeForm()
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este pacote?")) return
    await deletePackageAction(id)
    setPackages((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="container-page max-w-3xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Pacotes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Crie pacotes de sessões para oferecer aos seus clientes.</p>
        </div>
        <Button onClick={openNew} className="gap-1.5">
          <Plus size={15} /> Novo pacote
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="surface space-y-4">
          <h2 className="font-medium">{editing ? "Editar pacote" : "Novo pacote"}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome do pacote *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Pacote Bioestimulador 4 sessões" required />
              </div>

              <div className="space-y-2">
                <Label>Procedimento *</Label>
                <Select value={procedureId} onValueChange={(v) => v && setProcedureId(v)} disabled={!!editing}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {procedures.find((p) => p.id === procedureId)?.name ?? "Selecione..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {procedures.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nº de sessões *</Label>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setTotalSessions((v) => Math.max(1, v - 1))}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors text-base">−</button>
                  <span className="w-10 text-center font-medium">{totalSessions}</span>
                  <button type="button" onClick={() => setTotalSessions((v) => v + 1)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors text-base">+</button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Valor do pacote (R$) *</Label>
                <Input value={priceRaw} onChange={(e) => setPriceRaw(e.target.value)} placeholder="0,00" required />
              </div>

              <div className="space-y-2">
                <Label>Custo do pacote (R$) <span className="text-muted-foreground">(opcional)</span></Label>
                <Input value={costRaw} onChange={(e) => setCostRaw(e.target.value)} placeholder="0,00" />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Descrição <span className="text-muted-foreground">(opcional)</span></Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detalhe do pacote..." />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={closeForm} className="flex-1">Cancelar</Button>
              <Button type="submit" disabled={loading} className="flex-1">{loading ? "Salvando..." : "Salvar"}</Button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {packages.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Package size={22} className="text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Nenhum pacote criado</p>
            <p className="text-xs text-muted-foreground mt-0.5">Crie pacotes de sessões para seus procedimentos.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="surface flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Package size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{pkg.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pkg.procedureName} · {pkg.totalSessions} sessões · {formatPrice(pkg.price)}
                  {pkg.cost > 0 && (
                    <span className="text-orange-500"> · custo {formatPrice(pkg.cost)} · lucro {formatPrice(pkg.price - pkg.cost)}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => openEdit(pkg)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                  <Pencil size={14} />
                </button>
                <button onClick={() => handleDelete(pkg.id)} className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
