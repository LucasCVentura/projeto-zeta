import { notFound } from "next/navigation"
import { requireSession } from "@/lib/session"
import { isFeatureEnabled } from "@/lib/feature-flags"
import { SupportChat } from "@/components/help/support-chat"

export const metadata = { title: "Chamado — Kira" }

export default async function ChamadoPage() {
  const { organizationId } = await requireSession()
  // Feature em rollout gradual, por organização — ver /admin → Novas Features.
  if (!(await isFeatureEnabled(organizationId, "support-tickets"))) notFound()

  return (
    <div className="container-page max-w-2xl py-6 h-full">
      <SupportChat />
    </div>
  )
}
