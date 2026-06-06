import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { getWhatsAppTemplateSettingsAction } from "@/actions/admin"

export const metadata = { title: "Admin — Kira" }
export const dynamic = "force-dynamic"

const ADMIN_EMAIL = "lucascv8525@gmail.com"

const EMPTY_TEMPLATE = {
  bookingSummaryTemplateId: null, packageSummaryTemplateId: null,
  reminderConfirmationTemplateId: null, postVisitTemplateId: null, trialOutreachTemplateId: null,
}

export default async function AdminPage() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard")

  const whatsappTemplateSettings = await getWhatsAppTemplateSettingsAction().catch(() => EMPTY_TEMPLATE)

  return (
    <AdminDashboard
      whatsappTemplateSettings={whatsappTemplateSettings}
    />
  )
}
