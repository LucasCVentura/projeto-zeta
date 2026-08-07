export function mediaUrl(url: string | null | undefined): string {
  if (!url) return ""

  // Buckets são privados — servidos por /api/media, que checa posse antes de
  // devolver o arquivo (ver src/app/api/media/[bucket]/[...path]/route.ts).
  if (url.startsWith("supabase://")) {
    const withoutProtocol = url.replace("supabase://", "")
    const slashIdx = withoutProtocol.indexOf("/")
    const bucket = withoutProtocol.slice(0, slashIdx)
    const objectName = withoutProtocol.slice(slashIdx + 1)
    return `/api/media/${bucket}/${objectName}`
  }

  if (url.startsWith("https://")) return url

  return url
}
