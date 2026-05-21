import { getSuppliesAction } from "@/actions/supplies"
import { getProceduresForBookingAction } from "@/actions/schedule"
import { SuppliesView } from "@/components/supplies/supplies-view"

export const metadata = { title: "Estoque — Zeta" }

export default async function EstoquePage() {
  const [supplies, procedures] = await Promise.all([
    getSuppliesAction(),
    getProceduresForBookingAction(),
  ])

  return <SuppliesView supplies={supplies} procedures={procedures} />
}
