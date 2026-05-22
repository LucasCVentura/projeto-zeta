import { Storage } from "@google-cloud/storage"
import { join } from "path"

let _bucket: ReturnType<Storage["bucket"]> | null = null

function getBucket() {
  if (_bucket) return _bucket
  let storage: Storage
  if (process.env.GCS_KEY_JSON) {
    storage = new Storage({ credentials: JSON.parse(process.env.GCS_KEY_JSON) })
  } else {
    storage = new Storage({
      keyFilename: join(process.cwd(), process.env.GCS_KEY_FILE ?? "saudy-gcs.json"),
    })
  }
  _bucket = storage.bucket(process.env.GCS_BUCKET ?? "saudy-anexos")
  return _bucket
}

export async function uploadToGCS(
  objectName: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const bucket = getBucket()
  const file = bucket.file(objectName)
  await file.save(buffer, {
    resumable: false,
    contentType,
    metadata: { contentType },
  })
  return `gcs://${bucket.name}/${objectName}`
}

export async function deleteFromGCS(objectName: string): Promise<void> {
  try {
    await getBucket().file(objectName).delete()
  } catch {
    // silencioso se não existir
  }
}

export async function downloadFromGCS(objectName: string): Promise<Buffer | null> {
  try {
    const [buffer] = await getBucket().file(objectName).download()
    return buffer
  } catch {
    return null
  }
}

export async function getSignedUrl(objectName: string): Promise<string> {
  const [url] = await getBucket().file(objectName).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  })
  return url
}

export function gcsUrlToObjectName(url: string): string {
  const bucket = getBucket()
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
