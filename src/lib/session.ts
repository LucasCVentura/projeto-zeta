import { auth } from "@/lib/auth"
import { db } from "@/db"
import { organizationMembers, organizations } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import type { OrgRole } from "@/db/schema"

export type SessionContext = {
  userId: string
  organizationId: string
  role: OrgRole
}

// Retorna o contexto de sessão do usuário (userId + org + role)
// Lança erro se não autenticado ou sem organização
export async function requireSession(): Promise<SessionContext> {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED")
  }

  const [membership] = await db
    .select({
      organizationId: organizationMembers.organizationId,
      role: organizationMembers.role,
    })
    .from(organizationMembers)
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(
      and(
        eq(organizationMembers.userId, session.user.id),
        eq(organizationMembers.active, true)
      )
    )
    .orderBy(organizations.createdAt)
    .limit(1)

  if (!membership) {
    throw new Error("NO_ORGANIZATION")
  }

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    role: membership.role,
  }
}
