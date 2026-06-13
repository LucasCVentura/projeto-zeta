"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import type { AnamnesisQuestion } from "@/db/schema"
import {
  createAnamnesisQuestionAction,
  deleteAnamnesisQuestionAction,
  reorderAnamnesisQuestionsAction,
} from "@/actions/anamnesis"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Plus, Trash2, GripVertical, ArrowLeft } from "lucide-react"

const TYPE_LABELS: Record<string, string> = {
  text:        "Texto livre",
  boolean:     "Sim / Não",
  select:      "Seleção única",
  multiselect: "Múltipla escolha",
}

export function AnamnesisSettingsView({ questions: initial }: { questions: AnamnesisQuestion[] }) {
  const [questions, setQuestions] = useState(initial)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [newLabel, setNewLabel] = useState("")
  const [newType, setNewType] = useState("text")
  const [newPlaceholder, setNewPlaceholder] = useState("")
  const [newOptions, setNewOptions] = useState("")

  const dragIndex = useRef<number | null>(null)

  function handleDragStart(index: number) {
    dragIndex.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return
    const next = [...questions]
    const [moved] = next.splice(dragIndex.current, 1)
    next.splice(index, 0, moved)
    dragIndex.current = index
    setQuestions(next)
  }

  async function handleDragEnd() {
    dragIndex.current = null
    await reorderAnamnesisQuestionsAction(questions.map(q => q.id))
  }

  async function handleAdd() {
    if (!newLabel.trim()) return
    setSaving(true)
    await createAnamnesisQuestionAction({
      label: newLabel.trim(),
      type: newType,
      placeholder: newPlaceholder.trim() || null,
      options: (newType === "select" || newType === "multiselect")
        ? JSON.stringify(newOptions.split(",").map(s => s.trim()).filter(Boolean))
        : null,
    })
    setNewLabel(""); setNewType("text"); setNewPlaceholder(""); setNewOptions("")
    setOpen(false)
    setSaving(false)
    window.location.reload()
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    setQuestions(prev => prev.filter(q => q.id !== id))
    await deleteAnamnesisQuestionAction(id)
    setDeleting(null)
  }

  return (
    <div className="container-page max-w-2xl py-8 space-y-6">
      <Link href="/configuracoes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Configurações
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Ficha de anamnese</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Arraste para reordenar. As perguntas aparecem na ficha de cada cliente.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 shrink-0">
          <Plus size={15} /> Nova pergunta
        </Button>
      </div>

      <div className="space-y-2">
        {questions.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Nenhuma pergunta ainda. Clique em <strong>Nova pergunta</strong> para começar.
          </div>
        )}
        {questions.map((q, i) => (
          <div
            key={q.id}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDragEnd={handleDragEnd}
            className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 cursor-grab active:cursor-grabbing active:opacity-50 transition-opacity select-none"
          >
            <GripVertical size={16} className="text-muted-foreground/40 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{q.label}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground">{TYPE_LABELS[q.type] ?? q.type}</span>
                {q.options && (
                  <span className="text-[11px] text-muted-foreground truncate">
                    · {(JSON.parse(q.options) as string[]).join(", ")}
                  </span>
                )}
                {q.isDefault && (
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">padrão</span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDelete(q.id)}
              disabled={deleting === q.id}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova pergunta</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Pergunta</Label>
              <Input
                placeholder="Ex: Pratica atividade física regularmente?"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label>Tipo de resposta</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(TYPE_LABELS).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNewType(val)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm text-left transition-colors",
                      newType === val
                        ? "border-primary bg-primary/5 text-primary font-medium"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {newType === "text" && (
              <div className="space-y-1.5">
                <Label>Placeholder <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input
                  placeholder="Ex: Descreva aqui..."
                  value={newPlaceholder}
                  onChange={e => setNewPlaceholder(e.target.value)}
                />
              </div>
            )}

            {(newType === "select" || newType === "multiselect") && (
              <div className="space-y-1.5">
                <Label>Opções <span className="text-muted-foreground font-normal">(separadas por vírgula)</span></Label>
                <Input
                  placeholder="Ex: Sim, Não, Às vezes"
                  value={newOptions}
                  onChange={e => setNewOptions(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={!newLabel.trim() || saving}>
              {saving ? "Salvando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
