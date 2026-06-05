import { getAnamnesisQuestionsAction } from "@/actions/anamnesis"
import { AnamnesisSettingsView } from "@/components/settings/anamnesis-settings-view"

export const metadata = { title: "Anamnese — Configurações" }

export default async function AnamnesisSettingsPage() {
  const questions = await getAnamnesisQuestionsAction()
  return <AnamnesisSettingsView questions={questions} />
}
