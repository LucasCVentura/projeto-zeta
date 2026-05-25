const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? ""

export function mediaUrl(url: string | null | undefined): string {
  if (!url) return ""

  if (url.startsWith("supabase://")) {
    const withoutProtocol = url.replace("supabase://", "")
    const slashIdx = withoutProtocol.indexOf("/")
    const bucket = withoutProtocol.slice(0, slashIdx)
    const objectName = withoutProtocol.slice(slashIdx + 1)
    return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${objectName}`
  }

  if (url.startsWith("https://")) return url

  return url
}
