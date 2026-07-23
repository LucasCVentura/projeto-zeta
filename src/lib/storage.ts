import { createClient } from "@supabase/supabase-js"

function getClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

const PHOTOS_BUCKET = "photos"
const DOCUMENTS_BUCKET = "documents"

// ── photos ────────────────────────────────────────────────────────────────────

const BUCKET = PHOTOS_BUCKET

export async function uploadToStorage(
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const { error } = await getClient().storage
    .from(BUCKET)
    .upload(objectName, buffer, { contentType, upsert: true })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  return `supabase://${BUCKET}/${objectName}`
}

export async function deleteFromStorage(objectName: string): Promise<void> {
  await getClient().storage.from(BUCKET).remove([objectName])
}

export async function getPublicUrl(objectName: string): Promise<string> {
  const { data } = getClient().storage.from(BUCKET).getPublicUrl(objectName)
  return data.publicUrl
}

export function storageUrlToObjectName(url: string): string {
  if (url.startsWith("supabase://")) {
    return url.replace(`supabase://${BUCKET}/`, "")
  }
  const prefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`
  if (url.startsWith(prefix)) return url.slice(prefix.length)
  return url
}

export function isStorageUrl(url: string): boolean {
  return url.startsWith("supabase://") || url.includes("supabase.co/storage")
}

// ── documents ─────────────────────────────────────────────────────────────────

export async function uploadDocumentToStorage(
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const { error } = await getClient().storage
    .from(DOCUMENTS_BUCKET)
    .upload(objectName, buffer, { contentType, upsert: true })

  if (error) throw new Error(`Document upload failed: ${error.message}`)

  return `supabase://${DOCUMENTS_BUCKET}/${objectName}`
}

export async function deleteDocumentFromStorage(objectName: string): Promise<void> {
  await getClient().storage.from(DOCUMENTS_BUCKET).remove([objectName])
}

export function documentStorageUrlToObjectName(url: string): string {
  if (url.startsWith(`supabase://${DOCUMENTS_BUCKET}/`)) {
    return url.replace(`supabase://${DOCUMENTS_BUCKET}/`, "")
  }
  const prefix = `${process.env.SUPABASE_URL}/storage/v1/object/public/${DOCUMENTS_BUCKET}/`
  if (url.startsWith(prefix)) return url.slice(prefix.length)
  return url
}

// ── support ───────────────────────────────────────────────────────────────────
// Imagens anexadas em chamados de suporte — bucket separado de "documents"
// porque é conteúdo efêmero (print de erro), não documento legal do cliente.

const SUPPORT_BUCKET = "support"

export async function uploadSupportImageToStorage(
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const { error } = await getClient().storage
    .from(SUPPORT_BUCKET)
    .upload(objectName, buffer, { contentType, upsert: true })

  if (error) throw new Error(`Support image upload failed: ${error.message}`)

  return `supabase://${SUPPORT_BUCKET}/${objectName}`
}
