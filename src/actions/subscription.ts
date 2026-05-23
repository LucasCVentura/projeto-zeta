"use server"

import { db } from "@/db"
import { organizations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { stripe, PRICE_ID } from "@/lib/stripe"

type ActionResult = { error: string } | { url: string }

export async function createCheckoutSessionAction(): Promise<ActionResult> {
  const { organizationId } = await requireSession()

  const [org] = await db
    .select({ stripeCustomerId: organizations.stripeCustomerId, name: organizations.name, email: organizations.email })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  if (!org) return { error: "Organização não encontrada." }

  let customerId = org.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      email: org.email ?? undefined,
      metadata: { organizationId },
    })
    customerId = customer.id
    await db.update(organizations).set({ stripeCustomerId: customerId }).where(eq(organizations.id, organizationId))
  }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: PRICE_ID, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?assinatura=ativa`,
    cancel_url: `${baseUrl}/assinar`,
    metadata: { organizationId },
    subscription_data: { metadata: { organizationId } },
    payment_method_types: ["card"],
    locale: "pt-BR",
  })

  if (!session.url) return { error: "Erro ao iniciar sessão de pagamento. Tente novamente." }

  return { url: session.url }
}

export async function createBillingPortalAction(): Promise<ActionResult> {
  const { organizationId } = await requireSession()

  const [org] = await db
    .select({ stripeCustomerId: organizations.stripeCustomerId })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  if (!org?.stripeCustomerId) return { error: "Nenhuma assinatura ativa encontrada." }

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${baseUrl}/configuracoes`,
  })

  if (!session.url) return { error: "Erro ao abrir portal de pagamento. Tente novamente." }

  return { url: session.url }
}
