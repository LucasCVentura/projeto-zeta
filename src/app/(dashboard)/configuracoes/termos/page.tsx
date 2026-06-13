import { getConsentTermsAction } from "@/actions/consent-terms"
import { ConsentTermsView } from "@/components/settings/consent-terms-view"

export const metadata = { title: "Termos — Configurações" }

export default async function ConsentTermsPage() {
  const terms = await getConsentTermsAction()
  return <ConsentTermsView terms={terms} />
}
