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
