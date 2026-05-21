// Converte referências gcs:// para a API route que gera signed URLs
export function mediaUrl(url: string | null | undefined): string {
  if (!url) return ""
  if (url.startsWith("gcs://") || url.includes("storage.googleapis.com")) {
    return `/api/media?url=${encodeURIComponent(url)}`
  }
  return url
}
