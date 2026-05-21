import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"
import { AuthSessionProvider } from "@/components/layout/session-provider"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { organizationMembers, organizations } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [membership] = await db
    .select({ organizationId: organizationMembers.organizationId })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, session.user.id), eq(organizationMembers.active, true)))
    .limit(1)

  if (membership) {
    const [org] = await db
      .select({ subscriptionStatus: organizations.subscriptionStatus, trialEndsAt: organizations.trialEndsAt })
      .from(organizations)
      .where(eq(organizations.id, membership.organizationId))
      .limit(1)

    if (org) {
      const isActive = org.subscriptionStatus === "active"
      const isTrialing =
        org.subscriptionStatus === "trialing" &&
        org.trialEndsAt != null &&
        new Date(org.trialEndsAt) > new Date()

      if (!isActive && !isTrialing) {
        redirect("/assinar")
      }
    }
  }

  return (
    <AuthSessionProvider>
      <div className="flex h-dvh overflow-hidden bg-background">
        <div className="hidden lg:flex lg:shrink-0">
          <Sidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthSessionProvider>
  )
}
