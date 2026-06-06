import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { organizations, organizationMembers, users, appointments, clients, clientPhotos } from "@/db/schema"
import { eq, count, or, gte, sql } from "drizzle-orm"

const ADMIN_EMAIL = "lucascv8525@gmail.com"

export async function GET() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalOrgsRows, activeOrgsRows, trialingOrgsRows, incompleteBoletoOrgsRows,
    cancelledOrgsRows, newOrgsThisMonthRows, newOrgsLastMonthRows,
    allOrgs, clientCounts, appointmentCounts, photoCounts, ownerMap,
  ] = await Promise.all([
    db.select({ count: count() }).from(organizations),
    db.select({ count: count() }).from(organizations).where(eq(organizations.subscriptionStatus, "active")),
    db.select({ count: count() }).from(organizations).where(or(eq(organizations.subscriptionStatus, "trialing"), eq(organizations.subscriptionStatus, "incomplete"))),
    db.select({ count: count() }).from(organizations).where(eq(organizations.subscriptionStatus, "incomplete")),
    db.select({ count: count() }).from(organizations).where(eq(organizations.subscriptionStatus, "canceled")),
    db.select({ count: count() }).from(organizations).where(gte(organizations.createdAt, startOfMonth)),
    db.select({ count: count() }).from(organizations).where(gte(organizations.createdAt, startOfLastMonth)),
    db.select({
      id: organizations.id, name: organizations.name, slug: organizations.slug,
      subscriptionStatus: organizations.subscriptionStatus,
      trialEndsAt: organizations.trialEndsAt, createdAt: organizations.createdAt,
    }).from(organizations).orderBy(sql`${organizations.createdAt} desc`),
    db.select({ orgId: clients.organizationId, count: count() }).from(clients).groupBy(clients.organizationId),
    db.select({ orgId: appointments.organizationId, count: count() }).from(appointments).groupBy(appointments.organizationId),
    db.select({ orgId: clientPhotos.organizationId, count: count() }).from(clientPhotos).groupBy(clientPhotos.organizationId),
    db.select({ orgId: organizationMembers.organizationId, email: users.email, name: users.name })
      .from(organizationMembers)
      .innerJoin(users, eq(users.id, organizationMembers.userId))
      .where(eq(organizationMembers.role, "owner")),
  ])

  const totalOrgs = totalOrgsRows[0].count
  const activeOrgs = activeOrgsRows[0].count
  const newOrgsThisMonth = newOrgsThisMonthRows[0].count
  const mrr = activeOrgs * 4990
  const netMrr = activeOrgs * (4990 - Math.round(4990 * 0.0399) - 39)
  const clientMap = Object.fromEntries(clientCounts.map(r => [r.orgId, r.count]))
  const apptMap = Object.fromEntries(appointmentCounts.map(r => [r.orgId, r.count]))
  const photoMap = Object.fromEntries(photoCounts.map(r => [r.orgId, r.count]))
  const ownerByOrg = Object.fromEntries(ownerMap.map(r => [r.orgId, { email: r.email, name: r.name }]))

  return NextResponse.json({
    totalOrgs,
    activeOrgs,
    trialingOrgs: trialingOrgsRows[0].count,
    incompleteBoletoOrgs: incompleteBoletoOrgsRows[0].count,
    cancelledOrgs: cancelledOrgsRows[0].count,
    newOrgsThisMonth,
    newOrgsLastMonth: newOrgsLastMonthRows[0].count - newOrgsThisMonth,
    mrr,
    netMrr,
    orgs: allOrgs.map(o => ({
      ...o,
      clients: clientMap[o.id] ?? 0,
      appointments: apptMap[o.id] ?? 0,
      photos: photoMap[o.id] ?? 0,
      owner: ownerByOrg[o.id] ?? null,
    })),
  })
}
