"use server"

import { hash } from "bcryptjs"
import { eq } from "drizzle-orm"
import { signIn } from "@/lib/auth"
import { db } from "@/db"
import { users, organizations, organizationMembers } from "@/db/schema"
import { uniqueSlug } from "@/lib/slug"
import { AuthError } from "next-auth"

export type ActionResult =
  | { success: true }
  | { success: false; error: string }

export async function registerAction(data: {
  name: string
  email: string
  profession: "esteticista" | "biomedico" | "outro"
  professionSegment?: string
  cpf: string
  phone: string
  whatsapp?: string
  birthDate: string
  professionalDocument?: string
  professionalDocumentType: string
  clinicName?: string
  instagram?: string
  password: string
}): Promise<ActionResult> {
  const [emailExists] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1)

  if (emailExists) {
    return { success: false, error: "Este e-mail já está em uso." }
  }

  const [cpfExists] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.cpf, data.cpf))
    .limit(1)

  if (cpfExists) {
    return { success: false, error: "Este CPF já está cadastrado." }
  }

  const hashedPassword = await hash(data.password, 12)
  const userId = crypto.randomUUID()

  const orgName = data.clinicName?.trim() || data.name
  const slug = await uniqueSlug(orgName, async (s) => {
    const [row] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, s))
      .limit(1)
    return !!row
  })

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      name: data.name,
      email: data.email,
      profession: data.profession,
      professionSegment: data.professionSegment || null,
      cpf: data.cpf,
      phone: data.phone,
      whatsapp: data.whatsapp || null,
      birthDate: data.birthDate,
      professionalDocument: data.professionalDocument || null,
      professionalDocumentType: data.professionalDocumentType,
      instagram: data.instagram ? data.instagram.replace(/^@/, "") : null,
      password: hashedPassword,
    })

    const [org] = await tx
      .insert(organizations)
      .values({
        name: orgName,
        slug,
        type: data.clinicName ? "clinic" : "individual",
        ownerId: userId,
        instagram: data.instagram ? data.instagram.replace(/^@/, "") : null,
        subscriptionStatus: "trialing",
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      })
      .returning({ id: organizations.id })

    await tx.insert(organizationMembers).values({
      organizationId: org.id,
      userId,
      role: "owner",
      joinedAt: new Date(),
    })
  })

  // E-mail de boas-vindas — fire and forget
  try {
    const { sendWelcomeEmail } = await import("@/lib/email")
    await sendWelcomeEmail(data.email, data.name)
  } catch {
    // não bloqueia o cadastro se o e-mail falhar
  }

  try {
    const { sendAdminPush } = await import("@/actions/push")
    await sendAdminPush({
      title: "🌱 Nova clínica cadastrada",
      body: `${data.name} — ${data.email}`,
      url: "/admin",
    })
  } catch { /* não bloqueia */ }

  return { success: true }
}

export async function loginAction(data: {
  email: string
  password: string
}): Promise<ActionResult> {
  try {
    await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })
    return { success: true }
  } catch (err) {
    if (err instanceof AuthError) {
      return { success: false, error: "E-mail ou senha incorretos." }
    }
    throw err
  }
}
