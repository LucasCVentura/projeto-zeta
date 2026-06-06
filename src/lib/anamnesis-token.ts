import { createHmac } from "crypto"

const SECRET = process.env.AUTH_SECRET ?? "fallback-secret"

export function generateAnamnesisToken(clientId: string, orgId: string): string {
  const payload = `${clientId}:${orgId}`
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 16)
  const encoded = Buffer.from(payload).toString("base64url")
  return `${encoded}.${sig}`
}

export function verifyAnamnesisToken(token: string): { clientId: string; orgId: string } | null {
  try {
    const [encoded, sig] = token.split(".")
    if (!encoded || !sig) return null
    const payload = Buffer.from(encoded, "base64url").toString()
    const expected = createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 16)
    if (sig !== expected) return null
    const [clientId, orgId] = payload.split(":")
    if (!clientId || !orgId) return null
    return { clientId, orgId }
  } catch {
    return null
  }
}
