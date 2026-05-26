import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { eq, sql } from "drizzle-orm"
import { compare } from "bcryptjs"
import { db } from "@/db"
import { users } from "@/db/schema"

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,    // sessão dura 30 dias
    updateAge: 24 * 60 * 60,       // renova o token a cada 24h de uso ativo
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string
          password: string
        }

        let user: typeof users.$inferSelect | undefined
        try {
          const rows = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)
          user = rows[0]
        } catch (err) {
          try {
            const diag = await db.execute(sql<{
              dbName: string
              schemaName: string | null
              userRole: string
              usersTable: string | null
            }>`
              select
                current_database() as "dbName",
                current_schema() as "schemaName",
                current_user as "userRole",
                to_regclass('public.users')::text as "usersTable"
            `)
            console.error("[auth][db-diag]", diag[0] ?? null)
          } catch (diagErr) {
            console.error("[auth][db-diag-error]", diagErr)
          }
          throw err
        }

        if (!user || !user.password) return null

        const valid = await compare(password, user.password)
        if (!valid) return null

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.image = user.image
      }
      return token
    },
    async session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      // Sempre busca a imagem atualizada do DB para refletir uploads
      if (token.id) {
        const { db } = await import("@/db")
        const { users } = await import("@/db/schema")
        const { eq } = await import("drizzle-orm")
        const [u] = await db.select({ image: users.image, name: users.name }).from(users).where(eq(users.id, token.id as string)).limit(1)
        if (u) {
          session.user.image = u.image ?? undefined
          session.user.name = u.name
        }
      }
      return session
    },
  },
})
