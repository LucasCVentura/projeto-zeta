"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { createCouponAction, cancelCouponAction } from "@/actions/coupons"
import { ClientMultiselect } from "./client-multiselect"
import { Ticket, Gift, Plus, X, Loader2, Send, QrCode } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CouponKind } from "@/db/schema"

type Procedure = { id: string; name: string; price: number }
type ClientOption = { id: string; name: string }
type CouponRow = {
  id: string
  kind: CouponKind
  discountPct: number
  quantity: number
  expiresAt: string
  procedureName: string
  pending: number
  redeemed: number
  failed: number
  total: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

const HINT_KEY = "kira:coupons-hint-dismissed"

export function CouponsView({
  procedures,
  clients,
  initialCoupons,
}: {
  procedures: Procedure[]
  clients: ClientOption[]
  initialCoupons: CouponRow[]
}) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [showHint, setShowHint] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(HINT_KEY)) setShowHint(true)
  }, [])

  function dismissHint() {
    localStorage.setItem(HINT_KEY, "1")
    setShowHint(false)
  }
  const [kind, setKind] = useState<CouponKind>("discount")
  const [procedureId, setProcedureId] = useState("")
  const [discountPct, setDiscountPct] = useState("20")
  const [quantity, setQuantity] = useState("20")
  const [expiresAt, setExpiresAt] = useState("")
  const [sendToAll, setSendToAll] = useState(false)
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  function resetForm() {
    setKind("discount")
    setProcedureId("")
    setDiscountPct("20")
    setQuantity("20")
    setExpiresAt("")
    setSendToAll(false)
    setSelectedClientIds([])
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!procedureId) { setError("Escolha um procedimento."); return }
    if (!expiresAt) { setError("Escolha uma validade."); return }

    const clientIds = kind === "gift"
      ? selectedClientIds
      : sendToAll
        ? clients.map((c) => c.id)
        : selectedClientIds

    if (clientIds.length === 0) { setError("Selecione ao menos uma cliente."); return }
    if (kind === "gift" && clientIds.length !== 1) { setError("Vale-presente é pra uma única cliente."); return }

    setIsLoading(true)
    const result = await createCouponAction({
      kind,
      procedureId,
      discountPct: Number(discountPct),
      quantity: Number(quantity),
      expiresAt,
      clientIds,
    })
    setIsLoading(false)

    if (!result.success) { setError(result.error); return }

    setSuccess(`${kind === "gift" ? "Vale-presente" : "Cupom"} criado — ${result.queued} envio${result.queued !== 1 ? "s" : ""} na fila.`)
    setShowForm(false)
    resetForm()
    setTimeout(() => setSuccess(null), 4000)
  }

  async function handleCancel(couponId: string) {
    const result = await cancelCouponAction(couponId)
    if (result.success) {
      setCoupons((prev) => prev.map((c) => (c.id === couponId ? { ...c, pending: 0 } : c)))
    }
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Dica de uso — aparece só na primeira visita */}
      {showHint && (
        <div className="relative rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <button
            onClick={dismissHint}
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
          >
            <X size={14} />
          </button>

          <p className="text-sm font-semibold text-primary">Como funcionam os cupons e vale-presentes?</p>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-sm">1</div>
              <div>
                <p className="text-sm font-medium">Crie aqui</p>
                <p className="text-xs text-muted-foreground">Escolha cupom de desconto ou vale-presente, o procedimento, validade e pra quem enviar.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Send size={15} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Cliente recebe no WhatsApp</p>
                <p className="text-xs text-muted-foreground">O envio já sai automático, com o QR code pronto pra usar.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <QrCode size={15} className="text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Resgata na finalização</p>
                <p className="text-xs text-muted-foreground">Ao concluir o atendimento, clique em &quot;Escanear cupom ou vale-presente&quot; e aponte a câmera pro QR code.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showForm ? (
        <form onSubmit={handleSubmit} className="surface space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Novo {kind === "gift" ? "vale-presente" : "cupom"}</p>
            <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setKind("discount")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-colors",
                kind === "discount" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <Ticket size={15} /> Cupom de desconto
            </button>
            <button
              type="button"
              onClick={() => setKind("gift")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-3 text-sm font-medium transition-colors",
                kind === "gift" ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              <Gift size={15} /> Vale-presente
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Procedimento</Label>
            <div className="flex flex-wrap gap-2">
              {procedures.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProcedureId(p.id)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                    procedureId === p.id ? "border-primary bg-primary/5 text-primary font-medium" : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {kind === "discount" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="discountPct" className="text-xs">% de desconto</Label>
                <Input id="discountPct" inputMode="numeric" value={discountPct} onChange={(e) => setDiscountPct(e.target.value.replace(/\D/g, ""))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity" className="text-xs">Quantidade disponível</Label>
                <Input id="quantity" inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="expiresAt" className="text-xs">Válido até</Label>
            <input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">
              {kind === "gift" ? "Enviar pra" : "Enviar pra"}
            </Label>

            {kind === "discount" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setSendToAll(true); setSelectedClientIds([]) }}
                  className={cn(
                    "flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors",
                    sendToAll ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  Todos os clientes
                </button>
                <button
                  type="button"
                  onClick={() => setSendToAll(false)}
                  className={cn(
                    "flex-1 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors",
                    !sendToAll ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  Selecionar clientes
                </button>
              </div>
            )}

            {(kind === "gift" || !sendToAll) && (
              <ClientMultiselect
                clients={clients}
                selectedIds={selectedClientIds}
                onChange={setSelectedClientIds}
                singleSelect={kind === "gift"}
              />
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <><Loader2 size={15} className="animate-spin mr-2" />Criando...</> : "Criar e enviar"}
          </Button>
        </form>
      ) : (
        <Button onClick={() => setShowForm(true)} className="w-full gap-2">
          <Plus size={15} /> Criar cupom ou vale-presente
        </Button>
      )}

      <div className="space-y-2">
        {coupons.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhum cupom criado ainda.</p>
        )}
        {coupons.map((c) => (
          <div key={c.id} className="surface space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {c.kind === "gift" ? <Gift size={14} className="text-primary shrink-0" /> : <Ticket size={14} className="text-primary shrink-0" />}
                  <p className="text-sm font-medium truncate">{c.procedureName}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {c.kind === "gift" ? "Vale-presente" : `${c.discountPct}% off`} · válido até {formatDate(c.expiresAt)}
                </p>
              </div>
              {c.pending > 0 && (
                <button
                  onClick={() => handleCancel(c.id)}
                  className="text-xs text-destructive hover:underline underline-offset-4 shrink-0"
                >
                  Cancelar
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{c.total} enviado{c.total !== 1 ? "s" : ""}</Badge>
              {c.pending > 0 && <Badge variant="secondary">{c.pending} na fila</Badge>}
              {c.redeemed > 0 && <Badge variant="default">{c.redeemed} resgatado{c.redeemed !== 1 ? "s" : ""}</Badge>}
              {c.failed > 0 && <Badge variant="destructive">{c.failed} falhou</Badge>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
