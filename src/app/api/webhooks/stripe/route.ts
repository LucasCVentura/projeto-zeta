import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import { organizations } from "@/db/schema"
import { eq } from "drizzle-orm"
import type Stripe from "stripe"

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
        .set({
          subscriptionStatus: "active",
          stripeSubscriptionId: session.subscription as string,
        })
        .where(eq(organizations.id, organizationId))
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
  }

  return NextResponse.json({ received: true })
}
