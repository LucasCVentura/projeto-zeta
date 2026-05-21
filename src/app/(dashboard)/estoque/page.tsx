import { getSuppliesAction } from "@/actions/supplies"
import { SuppliesView } from "@/components/supplies/supplies-view"

export const metadata = { title: "Estoque — Kira" }

export default async function EstoquePage() {
  const supplies = await getSuppliesAction()
  return <SuppliesView supplies={supplies} />
}
