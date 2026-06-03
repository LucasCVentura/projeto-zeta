"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  createProcedureAction,
  updateProcedureAction,
  deleteProcedureAction,
} from "@/actions/procedures"
import { Pencil, Trash2, Plus, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Procedure } from "@/db/schema"
import { ProcedureSuppliesPanel } from "./procedure-supplies-panel"

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function maskPrice(value: string) {
  const digits = value.replace(/\D/g, "")
  const num = parseInt(digits || "0", 10) / 100
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const schema = z.object({
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  price: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function ProceduresList({ initialProcedures }: { initialProcedures: Procedure[] }) {
  const [items, setItems] = useState(initialProcedures)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [formHasReturn, setFormHasReturn] = useState(false)
  const [formReturnDays, setFormReturnDays] = useState("")

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const [formCommissionPct, setFormCommissionPct] = useState("")

  async function onCreate(data: FormData) {
    setIsLoading(true)
    const price = data.price ? parseFloat(data.price.replace(/\./g, "").replace(",", ".")) : 0
    const returnIntervalDays = formHasReturn && formReturnDays ? parseInt(formReturnDays) : null
    const commissionPct = formCommissionPct ? Math.min(100, Math.max(0, parseInt(formCommissionPct))) : 0
    const result = await createProcedureAction({ name: data.name, price, hasReturn: formHasReturn, returnIntervalDays, commissionPct })
    if (result.success) {
      const updated = await import("@/actions/procedures").then((m) => m.getProceduresAction())
      setItems(updated)
      reset()
      setFormHasReturn(false)
      setFormReturnDays("")
      setFormHasReturn(false)
      setFormReturnDays("")
      setFormCommissionPct("")
      setShowForm(false)
    }
    setIsLoading(false)
  }

  async function onDelete(id: string) {
    setIsLoading(true)
    await deleteProcedureAction(id)
    setItems((prev) => prev.filter((p) => p.id !== id))
    setIsLoading(false)
  }

  return (
    <div className="space-y-3">
      {/* Lista */}
      {items.length === 0 && !showForm ? (
        <div className="surface flex flex-col items-center gap-3 py-12 text-center">
          <p className="text-sm text-muted-foreground">Nenhum procedimento cadastrado.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((proc) => (
            <ProcedureRow
              key={proc.id}
              procedure={proc}
              isEditing={editingId === proc.id}
              onEdit={() => setEditingId(proc.id)}
              onCancelEdit={() => setEditingId(null)}
              onSave={async (data) => {
                setIsLoading(true)
                const price = data.price ? parseFloat(data.price.replace(/\./g, "").replace(",", ".")) : 0
                const returnIntervalDays = data.hasReturn && data.returnIntervalDays ? parseInt(data.returnIntervalDays) : null
                const commissionPct = data.commissionPct ? Math.min(100, Math.max(0, parseInt(data.commissionPct))) : 0
                await updateProcedureAction(proc.id, { name: data.name, price, hasReturn: data.hasReturn, returnIntervalDays, commissionPct })
                const updated = await import("@/actions/procedures").then((m) => m.getProceduresAction())
                setItems(updated)
                setEditingId(null)
                setIsLoading(false)
              }}
              onDelete={() => onDelete(proc.id)}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      {/* Formulário de novo procedimento */}
      {showForm ? (
        <form onSubmit={handleSubmit(onCreate)} className="surface space-y-4">
          <p className="text-sm font-medium">Novo procedimento</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" placeholder="Ex: Limpeza de pele" {...register("name")} />
              {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Valor (R$) <span className="text-muted-foreground font-normal">— opcional</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                <Input
                  id="price"
                  inputMode="numeric"
                  placeholder="0,00"
                  className="pl-9"
                  {...register("price")}
                  onChange={(e) => setValue("price", maskPrice(e.target.value))}
                />
              </div>
            </div>
          </div>
          <ReturnFields hasReturn={formHasReturn} returnDays={formReturnDays} onHasReturnChange={setFormHasReturn} onDaysChange={setFormReturnDays} />
          <CommissionField value={formCommissionPct} onChange={setFormCommissionPct} />
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => { setShowForm(false); reset() }}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          className="w-full gap-2 border-dashed"
          onClick={() => setShowForm(true)}
        >
          <Plus size={15} />
          Adicionar procedimento
        </Button>
      )}
    </div>
  )
}

// ── Row com edição inline ─────────────────────────────────────────────────────

function ProcedureRow({
  procedure, isEditing, onEdit, onCancelEdit, onSave, onDelete, isLoading,
}: {
  procedure: Procedure
  isEditing: boolean
  onEdit: () => void
  onCancelEdit: () => void
  onSave: (data: { name: string; price: string; hasReturn: boolean; returnIntervalDays?: string; commissionPct: string }) => void
  onDelete: () => void
  isLoading: boolean
}) {
  const { register, handleSubmit, setValue } = useForm<{ name: string; price: string }>({
    defaultValues: {
      name: procedure.name,
      price: (procedure.price / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
    },
  })
  const [hasReturn, setHasReturn] = useState(procedure.hasReturn)
  const [returnDays, setReturnDays] = useState(procedure.returnIntervalDays?.toString() ?? "")
  const [commissionPct, setCommissionPct] = useState(procedure.commissionPct > 0 ? procedure.commissionPct.toString() : "")

  if (isEditing) {
    return (
      <form
        onSubmit={handleSubmit((data) => onSave({ ...data, hasReturn, returnIntervalDays: returnDays, commissionPct }))}
        className="surface grid grid-cols-1 sm:grid-cols-2 gap-3"
      >
        <Input placeholder="Nome" {...register("name")} />
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
          <Input
            inputMode="numeric"
            className="pl-9"
            {...register("price")}
            onChange={(e) => setValue("price", maskPrice(e.target.value))}
          />
        </div>
        <div className="col-span-2">
          <ReturnFields hasReturn={hasReturn} returnDays={returnDays} onHasReturnChange={setHasReturn} onDaysChange={setReturnDays} />
        </div>
        <div className="col-span-2">
          <CommissionField value={commissionPct} onChange={setCommissionPct} />
        </div>
        <ProcedureSuppliesPanel procedureId={procedure.id} />

        <div className="col-span-2 flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancelEdit}>
            <X size={13} className="mr-1" /> Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            <Check size={13} className="mr-1" /> Salvar
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="surface flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="font-medium text-sm truncate">{procedure.name}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {procedure.hasReturn && (
            <p className="text-xs text-primary/70">
              Retorno{procedure.returnIntervalDays ? ` em ${procedure.returnIntervalDays} dias` : ""}
            </p>
          )}
          {procedure.commissionPct > 0 && (
            <p className="text-xs text-emerald-600 font-medium">{procedure.commissionPct}% comissão</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-sm font-semibold text-primary">
          {procedure.price > 0 ? formatPrice(procedure.price) : <span className="text-muted-foreground font-normal">A consultar</span>}
        </span>
        <button
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={onDelete}
          disabled={isLoading}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}

// ── Campos de retorno reutilizáveis ───────────────────────────────────────────

function ReturnFields({ hasReturn, returnDays, onHasReturnChange, onDaysChange }: {
  hasReturn: boolean
  returnDays: string
  onHasReturnChange: (v: boolean) => void
  onDaysChange: (v: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-primary"
          checked={hasReturn}
          onChange={(e) => onHasReturnChange(e.target.checked)}
        />
        <span className="text-sm">Procedimento tem retorno</span>
      </label>
      {hasReturn && (
        <div className="flex items-center gap-2 pl-6">
          <span className="text-xs text-muted-foreground">Retorno sugerido em</span>
          <Input
            type="number"
            min={1}
            max={365}
            inputMode="numeric"
            className="w-20 h-8 text-sm"
            placeholder="30"
            value={returnDays}
            onChange={(e) => onDaysChange(e.target.value)}
          />
          <span className="text-xs text-muted-foreground">dias</span>
        </div>
      )}
    </div>
  )
}

// ── Campo de comissão ─────────────────────────────────────────────────────────

function CommissionField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        Comissão do profissional <span className="text-muted-foreground font-normal">— opcional</span>
      </Label>
      <div className="flex items-center gap-2">
        <div className="relative w-28">
          <Input
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            placeholder="0"
            className="pr-8"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
        </div>
        {value && parseInt(value) > 0 && (
          <span className="text-xs text-muted-foreground">
            A cada R$ 100,00 cobrados → R$ {parseInt(value)},00 de comissão
          </span>
        )}
      </div>
    </div>
  )
}
