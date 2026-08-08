import { db } from "@/db"
import { authAttempts } from "@/db/schema"
import { and, eq, gt, lt, sql } from "drizzle-orm"

type Kind = "login" | "password_reset" | "ai_faq"

const LIMITS: Record<Kind, { maxAttempts: number; windowMinutes: number }> = {
  login: { maxAttempts: 10, windowMinutes: 15 },
  password_reset: { maxAttempts: 1, windowMinutes: 1 },
  ai_faq: { maxAttempts: 10, windowMinutes: 60 },
}

// true = pode tentar. Não conta a chamada — só quem falhar de fato chama
// recordFailure, senão um usuário legítimo digitando certo de primeira
// contaria contra o próprio limite.
export async function isRateLimited(kind: Kind, identifier: string): Promise<boolean> {
  const { maxAttempts, windowMinutes } = LIMITS[kind]
  const since = new Date(Date.now() - windowMinutes * 60 * 1000)

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(authAttempts)
    .where(and(eq(authAttempts.kind, kind), eq(authAttempts.identifier, identifier), gt(authAttempts.createdAt, since)))

  return (row?.count ?? 0) >= maxAttempts
}

export async function recordFailure(kind: Kind, identifier: string): Promise<void> {
  await db.insert(authAttempts).values({ kind, identifier })

  // limpeza oportunista — 1 em 50 chamadas apaga o que passou de 1 dia,
  // sem precisar de cron dedicado só pra isso
  if (Math.random() < 0.02) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
    await db.delete(authAttempts).where(lt(authAttempts.createdAt, cutoff))
  }
}
