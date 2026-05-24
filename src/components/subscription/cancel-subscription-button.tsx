"use client"

import { useState } from "react"
import { saveCancellationFeedbackAction, createBillingPortalAction } from "@/actions/subscription"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

const REASONS = [
  "Preço muito alto",
  "Faltam funcionalidades que preciso",
  "Encontrei uma alternativa melhor",
  "Não uso o suficiente para justificar o valor",
  "Tive problemas técnicos",
  "Outro",
]

export function CancelSubscriptionButton() {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!reason) {
      setError("Selecione um motivo antes de continuar.")
      return
    }
    setLoading(true)
    setError(null)
    await saveCancellationFeedbackAction(reason, comment)
    const result = await createBillingPortalAction()
    if ("error" in result) {
      setError(result.error)
      setLoading(false)
      return
    }
    window.location.href = result.url
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg py-2 text-sm text-muted-foreground hover:text-destructive transition-colors"
      >
        Cancelar assinatura
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Que pena que você vai embora</DialogTitle>
            <DialogDescription>
              Antes de cancelar, nos conta o que aconteceu? Seu feedback nos ajuda a melhorar o Kira.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Qual o principal motivo?</p>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{r}</span>
                </label>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Quer adicionar mais algum detalhe? <span className="normal-case font-normal">(opcional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Pode falar à vontade..."
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>

            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 disabled:opacity-50 transition-colors"
            >
              {loading ? "Redirecionando..." : "Continuar para cancelamento"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
