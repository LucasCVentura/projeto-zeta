"use server"

import { redirect } from "next/navigation"
import { db } from "@/db"
import { organizations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { stripe, PRICE_ID } from "@/lib/stripe"

export async function createCheckoutSessionAction() {
  const { organizationId } = await requireSession()

  const [org] = await db
    .select({ stripeCustomerId: organizations.stripeCustomerId, name: organizations.name, email: organizations.email })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  if (!org) throw new Error("Organization not found")

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

  redirect(session.url!)
}

export async function createBillingPortalAction() {
  const { organizationId } = await requireSession()

  const [org] = await db
    .select({ stripeCustomerId: organizations.stripeCustomerId })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  if (!org?.stripeCustomerId) throw new Error("No Stripe customer")

  const baseUrl = process.env.AUTH_URL ?? "http://localhost:3000"

  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${baseUrl}/configuracoes`,
  })

  redirect(session.url)
}
