"use server"

import { db } from "@/db"
import { clientPhotos, clients, procedures } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { uploadToGCS, deleteFromGCS, gcsUrlToObjectName } from "@/lib/gcs"
import type { ActionResult } from "./auth"

export async function getClientPhotosAction(clientId: string) {
  const { organizationId } = await requireSession()

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)))
    .limit(1)

  if (!client) return []

  return db
    .select()
    .from(clientPhotos)
    .where(
      and(
        eq(clientPhotos.clientId, clientId),
        eq(clientPhotos.organizationId, organizationId)
      )
    )
    .orderBy(desc(clientPhotos.takenAt), desc(clientPhotos.createdAt))
}

export async function uploadClientPhotoAction(
  clientId: string,
  formData: FormData
): Promise<ActionResult & { photo?: { id: string; url: string } }> {
  const { organizationId } = await requireSession()

  const file = formData.get("photo") as File | null
  const procedureId = formData.get("procedureId") as string | null
  const notes = formData.get("notes") as string | null
  const takenAt = (formData.get("takenAt") as string) || new Date().toISOString().split("T")[0]

  if (!file || file.size === 0) return { success: false, error: "Nenhuma foto enviada." }
  if (file.size > 10 * 1024 * 1024) return { success: false, error: "Imagem muito grande. Máximo 10MB." }
  if (!file.type.startsWith("image/")) return { success: false, error: "Formato inválido." }

  const ext = file.type.includes("png") ? "png" : "jpg"
  const photoId = crypto.randomUUID()
  const objectName = `zeta/photos/${organizationId}/${clientId}-${photoId}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const url = await uploadToGCS(objectName, buffer, file.type)

  let procedureName: string | null = null
  if (procedureId) {
    const [proc] = await db
      .select({ name: procedures.name })
      .from(procedures)
      .where(eq(procedures.id, procedureId))
      .limit(1)
    procedureName = proc?.name ?? null
  }

  const [photo] = await db
    .insert(clientPhotos)
    .values({
      id: photoId,
      organizationId,
      clientId,
      url,
      procedureId: procedureId || null,
      procedure: procedureName,
      notes: notes || null,
      takenAt,
    })
    .returning({ id: clientPhotos.id, url: clientPhotos.url })

  revalidatePath(`/clientes/${clientId}/fotos`)
  return { success: true, photo }
}

export async function deleteClientPhotoAction(photoId: string, clientId: string): Promise<ActionResult> {
  const { organizationId } = await requireSession()

  const [photo] = await db
    .select()
    .from(clientPhotos)
    .where(
      and(
        eq(clientPhotos.id, photoId),
        eq(clientPhotos.organizationId, organizationId)
      )
    )
    .limit(1)

  if (!photo) return { success: false, error: "Foto não encontrada." }

  await deleteFromGCS(gcsUrlToObjectName(photo.url))
  await db.delete(clientPhotos).where(eq(clientPhotos.id, photoId))

  revalidatePath(`/clientes/${clientId}/fotos`)
  return { success: true }
}
