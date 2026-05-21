import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSignedUrl, gcsUrlToObjectName, isGcsUrl } from "@/lib/gcs"

// GET /api/media?url=gcs://bucket/path
// Redireciona para uma signed URL temporária do GCS
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const url = req.nextUrl.searchParams.get("url")
  if (!url || !isGcsUrl(url)) {
    return NextResponse.json({ error: "URL inválida" }, { status: 400 })
  }

  const objectName = gcsUrlToObjectName(url)
  const signedUrl = await getSignedUrl(objectName)

  // Redireciona para a signed URL (cache de 55 min no browser)
  return NextResponse.redirect(signedUrl, {
    headers: {
      "Cache-Control": "private, max-age=3300",
    },
  })
}
