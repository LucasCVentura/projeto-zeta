import { getAdminMetricsAction } from "@/actions/admin"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata = { title: "Admin — Kira" }
export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const metrics = await getAdminMetricsAction()
  return <AdminDashboard metrics={metrics} />
}
