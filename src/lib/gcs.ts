import { Storage } from "@google-cloud/storage"
import { join } from "path"

function makeStorage() {
  if (process.env.GCS_KEY_JSON) {
    return new Storage({ credentials: JSON.parse(process.env.GCS_KEY_JSON) })
  }
  return new Storage({
    keyFilename: join(process.cwd(), process.env.GCS_KEY_FILE ?? "saudy-gcs.json"),
  })
}

const storage = makeStorage()

const bucket = storage.bucket(process.env.GCS_BUCKET ?? "saudy-anexos")

export async function uploadToGCS(
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const file = bucket.file(objectName)
  await file.save(buffer, {
    resumable: false,
    contentType,
    metadata: { contentType },
  })
  // Retorna a referência interna — URLs são geradas sob demanda via getSignedUrl
  return `gcs://${bucket.name}/${objectName}`
}

export async function deleteFromGCS(objectName: string): Promise<void> {
  try {
    await bucket.file(objectName).delete()
  } catch {
    // silencioso se não existir
  }
}

export async function downloadFromGCS(objectName: string): Promise<Buffer | null> {
  try {
    const [buffer] = await bucket.file(objectName).download()
    return buffer
  } catch {
    return null
  }
}

// Gera uma signed URL válida por 1 hora
export async function getSignedUrl(objectName: string): Promise<string> {
  const [url] = await bucket.file(objectName).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000, // 1 hora
  })
  return url
}

// Extrai o objectName de uma referência gcs:// ou URL pública
export function gcsUrlToObjectName(url: string): string {
  if (url.startsWith("gcs://")) {
    return url.replace(`gcs://${bucket.name}/`, "")
  }
  const prefix = `https://storage.googleapis.com/${bucket.name}/`
  if (url.startsWith(prefix)) return url.slice(prefix.length)
  return url
}

export function isGcsUrl(url: string): boolean {
  return url.startsWith("gcs://") || url.includes("storage.googleapis.com")
}
