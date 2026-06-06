import { getAdminMetricsAction, getWhatsAppTemplateSettingsAction } from "@/actions/admin"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata = { title: "Admin — Kira" }
export const dynamic = "force-dynamic"
export const maxDuration = 30

function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([p, new Promise<T>(r => setTimeout(() => r(fallback), ms))])
}

const EMPTY_METRICS = {
  totalOrgs: 0, activeOrgs: 0, trialingOrgs: 0, incompleteBoletoOrgs: 0,
  cancelledOrgs: 0, newOrgsThisMonth: 0, newOrgsLastMonth: 0,
  mrr: 0, netMrr: 0, orgs: [],
}
const EMPTY_TEMPLATE = {
  bookingSummaryTemplateId: null, packageSummaryTemplateId: null,
  reminderConfirmationTemplateId: null, postVisitTemplateId: null, trialOutreachTemplateId: null,
}

export default async function AdminPage() {
  const [metrics, whatsappTemplateSettings] = await Promise.all([
    withTimeout(getAdminMetricsAction(), 20000, EMPTY_METRICS),
    withTimeout(getWhatsAppTemplateSettingsAction().catch(() => EMPTY_TEMPLATE), 20000, EMPTY_TEMPLATE),
  ])

  return (
    <AdminDashboard
      metrics={metrics}
      whatsappTemplateSettings={whatsappTemplateSettings}
    />
  )
}
