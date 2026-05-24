import { requireSession } from "@/lib/session"
import { PLAN_PRICE_BRL } from "@/lib/config"
import { db } from "@/db"
import { organizations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { stripe } from "@/lib/stripe"
import { BillingPortalButton } from "@/components/subscription/billing-portal-button"
import { CancelSubscriptionButton } from "@/components/subscription/cancel-subscription-button"
import { BoletoDisplay } from "@/components/subscription/boleto-display"
import { CheckCircle2, Clock, XCircle, CreditCard, ArrowLeft } from "lucide-react"
import Link from "next/link"

function fmt(date: number | null | undefined) {
  if (!date) return "—"
  return new Date(date * 1000).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
}

function fmtBRL(amount: number) {
  return (amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export default async function AssinaturaPage() {
  const { organizationId } = await requireSession()

  const [org] = await db
    .select({
      subscriptionStatus: organizations.subscriptionStatus,
      stripeSubscriptionId: organizations.stripeSubscriptionId,
      trialEndsAt: organizations.trialEndsAt,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  if (!org) return null

  let sub = null
  if (org.stripeSubscriptionId) {
    try {
      sub = await stripe.subscriptions.retrieve(org.stripeSubscriptionId, {
        expand: ["default_payment_method", "items.data.price"],
      })
    } catch {
      // se não encontrar, ignora
    }
  }

  // boleto: check if there's a pending invoice with boleto payment action
  let boletoDetails: {
    number: string | null
    voucherUrl: string | null
    pdfUrl: string | null
    expiresAt: number | null
    amount: number
  } | null = null

  if (sub && org.stripeSubscriptionId) {
    try {
      const latestInvoice = await stripe.invoices.list({
        subscription: org.stripeSubscriptionId,
        limit: 1,
      })
      const inv = latestInvoice.data[0]
      if (inv && inv.status === "open") {
        const cs = (inv as unknown as Record<string, { client_secret?: string }>).confirmation_secret?.client_secret
        if (cs) {
          const piId = cs.split("_secret_")[0]
          const pi = await stripe.paymentIntents.retrieve(piId)
          const boleto = pi.next_action?.boleto_display_details
          if (boleto) {
            boletoDetails = {
              number: boleto.number ?? null,
              voucherUrl: boleto.hosted_voucher_url ?? null,
              pdfUrl: boleto.pdf ?? null,
              expiresAt: boleto.expires_at ?? null,
              amount: inv.amount_due,
            }
          }
        }
      }
    } catch { /* ignora */ }
  }

  const isActive = org.subscriptionStatus === "active"
  const isTrialing = org.subscriptionStatus === "trialing"
  const isCanceled = org.subscriptionStatus === "canceled" || org.subscriptionStatus === "incomplete_expired"

  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/configuracoes" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="font-heading text-xl font-semibold">Assinatura</h2>
          <p className="text-sm text-muted-foreground">Detalhes do seu plano atual</p>
        </div>
      </div>

      {/* Status card */}
      <div className="surface space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isActive && <CheckCircle2 size={18} className="text-green-500" />}
            {isTrialing && <Clock size={18} className="text-amber-500" />}
            {isCanceled && <XCircle size={18} className="text-red-500" />}
            <span className="font-medium text-sm">
              {isActive && "Assinatura ativa"}
              {isTrialing && "Período de teste"}
              {isCanceled && "Assinatura cancelada"}
              {!isActive && !isTrialing && !isCanceled && "Sem assinatura"}
            </span>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            isActive ? "bg-green-500/10 text-green-600" :
            isTrialing ? "bg-amber-500/10 text-amber-600" :
            "bg-red-500/10 text-red-600"
          }`}>
            {isActive ? "Ativo" : isTrialing ? "Trial" : "Cancelado"}
          </span>
        </div>

        {/* Trial info */}
        {isTrialing && org.trialEndsAt && (
          <div className="rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
            Seu período de teste termina em{" "}
            <strong>
              {new Date(org.trialEndsAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}
            </strong>
            . Assine para continuar usando o Kira.
          </div>
        )}

        {/* Subscription details */}
        {sub && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Plano</span>
              <span className="font-medium">Kira Pro</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-medium">
                {fmtBRL(sub.items.data[0]?.price?.unit_amount ?? 4990)}/mês
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {sub.cancel_at_period_end ? "Acesso até" : "Próxima cobrança"}
              </span>
              <span className="font-medium">{fmt(sub.items.data[0]?.current_period_end ?? (sub as unknown as Record<string, number>).current_period_end)}</span>
            </div>
            {sub.cancel_at_period_end && (
              <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                Sua assinatura foi cancelada e expira em{" "}
                <strong>{fmt(sub.items.data[0]?.current_period_end ?? (sub as unknown as Record<string, number>).current_period_end)}</strong>.
              </div>
            )}
          </div>
        )}

        {/* Payment method */}
        {sub?.default_payment_method && typeof sub.default_payment_method !== "string" && sub.default_payment_method.card && (
          <div className="flex items-center gap-2.5 pt-1 text-sm text-muted-foreground border-t border-border">
            <CreditCard size={15} />
            <span className="capitalize">{sub.default_payment_method.card.brand}</span>
            <span>•••• {sub.default_payment_method.card.last4}</span>
            <span className="ml-auto">
              {sub.default_payment_method.card.exp_month}/{sub.default_payment_method.card.exp_year}
            </span>
          </div>
        )}
      </div>

      {/* Boleto pending payment */}
      {boletoDetails && (
        <div className="surface space-y-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600">
              Pagamento pendente
            </span>
          </div>
          <BoletoDisplay
            boletoNumber={boletoDetails.number}
            voucherUrl={boletoDetails.voucherUrl}
            pdfUrl={boletoDetails.pdfUrl}
            expiresAt={boletoDetails.expiresAt}
            amount={fmtBRL(boletoDetails.amount)}
          />
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {isTrialing && (
          <Link
            href="/assinar"
            className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {`Assinar por ${PLAN_PRICE_BRL}/mês`}
          </Link>
        )}
        {(isActive || sub) && <BillingPortalButton />}
        {isActive && !sub?.cancel_at_period_end && <CancelSubscriptionButton />}
      </div>
    </div>
  )
}
