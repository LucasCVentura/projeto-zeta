import { getPackagesAction } from "@/actions/packages"
import { getProceduresForBookingAction } from "@/actions/schedule"
import { PackagesView } from "@/components/packages/packages-view"

export const metadata = { title: "Pacotes — Zeta" }

export default async function PacotesPage() {
  const [packages, procedures] = await Promise.all([
    getPackagesAction(),
    getProceduresForBookingAction(),
  ])

  return <PackagesView packages={packages} procedures={procedures} />
}
