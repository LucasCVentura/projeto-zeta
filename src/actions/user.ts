"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { uploadToStorage } from "@/lib/storage"
import type { ActionResult } from "./auth"

export async function getCurrentUserAction() {
  const { userId } = await requireSession()
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  return user ?? null
}

export async function updateProfileAction(data: {
  name: string
  cpf?: string
  phone?: string
  whatsapp?: string
  birthDate?: string
  instagram?: string
  professionalDocument?: string
  professionalDocumentType?: string
  professionSegment?: string
  profession?: "esteticista" | "biomedico" | "outro"
  dailyAgendaWhatsapp?: boolean
}): Promise<ActionResult> {
  const { userId } = await requireSession()

  if (data.cpf) {
    const [cpfExists] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.cpf, data.cpf))
      .limit(1)

    if (cpfExists && cpfExists.id !== userId) {
      return { success: false, error: "Este CPF já está cadastrado em outra conta." }
    }
  }

  await db
    .update(users)
    .set({
      name: data.name,
      cpf: data.cpf || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      birthDate: data.birthDate || null,
      instagram: data.instagram || null,
      professionalDocument: data.professionalDocument || null,
      professionalDocumentType: data.professionalDocumentType || null,
      professionSegment: data.professionSegment || null,
      ...(data.profession ? { profession: data.profession } : {}),
      ...(data.dailyAgendaWhatsapp !== undefined ? { dailyAgendaWhatsapp: data.dailyAgendaWhatsapp } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))

  revalidatePath("/", "layout")
  return { success: true }
}

export async function uploadAvatarAction(formData: FormData): Promise<ActionResult & { imageUrl?: string }> {
  const { userId } = await requireSession()

  const file = formData.get("avatar") as File | null
  if (!file || file.size === 0) return { success: false, error: "Nenhum arquivo enviado." }
  if (file.size > 3 * 1024 * 1024) return { success: false, error: "Imagem muito grande. Máximo 3MB." }
  if (!file.type.startsWith("image/")) return { success: false, error: "Formato inválido. Envie uma imagem." }

  const ext = file.type === "image/png" ? "png" : "jpg"
  const objectName = `avatars/${userId}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const imageUrl = await uploadToStorage(objectName, buffer, file.type)
  await db.update(users).set({ image: imageUrl, updatedAt: new Date() }).where(eq(users.id, userId))

  revalidatePath("/", "layout")
  return { success: true, imageUrl }
}
