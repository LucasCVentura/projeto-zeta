import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import type { Metadata } from "next"

const ADMIN_EMAIL = "lucascv8525@gmail.com"

export const metadata: Metadata = {
  manifest: "/admin-manifest.webmanifest",
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard")
  return <>{children}</>
}
