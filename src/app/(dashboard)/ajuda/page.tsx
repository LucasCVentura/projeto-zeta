import { requireSession } from "@/lib/session"
import { isFeatureEnabled } from "@/lib/feature-flags"
import { HelpPage } from "@/components/help/help-page"

export const metadata = { title: "Ajuda — Kira" }

export default async function Page() {
  const { organizationId } = await requireSession()
  // Feature em rollout gradual, por organização — ver /admin → Novas Features.
  const guidesEnabled = await isFeatureEnabled(organizationId, "guides")

  return <HelpPage guidesEnabled={guidesEnabled} />
}
