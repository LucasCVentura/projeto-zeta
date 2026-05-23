import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

const ADMIN_EMAIL = "lucascv8525@gmail.com"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard")
  return <>{children}</>
}
