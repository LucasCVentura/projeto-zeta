"use client"

import { useState, useEffect } from "react"
import {
  getChangelogEntriesAction,
  createChangelogEntryAction,
  updateChangelogEntryAction,
  deleteChangelogEntryAction,
  suggestNextVersionAction,
} from "@/actions/changelog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Plus, Pencil, Trash2, X, Sparkles, Wrench, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

type ChangelogItem = { type: "new" | "improvement" | "fix"; text: string }
type Entry = { id: string; version: string; entryDate: string; items: ChangelogItem[] }

const TYPE_CONFIG = {
  new:         { label: "Novo",     icon: Sparkles, className: "bg-primary/10 text-primary" },
  improvement: { label: "Melhoria", icon: ArrowUp,  className: "bg-blue-500/10 text-blue-400" },
  fix:         { label: "Fix",      icon: Wrench,   className: "bg-amber-500/10 text-amber-400" },
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

// Exportado pra ser reaproveitado pelo fluxo "Ativar pra todas" de Novas Features,
// que abre esse mesmo form já pré-preenchido com o rascunho da feature.
export function ChangelogEntryForm({
  initialVersion,
  initialItems,
  featureFlagId,
  onCancel,
  onSaved,
}: {
  initialVersion?: string
  initialItems?: ChangelogItem[]
  featureFlagId?: string
  onCancel: () => void
  onSaved: () => void
}) {
  const [version, setVersion] = useState(initialVersion ?? "")
  const [entryDate, setEntryDate] = useState(() => new Date().toLocaleDateString("en-CA"))
  const [items, setItems] = useState<ChangelogItem[]>(initialItems?.length ? initialItems : [{ type: "new", text: "" }])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateItem(i: number, patch: Partial<ChangelogItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }
  function addItem() {
    setItems((prev) => [...prev, { type: "new", text: "" }])
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function handleSave() {
    setError(null)
    const cleanItems = items.map((it) => ({ ...it, text: it.text.trim() })).filter((it) => it.text)
    if (cleanItems.length === 0) { setError("Adicione ao menos um item com texto."); return }
    if (!version.trim()) { setError("Informe a versão."); return }

    setIsLoading(true)
    const result = await createChangelogEntryAction({ version: version.trim(), entryDate, items: cleanItems, featureFlagId })
    setIsLoading(false)
    if (!result.success) { setError(result.error); return }
    onSaved()
  }

  return (
    <div className="surface space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Nova entrada no changelog</p>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Versão</Label>
          <Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="3.6.0" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Data</Label>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Itens</Label>
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <select
              value={item.type}
              onChange={(e) => updateItem(i, { type: e.target.value as ChangelogItem["type"] })}
              className="rounded-lg border border-input bg-background px-2 py-2 text-xs outline-none focus:border-primary shrink-0"
            >
              <option value="new">Novo</option>
              <option value="improvement">Melhoria</option>
              <option value="fix">Fix</option>
            </select>
            <textarea
              value={item.text}
              onChange={(e) => updateItem(i, { text: e.target.value })}
              rows={2}
              placeholder="Descrição da novidade, no tom que a cliente vai ler..."
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
            />
            {items.length > 1 && (
              <button onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive shrink-0 mt-2">
                <X size={14} />
              </button>
            )}
          </div>
        ))}
        <button onClick={addItem} className="flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4">
          <Plus size={12} /> Adicionar item
        </button>
      </div>

      <Button onClick={handleSave} disabled={isLoading} className="w-full">
        {isLoading ? "Salvando..." : "Publicar"}
      </Button>
    </div>
  )
}

export function ChangelogManager() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Entry | null>(null)
  const [suggestedVersion, setSuggestedVersion] = useState("")

  async function load() {
    setLoading(true)
    const [rows, next] = await Promise.all([getChangelogEntriesAction(), suggestNextVersionAction()])
    setEntries(rows)
    setSuggestedVersion(next)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete() {
    if (!pendingDelete) return
    await deleteChangelogEntryAction(pendingDelete.id)
    setPendingDelete(null)
    load()
  }

  if (loading) return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>

  return (
    <div className="max-w-2xl space-y-5">
      <p className="text-sm text-muted-foreground">
        "O que há de novo" pro usuário final. Publicar aqui é imediato — sem precisar de deploy.
      </p>

      {showForm ? (
        <ChangelogEntryForm
          initialVersion={suggestedVersion}
          onCancel={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      ) : (
        <Button onClick={() => setShowForm(true)} className="w-full gap-2">
          <Plus size={15} /> Nova entrada
        </Button>
      )}

      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={entry.id} className="surface space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-xs font-bold px-2.5 py-1 rounded-full border",
                  i === 0 ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border"
                )}>
                  v{entry.version}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(entry.entryDate)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditingEntry(entry)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil size={13} />
                </button>
                <button onClick={() => setPendingDelete(entry)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
            <ul className="space-y-1.5">
              {entry.items.map((item, j) => {
                const cfg = TYPE_CONFIG[item.type]
                const Icon = cfg.icon
                return (
                  <li key={j} className="flex items-start gap-2">
                    <span className={cn("mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px]", cfg.className)}>
                      <Icon size={11} />
                    </span>
                    <span className="text-sm text-foreground/90 leading-snug">{item.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Excluir entrada do changelog?"
        description={`A versão ${pendingDelete?.version} vai sumir do "O que há de novo" de todo mundo.`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />

      {editingEntry && (
        <EditEntryDialog entry={editingEntry} onCancel={() => setEditingEntry(null)} onSaved={() => { setEditingEntry(null); load() }} />
      )}
    </div>
  )
}

function EditEntryDialog({ entry, onCancel, onSaved }: { entry: Entry; onCancel: () => void; onSaved: () => void }) {
  const [version, setVersion] = useState(entry.version)
  const [entryDate, setEntryDate] = useState(entry.entryDate)
  const [items, setItems] = useState<ChangelogItem[]>(entry.items)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateItem(i: number, patch: Partial<ChangelogItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)))
  }

  async function handleSave() {
    setError(null)
    const cleanItems = items.map((it) => ({ ...it, text: it.text.trim() })).filter((it) => it.text)
    if (cleanItems.length === 0) { setError("Adicione ao menos um item com texto."); return }
    setIsLoading(true)
    const result = await updateChangelogEntryAction(entry.id, { version: version.trim(), entryDate, items: cleanItems })
    setIsLoading(false)
    if (!result.success) { setError(result.error); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Editar v{entry.version}</p>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
        </div>
        {error && <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Versão</Label>
            <Input value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Data</Label>
            <input type="date" value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <select value={item.type} onChange={(e) => updateItem(i, { type: e.target.value as ChangelogItem["type"] })} className="rounded-lg border border-input bg-background px-2 py-2 text-xs outline-none shrink-0">
                <option value="new">Novo</option>
                <option value="improvement">Melhoria</option>
                <option value="fix">Fix</option>
              </select>
              <textarea value={item.text} onChange={(e) => updateItem(i, { text: e.target.value })} rows={2} className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary resize-none" />
            </div>
          ))}
        </div>
        <Button onClick={handleSave} disabled={isLoading} className="w-full">{isLoading ? "Salvando..." : "Salvar"}</Button>
      </div>
    </div>
  )
}
