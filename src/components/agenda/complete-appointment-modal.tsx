"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { completeAppointmentWithRevenueAction } from "@/actions/financial"
import { CheckCircle } from "lucide-react"

type Props = {
  open: boolean
  onClose: () => void
  appointmentId: string
  date: string
  clientName: string
  procedure?: string
  procedurePrice?: number // centavos
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function parsePriceInput(value: string): number {
  const cleaned = value.replace(/\D/g, "")
  return Number(cleaned)
}

function maskPrice(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",")
}

export function CompleteAppointmentModal({
  open,
  onClose,
  appointmentId,
  date,
  clientName,
  procedure,
  procedurePrice = 0,
}: Props) {
  const [rawValue, setRawValue] = useState(() => maskPrice(procedurePrice))
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setRawValue(maskPrice(procedurePrice ?? 0))
      setError(null)
    }
  }, [open, procedurePrice])

  function handleValueChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "")
    const cents = Number(digits)
    setRawValue(maskPrice(cents))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const cents = parsePriceInput(rawValue)
    const result = await completeAppointmentWithRevenueAction({
      appointmentId,
      amount: cents,
      description: procedure,
      date,
    })

    setIsLoading(false)
    if (!result.success) { setError(result.error); return }
    onClose()
  }

  const amountCents = parsePriceInput(rawValue)

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            Concluir atendimento
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{clientName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="procedure-label">Procedimento</Label>
            <p className="text-sm text-muted-foreground">
              {procedure ?? "Não informado"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor cobrado</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
              <Input
                id="amount"
                inputMode="numeric"
                className="pl-9"
                value={rawValue}
                onChange={handleValueChange}
              />
            </div>
            {amountCents === 0 && (
              <p className="text-xs text-muted-foreground">Valor R$ 0,00 — o atendimento será registrado sem receita.</p>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Concluir"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
