import { requireSession } from "@/lib/session"
import { PLAN_PRICE_BRL } from "@/lib/config"
import { db } from "@/db"
import { organizations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { stripe } from "@/lib/stripe"
import { BillingPortalButton } from "@/components/subscription/billing-portal-button"
import { CheckCircle2, Clock, XCircle, CreditCard, ArrowLeft } from "lucide-react"
import Link from "next/link"

function fmt(date: number) {
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
              <span className="font-medium">{fmt(sub.current_period_end)}</span>
            </div>
            {sub.cancel_at_period_end && (
              <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                Sua assinatura foi cancelada e expira em{" "}
                <strong>{fmt(sub.current_period_end)}</strong>.
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
      </div>
    </div>
  )
}
