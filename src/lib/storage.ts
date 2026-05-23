import { createClient } from "@supabase/supabase-js"

function getClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  )
}

const BUCKET = "photos"

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
