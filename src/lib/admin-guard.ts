import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

const ADMIN_EMAIL = "lucascv8525@gmail.com"

export async function requireAdmin() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) redirect("/dashboard")
}

export async function assertAdmin() {
  const session = await auth()
  if (session?.user?.email !== ADMIN_EMAIL) throw new Error("UNAUTHORIZED")
}
