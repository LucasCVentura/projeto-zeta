import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import { organizations, users, organizationMembers, notifications } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import type Stripe from "stripe"

async function getOrgAndOwnerByCustomerId(customerId: string) {
  const [row] = await db
    .select({
      orgId: organizations.id,
      ownerId: organizationMembers.userId,
      ownerEmail: users.email,
      ownerName: users.name,
    })
    .from(organizations)
    .innerJoin(organizationMembers, and(
      eq(organizationMembers.organizationId, organizations.id),
      eq(organizationMembers.role, "owner"),
    ))
    .innerJoin(users, eq(users.id, organizationMembers.userId))
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1)
  return row ?? null
}

async function createNotification(orgId: string, userId: string, type: string, title: string, body: string) {
  await db.insert(notifications).values({ organizationId: orgId, userId, type, title, body, href: "/configuracoes/assinatura" })
}

function fmtBRL(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function fmtDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })
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
        const [owner] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .innerJoin(organizationMembers, eq(organizationMembers.userId, users.id))
          .where(eq(organizationMembers.organizationId, organizationId))
          .limit(1)
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

    // ── Lembrete 7 dias antes da renovação (ativar em Stripe Dashboard → Webhooks)
    case "invoice.upcoming": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const owner = await getOrgAndOwnerByCustomerId(customerId)
      if (!owner) break

      const amount = fmtBRL(invoice.amount_due)
      const daysLeft = 7

      try {
        const { sendPixReminderEmail } = await import("@/lib/email")
        await Promise.all([
          sendPixReminderEmail(owner.ownerEmail, owner.ownerName ?? "", daysLeft, amount),
          createNotification(
            owner.orgId,
            owner.ownerId,
            "pix_reminder",
            "Pagamento se aproxima",
            `Sua mensalidade de ${amount} vence em ${daysLeft} dias. O QR code Pix estará disponível na data de vencimento.`,
          ),
        ])
      } catch { /* não bloqueia */ }
      break
    }

    // ── QR code Pix pronto para pagamento
    case "invoice.payment_action_required": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const owner = await getOrgAndOwnerByCustomerId(customerId)
      if (!owner) break

      const amount = fmtBRL(invoice.amount_due)

      // extrair data de expiração do Pix via payment intent
      let expiresAt = "em breve"
      try {
        const clientSecret = invoice.confirmation_secret?.client_secret
        const piId = clientSecret?.split("_secret_")[0]
        if (piId?.startsWith("pi_")) {
          const pi = await stripe.paymentIntents.retrieve(piId)
          const exp = pi.next_action?.pix_display_qr_code?.expires_at
          if (exp) expiresAt = fmtDate(exp)
        }
      } catch { /* usa fallback */ }

      try {
        const { sendPixInvoiceEmail } = await import("@/lib/email")
        await Promise.all([
          sendPixInvoiceEmail(owner.ownerEmail, owner.ownerName ?? "", amount, expiresAt),
          createNotification(
            owner.orgId,
            owner.ownerId,
            "pix_invoice_ready",
            "QR code Pix disponível",
            `Seu QR code de ${amount} está pronto. Acesse Configurações → Assinatura para pagar. Válido até ${expiresAt}.`,
          ),
        ])
      } catch { /* não bloqueia */ }
      break
    }

    // ── QR code expirou ou falhou
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const owner = await getOrgAndOwnerByCustomerId(customerId)
      if (!owner) break

      const amount = fmtBRL(invoice.amount_due)

      try {
        await createNotification(
          owner.orgId,
          owner.ownerId,
          "pix_payment_failed",
          "Pagamento não realizado",
          `O QR code Pix de ${amount} expirou ou não foi pago. Acesse Configurações → Assinatura para gerar um novo.`,
        )
      } catch { /* não bloqueia */ }
      break
    }
  }

  return NextResponse.json({ received: true })
}
