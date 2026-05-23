"use server"

import { eq, and, gt, isNull } from "drizzle-orm"
import { db } from "@/db"
import { users, passwordResetTokens } from "@/db/schema"
import { hash } from "bcryptjs"

export type ActionResult = { success: true } | { success: false; error: string }

export async function requestPasswordResetAction(email: string): Promise<ActionResult> {
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, email.toLowerCase().trim()))
    .limit(1)

  // Always return success to avoid email enumeration
  if (!user) return { success: true }

  const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "")
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt,
  })

  try {
    const { sendResetPasswordEmail } = await import("@/lib/email")
    const result = await sendResetPasswordEmail(user.email, user.name ?? "usuário", token)
    console.log("[reset-password] Resend result:", JSON.stringify(result))
  } catch (err) {
    console.error("[reset-password] Resend error:", err)
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token))
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }

  return { success: true }
}

export async function resetPasswordAction(token: string, newPassword: string): Promise<ActionResult> {
  if (!token || newPassword.length < 6) {
    return { success: false, error: "Dados inválidos." }
  }

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt),
      )
    )
    .limit(1)

  if (!row) {
    return { success: false, error: "Link inválido ou expirado." }
  }

  const hashed = await hash(newPassword, 12)

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ password: hashed, updatedAt: new Date() })
      .where(eq(users.id, row.userId))

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, row.id))
  })

  return { success: true }
}
