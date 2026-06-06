import { getAdminMetricsAction, getWhatsAppTemplateSettingsAction } from "@/actions/admin"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata = { title: "Admin — Kira" }
export const dynamic = "force-dynamic"
export const maxDuration = 30

export default async function AdminPage() {
  const [metrics, whatsappTemplateSettings] = await Promise.all([
    getAdminMetricsAction(),
    getWhatsAppTemplateSettingsAction().catch(() => ({
      bookingSummaryTemplateId: null,
      packageSummaryTemplateId: null,
      reminderConfirmationTemplateId: null,
      postVisitTemplateId: null,
      trialOutreachTemplateId: null,
    })),
  ])

  return (
    <AdminDashboard
      metrics={metrics}
      whatsappTemplateSettings={whatsappTemplateSettings}
    />
  )
}
