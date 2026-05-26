import { getAdminMetricsAction, getInboundEmailsAction, getWhatsAppMessageLogsAction, getWhatsAppTemplateSettingsAction } from "@/actions/admin"
import { getAllFeedbackAction, getLatestFeedbackSummaryAction } from "@/actions/feedback"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata = { title: "Admin — Kira" }
export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const [metrics, feedbacks, feedbackSummary, inboundEmails, whatsappLogs, whatsappTemplateSettings] = await Promise.all([
    getAdminMetricsAction(),
    getAllFeedbackAction(),
    getLatestFeedbackSummaryAction(),
    getInboundEmailsAction(),
    getWhatsAppMessageLogsAction(),
    getWhatsAppTemplateSettingsAction(),
  ])

  return (
    <AdminDashboard
      metrics={metrics}
      feedbacks={feedbacks ?? []}
      feedbackSummary={feedbackSummary}
      inboundEmails={inboundEmails ?? []}
      whatsappLogs={whatsappLogs ?? []}
      whatsappTemplateSettings={whatsappTemplateSettings ?? []}
    />
  )
}
