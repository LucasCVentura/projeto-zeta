import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireSession } from "@/lib/session"
import { downloadFromStorage } from "@/lib/storage"

const ADMIN_EMAIL = "lucascv8525@gmail.com"
const ALLOWED_BUCKETS = new Set(["photos", "documents", "support"])

// Buckets do Supabase Storage são privados. Toda foto/documento/print de
// cliente passa por aqui, que baixa com a service key e só devolve se o
// requisitante for dono do recurso (mesma organizationId no path) ou admin —
// nunca por saber a URL sozinha.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bucket: string; path: string[] }> }
) {
  const { bucket, path } = await params

  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  const objectName = path.join("/")

  // avatars/{userId}.ext — qualquer pessoa logada pode ver (foto de perfil,
  // baixa sensibilidade, aparece pra colegas de org e no admin).
  const isAvatar = bucket === "photos" && objectName.startsWith("avatars/")

  if (isAvatar) {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  } else {
    const session = await auth()
    const isAdmin = session?.user?.email === ADMIN_EMAIL
    if (!isAdmin) {
      let organizationId: string
      try {
        ;({ organizationId } = await requireSession())
      } catch {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
      }
      // demais objetos seguem o padrão {organizationId}/... — a posse é a org da sessão
      const ownerOrgId = objectName.split("/")[0]
      if (ownerOrgId !== organizationId) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 })
      }
    }
  }

  const file = await downloadFromStorage(bucket, objectName)
  if (!file) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }

  return new NextResponse(file.buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  })
}
