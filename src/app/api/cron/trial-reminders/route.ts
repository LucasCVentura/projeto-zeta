import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { organizations, organizationMembers, users } from "@/db/schema"
import { eq, and, between, isNotNull } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()

  // Orgs com trial expirando em exatamente 1 ou 2 dias (janela de 1h para evitar duplicatas)
  const targets = [1, 2]
  let sent = 0

  for (const daysLeft of targets) {
    const windowStart = new Date(now.getTime() + daysLeft * 24 * 60 * 60 * 1000 - 30 * 60 * 1000)
    const windowEnd = new Date(now.getTime() + daysLeft * 24 * 60 * 60 * 1000 + 30 * 60 * 1000)

    const orgs = await db
      .select({
        orgId: organizations.id,
        ownerName: users.name,
        ownerEmail: users.email,
      })
      .from(organizations)
      .innerJoin(organizationMembers, eq(organizationMembers.organizationId, organizations.id))
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(
        and(
          eq(organizations.subscriptionStatus, "trialing"),
          isNotNull(organizations.trialEndsAt),
          between(organizations.trialEndsAt!, windowStart, windowEnd),
          eq(organizationMembers.role, "owner"),
        )
      )

    const { sendTrialEndingEmail } = await import("@/lib/email")

    for (const org of orgs) {
      try {
        await sendTrialEndingEmail(org.ownerEmail, org.ownerName, daysLeft)
        sent++
      } catch {
        // log mas não bloqueia os próximos
      }
    }
  }

  return NextResponse.json({ ok: true, sent })
}
