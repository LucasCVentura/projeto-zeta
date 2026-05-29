import { getAdminMetricsAction, getInboundEmailsAction, getWhatsAppMessageLogsAction, getWhatsAppTemplateSettingsAction } from "@/actions/admin"
import { getAllFeedbackAction, getLatestFeedbackSummaryAction } from "@/actions/feedback"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata = { title: "Admin — Kira" }
export const dynamic = "force-dynamic"
export const maxDuration = 30

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

export default async function AdminPage() {
  const [metrics, feedbacks, feedbackSummary, inboundEmails, whatsappLogs, whatsappTemplateSettings] = await Promise.all([
    getAdminMetricsAction(),
    withTimeout(getAllFeedbackAction(), 8000, []),
    withTimeout(getLatestFeedbackSummaryAction(), 8000, null),
    withTimeout(getInboundEmailsAction(), 8000, []),
    withTimeout(
      getWhatsAppMessageLogsAction().catch(() => []),
      8000,
      []
    ),
    withTimeout(
      getWhatsAppTemplateSettingsAction().catch(() => ({
        bookingSummaryTemplateId: null,
        packageSummaryTemplateId: null,
        reminderConfirmationTemplateId: null,
        postVisitTemplateId: null,
      })),
      8000,
      {
        bookingSummaryTemplateId: null,
        packageSummaryTemplateId: null,
        reminderConfirmationTemplateId: null,
        postVisitTemplateId: null,
      }
    ),
  ])

  return (
    <AdminDashboard
      metrics={metrics}
      feedbacks={feedbacks ?? []}
      feedbackSummary={feedbackSummary}
      inboundEmails={inboundEmails ?? []}
      whatsappLogs={whatsappLogs ?? []}
      whatsappTemplateSettings={whatsappTemplateSettings}
    />
  )
}
