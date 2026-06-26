"use client"

import { useState, useEffect, useId } from "react"
import { useParams, useRouter } from "next/navigation"
import { getClientAction } from "@/actions/clients"
import { getAnamnesisAnswersAction, saveAnamnesisAnswersAction } from "@/actions/anamnesis"
import type { AnamnesisQuestion } from "@/db/schema"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function AnamnesePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [clientName, setClientName] = useState("")
  const [questions, setQuestions] = useState<AnamnesisQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const [clientResult, anamnesisResult] = await Promise.all([
        getClientAction(id),
        getAnamnesisAnswersAction(id),
      ])
      if (!clientResult) { router.replace("/clientes"); return }
      setClientName(clientResult.client.name)
      setQuestions(anamnesisResult.questions)
      setAnswers(anamnesisResult.answers)
      setLoading(false)
    }
    load()
  }, [id, router])

  function setAnswer(questionId: string, value: unknown) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await saveAnamnesisAnswersAction(id, answers)
      router.push(`/clientes/${id}`)
    } catch {
      setError("Erro ao salvar. Tente novamente.")
      setSaving(false)
    }
  }

  if (loading) return <div className="container-page py-12 text-center text-sm text-muted-foreground">Carregando...</div>

  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <Link href={`/clientes/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> {clientName}
      </Link>

      <div>
        <h2 className="font-heading text-xl font-semibold">Ficha de anamnese</h2>
        <p className="text-sm text-muted-foreground mt-1">Informações de saúde e histórico estético.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-3">
        {questions.map(q => (
          <QuestionField
            key={q.id}
            question={q}
            value={answers[q.id]}
            onChange={(val) => setAnswer(q.id, val)}
          />
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Salvando..." : "Salvar ficha"}
      </Button>
    </div>
  )
}

function QuestionField({ question, value, onChange }: {
  question: AnamnesisQuestion
  value: unknown
  onChange: (val: unknown) => void
}) {
  if (question.type === "boolean") {
    const checked = value === true
    const detail = typeof value === "object" && value !== null && "detail" in value
      ? (value as { detail: string }).detail
      : ""

    return (
      <div className="surface space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">{question.label}</span>
          <Toggle
            checked={checked}
            onChange={(v) => onChange(v ? { checked: true, detail } : false)}
          />
        </div>
        {checked && question.placeholder && (
          <Input
            placeholder={question.placeholder}
            value={detail}
            onChange={(e) => onChange({ checked: true, detail: e.target.value })}
          />
        )}
      </div>
    )
  }

  if (question.type === "select") {
    const options: string[] = question.options ? JSON.parse(question.options) : []
    const selected = typeof value === "string" ? value : ""
    return (
      <div className="surface space-y-2">
        <span className="text-sm font-medium block">{question.label}</span>
        <div className="flex flex-wrap gap-2">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(selected === opt ? "" : opt)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                selected === opt
                  ? "border-primary bg-primary/5 text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (question.type === "multiselect") {
    const options: string[] = question.options ? JSON.parse(question.options) : []
    const selected: string[] = Array.isArray(value) ? value : []
    return (
      <div className="surface space-y-2">
        <span className="text-sm font-medium block">{question.label}</span>
        <div className="flex flex-wrap gap-2">
          {options.map(opt => {
            const active = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // text (default)
  return (
    <div className="surface space-y-2">
      <span className="text-sm font-medium block">{question.label}</span>
      <Input
        placeholder={question.placeholder ?? ""}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <label htmlFor={id} className="cursor-pointer shrink-0">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      <div className={cn("relative h-7 w-12 rounded-full transition-colors select-none", checked ? "bg-primary" : "bg-muted")}>
        <span className={cn("pointer-events-none absolute top-0.5 left-0 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200", checked ? "translate-x-5.5" : "translate-x-0.5")} />
      </div>
    </label>
  )
}
