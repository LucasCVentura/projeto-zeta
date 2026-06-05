"use client"

import { useState } from "react"
import type { AnamnesisQuestion } from "@/db/schema"
import {
  createAnamnesisQuestionAction,
  deleteAnamnesisQuestionAction,
  reorderAnamnesisQuestionsAction,
  updateAnamnesisQuestionAction,
} from "@/actions/anamnesis"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react"

const TYPE_LABELS: Record<string, string> = {
  text:        "Texto livre",
  boolean:     "Sim / Não",
  select:      "Seleção única",
  multiselect: "Múltipla escolha",
}

const TYPE_OPTIONS = Object.entries(TYPE_LABELS)

export function AnamnesisSettingsView({ questions: initial }: { questions: AnamnesisQuestion[] }) {
  const [questions, setQuestions] = useState(initial)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  // form de nova pergunta
  const [newLabel, setNewLabel] = useState("")
  const [newType, setNewType] = useState("text")
  const [newPlaceholder, setNewPlaceholder] = useState("")
  const [newOptions, setNewOptions] = useState("") // vírgula separada

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
    setAdding(false)
    setSaving(false)
    // Recarrega
    window.location.reload()
  }

  async function handleDelete(id: string) {
    setQuestions(prev => prev.filter(q => q.id !== id))
    await deleteAnamnesisQuestionAction(id)
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...questions]
    const target = index + dir
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]]
    setQuestions(next)
    await reorderAnamnesisQuestionsAction(next.map(q => q.id))
  }

  return (
    <div className="container-page max-w-2xl py-8 space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Ficha de anamnese</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure as perguntas que aparecem na ficha de cada cliente. As perguntas padrão já vêm preenchidas.
        </p>
      </div>

      {/* Lista de perguntas */}
      <div className="space-y-2">
        {questions.map((q, i) => (
          <QuestionRow
            key={q.id}
            question={q}
            onDelete={() => handleDelete(q.id)}
            onMoveUp={i > 0 ? () => move(i, -1) : undefined}
            onMoveDown={i < questions.length - 1 ? () => move(i, 1) : undefined}
          />
        ))}
        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma pergunta ainda. Adicione abaixo.</p>
        )}
      </div>

      {/* Form de nova pergunta */}
      {adding ? (
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-sm font-medium">Nova pergunta</p>
          <div className="space-y-3">
            <Input
              placeholder="Texto da pergunta (ex: Pratica atividade física?)"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
            />
            <select
              value={newType}
              onChange={e => setNewType(e.target.value)}
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {TYPE_OPTIONS.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            {(newType === "text") && (
              <Input
                placeholder="Placeholder (opcional)"
                value={newPlaceholder}
                onChange={e => setNewPlaceholder(e.target.value)}
              />
            )}
            {(newType === "select" || newType === "multiselect") && (
              <Input
                placeholder="Opções separadas por vírgula (ex: Sim, Não, Às vezes)"
                value={newOptions}
                onChange={e => setNewOptions(e.target.value)}
              />
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={!newLabel.trim() || saving} size="sm">
              {saving ? "Salvando..." : "Adicionar"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAdding(false)}>Cancelar</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setAdding(true)} className="w-full gap-2">
          <Plus size={14} /> Adicionar pergunta
        </Button>
      )}
    </div>
  )
}

function QuestionRow({ question, onDelete, onMoveUp, onMoveDown }: {
  question: AnamnesisQuestion
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}) {
  const options = question.options ? JSON.parse(question.options) as string[] : []

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <GripVertical size={14} className="text-muted-foreground/40 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{question.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground">{TYPE_LABELS[question.type] ?? question.type}</span>
          {options.length > 0 && (
            <span className="text-[11px] text-muted-foreground">· {options.join(", ")}</span>
          )}
          {question.isDefault && (
            <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">padrão</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={onMoveUp} disabled={!onMoveUp} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
          <ChevronUp size={14} />
        </button>
        <button onClick={onMoveDown} disabled={!onMoveDown} className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
          <ChevronDown size={14} />
        </button>
        <button onClick={onDelete} className="p-1 text-muted-foreground hover:text-destructive transition-colors ml-1">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
