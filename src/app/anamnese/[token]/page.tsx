"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { AnamnesisQuestion } from "@/db/schema"
import { CheckCircle2 } from "lucide-react"

type PageState = "loading" | "ready" | "saving" | "saved" | "invalid"

type TermData = {
  id: string
  title: string
  body: string
  accepted: boolean | null
}

export default function PublicAnamnesisPage() {
  const { token } = useParams<{ token: string }>()
  const [state, setState] = useState<PageState>("loading")
  const [questions, setQuestions] = useState<AnamnesisQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [orgName, setOrgName] = useState("")
  const [clientName, setClientName] = useState("")
  const [terms, setTerms] = useState<TermData[]>([])
  const [consentResponses, setConsentResponses] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch(`/api/anamnese/${token}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setState("invalid"); return }
        setQuestions(data.questions)
        setAnswers(data.answers ?? {})
        setOrgName(data.orgName)
        setClientName(data.clientName)
        const loadedTerms: TermData[] = data.terms ?? []
        setTerms(loadedTerms)
        const initial: Record<string, boolean> = {}
        for (const t of loadedTerms) {
          if (typeof t.accepted === "boolean") initial[t.id] = t.accepted
        }
        setConsentResponses(initial)
        setState("ready")
      })
      .catch(() => setState("invalid"))
  }, [token])

  function setAnswer(questionId: string, value: unknown) {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  function toggleConsent(termId: string, value: boolean) {
    setConsentResponses(prev => {
      if (prev[termId] === value) {
        const next = { ...prev }
        delete next[termId]
        return next
      }
      return { ...prev, [termId]: value }
    })
  }

  async function handleSave() {
    setState("saving")
    const res = await fetch(`/api/anamnese/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, consentResponses }),
    })
    setState(res.ok ? "saved" : "ready")
  }

  if (state === "loading") return (
    <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
      Carregando...
    </div>
  )

  if (state === "invalid") return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center space-y-2 max-w-sm">
        <p className="font-semibold">Link inválido ou expirado</p>
        <p className="text-sm text-muted-foreground">Solicite um novo link ao seu profissional.</p>
      </div>
    </div>
  )

  if (state === "saved") return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="text-center space-y-3 max-w-sm">
        <CheckCircle2 size={40} className="text-primary mx-auto" />
        <p className="font-semibold text-lg">Ficha salva com sucesso!</p>
        <p className="text-sm text-muted-foreground">
          Obrigado, {clientName}! Sua ficha foi enviada para {orgName}.
        </p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background px-5 py-10">
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <p className="text-xs text-muted-foreground">{orgName}</p>
          <h1 className="font-heading text-2xl font-semibold mt-1">Ficha de anamnese</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Olá, {clientName}! Preencha as informações abaixo antes do seu atendimento.
          </p>
        </div>

        <div className="space-y-3">
          {questions.map(q => (
            <QuestionField
              key={q.id}
              question={q}
              value={answers[q.id]}
              onChange={val => setAnswer(q.id, val)}
            />
          ))}
        </div>

        {terms.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Termos de consentimento</p>
            <p className="text-xs text-muted-foreground">Opcional — você pode enviar a ficha sem responder.</p>
            {terms.map(term => {
              const value = consentResponses[term.id]
              return (
                <div key={term.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium">{term.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{term.body}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => toggleConsent(term.id, true)}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-sm transition-colors",
                        value === true
                          ? "border-primary bg-primary/10 text-primary font-medium"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      Aceito
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleConsent(term.id, false)}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-sm transition-colors",
                        value === false
                          ? "border-red-400 bg-red-50 text-red-600 font-medium"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      Não aceito
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <Button
          onClick={handleSave}
          disabled={state === "saving"}
          className="w-full"
          size="lg"
        >
          {state === "saving" ? "Salvando..." : "Enviar ficha"}
        </Button>
      </div>
    </div>
  )
}

function QuestionField({ question, value, onChange }: {
  question: AnamnesisQuestion
  value: unknown
  onChange: (val: unknown) => void
}) {
  if (question.type === "boolean") {
    const checked = value === true || (typeof value === "object" && value !== null && (value as any).checked === true)
    const detail = typeof value === "object" && value !== null && "detail" in value
      ? (value as { detail: string }).detail : ""

    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">{question.label}</span>
          <Toggle checked={checked} onChange={v => onChange(v ? { checked: true, detail } : false)} />
        </div>
        {checked && question.placeholder && (
          <Input
            placeholder={question.placeholder}
            value={detail}
            onChange={e => onChange({ checked: true, detail: e.target.value })}
          />
        )}
      </div>
    )
  }

  if (question.type === "select") {
    const options: string[] = question.options ? JSON.parse(question.options) : []
    const selected = typeof value === "string" ? value : ""
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <span className="text-sm font-medium block">{question.label}</span>
        <div className="flex flex-wrap gap-2">
          {options.map(opt => (
            <button key={opt} type="button" onClick={() => onChange(selected === opt ? "" : opt)}
              className={cn("rounded-lg border px-3 py-1.5 text-sm transition-colors",
                selected === opt ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted-foreground"
              )}>
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
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <span className="text-sm font-medium block">{question.label}</span>
        <div className="flex flex-wrap gap-2">
          {options.map(opt => {
            const active = selected.includes(opt)
            return (
              <button key={opt} type="button"
                onClick={() => onChange(active ? selected.filter(s => s !== opt) : [...selected, opt])}
                className={cn("rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  active ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted-foreground"
                )}>
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <span className="text-sm font-medium block">{question.label}</span>
      <Input
        placeholder={question.placeholder ?? ""}
        value={typeof value === "string" ? value : ""}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  function handleTap(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onChange(!checked)
  }
  return (
    <button
      type="button"
      onTouchEnd={handleTap}
      onClick={handleTap}
      className={cn("relative h-7 w-12 shrink-0 cursor-pointer rounded-full outline-none transition-colors touch-manipulation select-none", checked ? "bg-primary" : "bg-muted")}
    >
      <span className={cn("pointer-events-none absolute top-0.5 left-0 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200", checked ? "translate-x-5.5" : "translate-x-0.5")} />
    </button>
  )
}
