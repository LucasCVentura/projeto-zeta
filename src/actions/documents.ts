"use server"

import { db } from "@/db"
import { clientDocuments, clients } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { revalidatePath } from "next/cache"
import { uploadDocumentToStorage, deleteDocumentFromStorage, documentStorageUrlToObjectName } from "@/lib/storage"
import type { ActionResult } from "./auth"

const MAX_SIZE = 20 * 1024 * 1024 // 20 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg", "image/png", "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]

export async function getClientDocumentsAction(clientId: string) {
  const { organizationId } = await requireSession()

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)))
    .limit(1)

  if (!client) return []

  return db
    .select()
    .from(clientDocuments)
    .where(
      and(
        eq(clientDocuments.clientId, clientId),
        eq(clientDocuments.organizationId, organizationId)
      )
    )
    .orderBy(desc(clientDocuments.createdAt))
}

export async function uploadClientDocumentAction(
  clientId: string,
  formData: FormData
): Promise<ActionResult & { document?: { id: string; url: string; name: string } }> {
  const { organizationId } = await requireSession()

  const file = formData.get("document") as File | null
  const name = (formData.get("name") as string | null)?.trim() || ""

  if (!file || file.size === 0) return { success: false, error: "Nenhum arquivo enviado." }
  if (file.size > MAX_SIZE) return { success: false, error: "Arquivo muito grande. Máximo 20 MB." }
  if (!ALLOWED_TYPES.includes(file.type)) return { success: false, error: "Formato não suportado. Use PDF, imagem ou documento Word." }

  const [client] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)))
    .limit(1)

  if (!client) return { success: false, error: "Cliente não encontrado." }

  const ext = file.name.split(".").pop() ?? "bin"
  const docId = crypto.randomUUID()
  const objectName = `documents/${organizationId}/${clientId}-${docId}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const url = await uploadDocumentToStorage(objectName, buffer, file.type)

  const fileName = name || file.name

  const [doc] = await db
    .insert(clientDocuments)
    .values({
      id: docId,
      organizationId,
      clientId,
      name: fileName,
      url,
      fileType: file.type,
      fileSize: String(file.size),
    })
    .returning({ id: clientDocuments.id, url: clientDocuments.url, name: clientDocuments.name })

  revalidatePath(`/clientes/${clientId}`)
  return { success: true, document: doc }
}

export async function deleteClientDocumentAction(documentId: string, clientId: string): Promise<ActionResult> {
  const { organizationId } = await requireSession()

  const [doc] = await db
    .select()
    .from(clientDocuments)
    .where(
      and(
        eq(clientDocuments.id, documentId),
        eq(clientDocuments.organizationId, organizationId)
      )
    )
    .limit(1)

  if (!doc) return { success: false, error: "Documento não encontrado." }

  await deleteDocumentFromStorage(documentStorageUrlToObjectName(doc.url))
  await db.delete(clientDocuments).where(eq(clientDocuments.id, documentId))

  revalidatePath(`/clientes/${clientId}`)
  return { success: true }
}
