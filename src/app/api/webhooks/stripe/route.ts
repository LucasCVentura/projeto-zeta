import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import { organizations, users, organizationMembers } from "@/db/schema"
import { eq } from "drizzle-orm"
import type Stripe from "stripe"

function fmtBRL(amount: number) {
  return (amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

async function getOrgOwner(organizationId: string) {
  const [row] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .innerJoin(organizationMembers, eq(organizationMembers.userId, users.id))
    .where(eq(organizationMembers.organizationId, organizationId))
    .limit(1)
  return row ?? null
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const organizationId = session.metadata?.organizationId
      if (!organizationId) break

      const isBoleto = session.payment_status === "unpaid"

      await db.update(organizations)
        .set({
          subscriptionStatus: isBoleto ? "incomplete" : "active",
          stripeSubscriptionId: session.subscription as string,
        })
        .where(eq(organizations.id, organizationId))

      try {
        const { sendAdminPush } = await import("@/actions/push")
        const orgRow = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, organizationId)).limit(1)
        const orgName = orgRow[0]?.name ?? organizationId
        await sendAdminPush({
          title: isBoleto ? "🎉 Nova assinatura (boleto)" : "🎉 Nova assinatura",
          body: `${orgName} assinou o Kira`,
          url: "/admin",
        })
      } catch { /* não bloqueia */ }

      try {
        const owner = await getOrgOwner(organizationId)
        if (owner?.email) {
          if (isBoleto) {
            // busca os detalhes do boleto para enviar no email de boas-vindas
            const subId = session.subscription as string
            const invoices = await stripe.invoices.list({ subscription: subId, limit: 1 })
            const inv = invoices.data[0]
            const cs = inv
              ? (inv as unknown as Record<string, { client_secret?: string }>).confirmation_secret?.client_secret
              : null
            let voucherUrl = ""
            let expiresAt = "—"
            if (cs) {
              const pi = await stripe.paymentIntents.retrieve(cs.split("_secret_")[0])
              const boleto = pi.next_action?.boleto_display_details
              if (boleto) {
                voucherUrl = boleto.hosted_voucher_url ?? ""
                expiresAt = boleto.expires_at
                  ? new Date(boleto.expires_at * 1000).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
                  : "—"
              }
            }
            const { sendBoletoWelcomeEmail } = await import("@/lib/email")
            await sendBoletoWelcomeEmail(
              owner.email,
              owner.name ?? "",
              fmtBRL(session.amount_total ?? 4990),
              expiresAt,
              voucherUrl,
            )
          } else {
            const { sendSubscriptionActiveEmail } = await import("@/lib/email")
            await sendSubscriptionActiveEmail(owner.email, owner.name ?? "")
          }
        }
      } catch { /* não bloqueia */ }
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const organizationId = sub.metadata?.organizationId
      if (!organizationId) break

      const status = sub.status === "active" || sub.status === "trialing" ? "active" : sub.status
      await db.update(organizations)
        .set({ subscriptionStatus: status, stripeSubscriptionId: sub.id })
        .where(eq(organizations.id, organizationId))

      if (sub.status === "past_due") {
        try {
          const owner = await getOrgOwner(organizationId)
          if (owner?.email) {
            const { sendBoletoExpiredEmail } = await import("@/lib/email")
            await sendBoletoExpiredEmail(owner.email, owner.name ?? "")
          }
        } catch { /* não bloqueia */ }
      }
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const organizationId = sub.metadata?.organizationId
      if (!organizationId) break

      await db.update(organizations)
        .set({ subscriptionStatus: "canceled" })
        .where(eq(organizations.id, organizationId))
      break
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice
      const inv = invoice as unknown as Record<string, { metadata?: Record<string, string> }>
      const organizationId = (inv.subscription_details?.metadata?.organizationId
        ?? inv.subscription?.metadata?.organizationId) as string | undefined
      if (!organizationId) break

      // busca status atual para saber se era primeiro pagamento via boleto
      const [org] = await db
        .select({ subscriptionStatus: organizations.subscriptionStatus })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1)

      await db.update(organizations)
        .set({ subscriptionStatus: "active" })
        .where(eq(organizations.id, organizationId))

      // só envia email de confirmação boleto se era "incomplete" (primeiro pagamento)
      if (org?.subscriptionStatus === "incomplete") {
        try {
          const owner = await getOrgOwner(organizationId)
          if (owner?.email) {
            const { sendBoletoPaymentConfirmedEmail } = await import("@/lib/email")
            await sendBoletoPaymentConfirmedEmail(owner.email, owner.name ?? "")
          }
        } catch { /* não bloqueia */ }
      }
      break
    }

    case "invoice.payment_action_required": {
      const invoice = event.data.object as Stripe.Invoice
      const inv = invoice as unknown as Record<string, { metadata?: Record<string, string> }>
      const organizationId = (inv.subscription_details?.metadata?.organizationId
        ?? inv.subscription?.metadata?.organizationId) as string | undefined
      if (!organizationId) break

      try {
        const cs = (invoice as unknown as Record<string, { client_secret?: string }>).confirmation_secret?.client_secret
        if (!cs) break

        const piId = cs.split("_secret_")[0]
        const pi = await stripe.paymentIntents.retrieve(piId)
        const boleto = pi.next_action?.boleto_display_details
        if (!boleto) break

        const owner = await getOrgOwner(organizationId)
        if (owner?.email) {
          const amount = fmtBRL(invoice.amount_due)
          const expiresAt = boleto.expires_at
            ? new Date(boleto.expires_at * 1000).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
            : "—"
          const { sendBoletoInvoiceEmail } = await import("@/lib/email")
          await sendBoletoInvoiceEmail(
            owner.email,
            owner.name ?? "",
            amount,
            expiresAt,
            boleto.number ?? "",
            boleto.hosted_voucher_url ?? "",
          )
        }
      } catch { /* não bloqueia */ }
      break
    }
  }

  return NextResponse.json({ received: true })
}
