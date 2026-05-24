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

      await db.update(organizations)
        .set({ subscriptionStatus: "active", stripeSubscriptionId: session.subscription as string })
        .where(eq(organizations.id, organizationId))

      try {
        const owner = await getOrgOwner(organizationId)
        if (owner?.email) {
          const { sendSubscriptionActiveEmail } = await import("@/lib/email")
          await sendSubscriptionActiveEmail(owner.email, owner.name ?? "")
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
