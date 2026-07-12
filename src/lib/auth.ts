import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import { eq } from "drizzle-orm"
import { compare } from "bcryptjs"
import { db } from "@/db"
import { users, organizations, organizationMembers } from "@/db/schema"
import { uniqueSlug } from "@/lib/slug"

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

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1)

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
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Google confirma com email_verified; o Graph API do Facebook só devolve e-mails já confirmados
      if (account?.provider === "google") {
        return profile?.email_verified === true
      }
      return true
    },
    async jwt({ token, user, account }) {
      const isOAuth = account?.type === "oauth" || account?.type === "oidc"
      if (isOAuth && user?.email) {
        // Sem adapter: resolve (ou cria) o usuário interno pelo e-mail do provedor OAuth
        const [existing] = await db
          .select({ id: users.id, image: users.image, name: users.name })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1)

        if (existing) {
          token.id = existing.id
          token.image = existing.image
        } else {
          const name = user.name ?? user.email.split("@")[0]
          const newUserId = crypto.randomUUID()
          const slug = await uniqueSlug(name, async (s) => {
            const [row] = await db
              .select({ id: organizations.id })
              .from(organizations)
              .where(eq(organizations.slug, s))
              .limit(1)
            return !!row
          })

          await db.transaction(async (tx) => {
            await tx.insert(users).values({
              id: newUserId,
              name,
              email: user.email!,
              image: user.image ?? null,
            })

            const [org] = await tx
              .insert(organizations)
              .values({
                name,
                slug,
                type: "individual",
                ownerId: newUserId,
                subscriptionStatus: "trialing",
                trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              })
              .returning({ id: organizations.id })

            await tx.insert(organizationMembers).values({
              organizationId: org.id,
              userId: newUserId,
              role: "owner",
              joinedAt: new Date(),
            })
          })

          try {
            const { sendWelcomeEmail } = await import("@/lib/email")
            await sendWelcomeEmail(user.email, name)
          } catch { /* não bloqueia o login */ }

          try {
            const { sendAdminPush } = await import("@/actions/push")
            await sendAdminPush({
              title: "🌱 Nova clínica cadastrada",
              body: `${name} — ${user.email} (${account.provider === "google" ? "Google" : "Facebook"})`,
              url: "/admin",
            })
          } catch { /* não bloqueia o login */ }

          token.id = newUserId
          token.image = user.image ?? null
        }
        return token
      }

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
