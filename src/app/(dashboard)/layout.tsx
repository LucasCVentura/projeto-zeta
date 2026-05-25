import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Header } from "@/components/layout/header"
import { AuthSessionProvider } from "@/components/layout/session-provider"
import { TrialBanner } from "@/components/subscription/trial-banner"
import { NavProgress } from "@/components/layout/nav-progress"
import { SidebarProvider } from "@/components/layout/sidebar-context"
import { ThemeColor } from "@/components/layout/theme-color"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { db } from "@/db"
import { organizationMembers, organizations } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import type { OrgRole } from "@/db/schema"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const [membership] = await db
    .select({ organizationId: organizationMembers.organizationId, role: organizationMembers.role })
    .from(organizationMembers)
    .where(and(eq(organizationMembers.userId, session.user.id), eq(organizationMembers.active, true)))
    .limit(1)

  const userRole: OrgRole = membership?.role ?? "professional"

  let trialDaysLeft: number | null = null

  if (membership) {
    const [org] = await db
      .select({ subscriptionStatus: organizations.subscriptionStatus, trialEndsAt: organizations.trialEndsAt })
      .from(organizations)
      .where(eq(organizations.id, membership.organizationId))
      .limit(1)

    if (org) {
      const isActive = org.subscriptionStatus === "active"
      const trialEnd = org.trialEndsAt ? new Date(org.trialEndsAt) : null
      const isTrialing = org.subscriptionStatus === "trialing" && trialEnd != null && trialEnd > new Date()
      const isIncomplete = org.subscriptionStatus === "incomplete"
      const trialStillValid = trialEnd != null && trialEnd > new Date()

      if (!isActive && !isTrialing && !isIncomplete) {
        const motivo = org.subscriptionStatus === "trialing" ? "trial-expirado" : "sem-assinatura"
        redirect(`/assinar?motivo=${motivo}`)
      }

      // boleto gerado + trial vencido → só assinatura acessível
      if (isIncomplete && !trialStillValid) {
        const headersList = await headers()
        const pathname = headersList.get("x-pathname") ?? ""
        if (!pathname.startsWith("/configuracoes/assinatura")) {
          redirect("/configuracoes/assinatura")
        }
      }

      // boleto gerado + ainda no trial → acesso normal, mostra banner de trial
      if (isTrialing && trialEnd) {
        trialDaysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      } else if (isIncomplete && trialStillValid && trialEnd) {
        trialDaysLeft = Math.ceil((trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }
    }
  }

  return (
    <AuthSessionProvider>
      <SidebarProvider>
      <ThemeColor />
      <NavProgress />
      <div className="flex h-dvh overflow-hidden bg-background">
        <div className="hidden lg:flex lg:shrink-0">
          <Sidebar role={userRole} />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          {trialDaysLeft !== null && <TrialBanner daysLeft={trialDaysLeft} />}
          <Header />
          <main className="flex-1 overflow-y-auto pb-16 lg:pb-0">
            {children}
          </main>
        </div>
        <MobileNav role={userRole} />
      </div>
      </SidebarProvider>
    </AuthSessionProvider>
  )
}
