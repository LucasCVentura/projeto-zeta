import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { sql } from "drizzle-orm"

const ADMIN_EMAIL = "lucascv8525@gmail.com"

export async function GET() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  // Uma única query com todas as agregações — 1 conexão, 1 round-trip
  const [counts] = await db.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM organizations) as total_orgs,
      (SELECT COUNT(*) FROM organizations WHERE subscription_status = 'active') as active_orgs,
      (SELECT COUNT(*) FROM organizations WHERE subscription_status IN ('trialing','incomplete')) as trialing_orgs,
      (SELECT COUNT(*) FROM organizations WHERE subscription_status = 'incomplete') as incomplete_orgs,
      (SELECT COUNT(*) FROM organizations WHERE subscription_status = 'canceled') as cancelled_orgs,
      (SELECT COUNT(*) FROM organizations WHERE created_at >= ${startOfMonth}::timestamptz) as new_this_month,
      (SELECT COUNT(*) FROM organizations WHERE created_at >= ${startOfLastMonth}::timestamptz) as new_last_month_total
  `) as any

  const [orgsRaw, clientCounts, apptCounts, photoCounts, ownerMap] = await Promise.all([
    db.execute(sql`
      SELECT id, name, slug, subscription_status, trial_ends_at, created_at
      FROM organizations ORDER BY created_at DESC
    `),
    db.execute(sql`SELECT organization_id, COUNT(*) as count FROM clients GROUP BY organization_id`),
    db.execute(sql`SELECT organization_id, COUNT(*) as count FROM appointments GROUP BY organization_id`),
    db.execute(sql`SELECT organization_id, COUNT(*) as count FROM client_photos GROUP BY organization_id`),
    db.execute(sql`
      SELECT om.organization_id, u.email, u.name
      FROM organization_members om
      JOIN users u ON u.id = om.user_id
      WHERE om.role = 'owner'
    `),
  ]) as any[]

  const totalOrgs = Number(counts.total_orgs)
  const activeOrgs = Number(counts.active_orgs)
  const newOrgsThisMonth = Number(counts.new_this_month)
  const newOrgsLastMonthTotal = Number(counts.new_last_month_total)
  const mrr = activeOrgs * 4990
  const netMrr = activeOrgs * (4990 - Math.round(4990 * 0.0399) - 39)

  const clientMap = Object.fromEntries((clientCounts as any[]).map((r: any) => [r.organization_id, Number(r.count)]))
  const apptMap = Object.fromEntries((apptCounts as any[]).map((r: any) => [r.organization_id, Number(r.count)]))
  const photoMap = Object.fromEntries((photoCounts as any[]).map((r: any) => [r.organization_id, Number(r.count)]))
  const ownerByOrg = Object.fromEntries((ownerMap as any[]).map((r: any) => [r.organization_id, { email: r.email, name: r.name }]))

  return NextResponse.json({
    totalOrgs,
    activeOrgs,
    trialingOrgs: Number(counts.trialing_orgs),
    incompleteBoletoOrgs: Number(counts.incomplete_orgs),
    cancelledOrgs: Number(counts.cancelled_orgs),
    newOrgsThisMonth,
    newOrgsLastMonth: newOrgsLastMonthTotal - newOrgsThisMonth,
    mrr,
    netMrr,
    orgs: (orgsRaw as any[]).map((o: any) => ({
      id: o.id,
      name: o.name,
      slug: o.slug,
      subscriptionStatus: o.subscription_status,
      trialEndsAt: o.trial_ends_at,
      createdAt: o.created_at,
      clients: clientMap[o.id] ?? 0,
      appointments: apptMap[o.id] ?? 0,
      photos: photoMap[o.id] ?? 0,
      owner: ownerByOrg[o.id] ?? null,
    })),
  })
}
