const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""
const BUCKET = "photos"

export function mediaUrl(url: string | null | undefined): string {
  if (!url) return ""

  // URL pública do Supabase
  if (url.startsWith("supabase://")) {
    const objectName = url.replace(`supabase://${BUCKET}/`, "")
    return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectName}`
  }

  // URL já pública (supabase ou outra)
  if (url.startsWith("https://")) return url

  // Legacy GCS — redireciona pela API route
  if (url.startsWith("gcs://") || url.includes("storage.googleapis.com")) {
    return `/api/media?url=${encodeURIComponent(url)}`
  }

  return url
}
