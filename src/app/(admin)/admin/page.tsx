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

const TIMEOUT = 10000
const EMPTY_TEMPLATE = {
  bookingSummaryTemplateId: null,
  packageSummaryTemplateId: null,
  reminderConfirmationTemplateId: null,
  postVisitTemplateId: null,
  trialOutreachTemplateId: null,
}

export default async function AdminPage() {
  const [metrics, feedbacks, feedbackSummary, inboundEmails, whatsappLogs, whatsappTemplateSettings] = await Promise.all([
    withTimeout(getAdminMetricsAction(), TIMEOUT, {
      totalOrgs: 0, activeOrgs: 0, trialingOrgs: 0, incompleteBoletoOrgs: 0,
      cancelledOrgs: 0, newOrgsThisMonth: 0, newOrgsLastMonth: 0,
      mrr: 0, netMrr: 0, orgs: [],
    }),
    withTimeout(getAllFeedbackAction(), TIMEOUT, []),
    withTimeout(getLatestFeedbackSummaryAction(), TIMEOUT, null),
    withTimeout(getInboundEmailsAction(), TIMEOUT, []),
    withTimeout(getWhatsAppMessageLogsAction(100).catch(() => []), TIMEOUT, []),
    withTimeout(getWhatsAppTemplateSettingsAction().catch(() => EMPTY_TEMPLATE), TIMEOUT, EMPTY_TEMPLATE),
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
