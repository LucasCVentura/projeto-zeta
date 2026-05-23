import { createHmac } from "crypto"

const SECRET = process.env.AUTH_SECRET ?? "fallback-secret"

function sign(appointmentId: string, action: "confirm" | "cancel"): string {
  return createHmac("sha256", SECRET)
    .update(`${appointmentId}:${action}`)
    .digest("hex")
    .slice(0, 32)
}

export function makeAppointmentToken(appointmentId: string, action: "confirm" | "cancel"): string {
  const sig = sign(appointmentId, action)
  return Buffer.from(`${appointmentId}:${action}:${sig}`).toString("base64url")
}

export function verifyAppointmentToken(token: string): { appointmentId: string; action: "confirm" | "cancel" } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    const parts = decoded.split(":")
    if (parts.length !== 3) return null
    const [appointmentId, action, sig] = parts
    if (action !== "confirm" && action !== "cancel") return null
    const expected = sign(appointmentId, action)
    if (sig !== expected) return null
    return { appointmentId, action }
  } catch {
    return null
  }
}

// ── Batch token (para pacotes com múltiplas sessões) ──────────────────────────

function signBatch(ids: string[]): string {
  return createHmac("sha256", SECRET)
    .update(`batch:${ids.sort().join(",")}`)
    .digest("hex")
    .slice(0, 32)
}

export function makeBatchConfirmToken(appointmentIds: string[]): string {
  const sig = signBatch(appointmentIds)
  const payload = JSON.stringify({ ids: appointmentIds, sig })
  return Buffer.from(payload).toString("base64url")
}

export function verifyBatchConfirmToken(token: string): { appointmentIds: string[] } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8")
    const { ids, sig } = JSON.parse(decoded) as { ids: string[]; sig: string }
    if (!Array.isArray(ids) || ids.length === 0) return null
    const expected = signBatch(ids)
    if (sig !== expected) return null
    return { appointmentIds: ids }
  } catch {
    return null
  }
}
