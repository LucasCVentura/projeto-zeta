import { Suspense } from "react"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export const metadata = { title: "Admin — Kira" }
export const dynamic = "force-dynamic"

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminDashboard />
    </Suspense>
  )
}
