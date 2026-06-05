const BASE_URL = "https://api.gupshup.io/wa/api/v1"

function normalizePhone(to: string): string | null {
  const digits = to.replace(/\D/g, "")
  if (!digits || digits.length < 10) return null
  return `55${digits.replace(/^55/, "")}`
}

export async function sendWhatsApp(to: string, body: string): Promise<void> {
  const destination = normalizePhone(to)
  if (!destination) return
  if (!process.env.GUPSHUP_API_KEY || !process.env.GUPSHUP_SENDER || !process.env.GUPSHUP_APP_NAME) {
    throw new Error("Missing Gupshup env vars (GUPSHUP_API_KEY, GUPSHUP_SENDER, GUPSHUP_APP_NAME)")
  }

  const params = new URLSearchParams({
    channel: "whatsapp",
    source: process.env.GUPSHUP_SENDER!,
    destination,
    message: JSON.stringify({ type: "text", text: body }),
    "src.name": process.env.GUPSHUP_APP_NAME!,
  })

  const res = await fetch(`${BASE_URL}/msg`, {
    method: "POST",
    headers: { apikey: process.env.GUPSHUP_API_KEY!, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })

  if (!res.ok) throw new Error(`Gupshup error ${res.status}: ${await res.text()}`)
}

export async function sendWhatsAppQuickReply(
  to: string,
  text: string,
  options: string[]
): Promise<void> {
  const destination = normalizePhone(to)
  if (!destination) return
  if (!process.env.GUPSHUP_API_KEY || !process.env.GUPSHUP_SENDER || !process.env.GUPSHUP_APP_NAME) {
    throw new Error("Missing Gupshup env vars")
  }

  const message = JSON.stringify({
    type: "quick_reply",
    msgid: `qr_${Date.now()}`,
    content: { type: "text", text },
    options: options.map((title) => ({ type: "text", title, postbackText: title })),
  })

  const params = new URLSearchParams({
    channel: "whatsapp",
    source: process.env.GUPSHUP_SENDER!,
    destination,
    message,
    "src.name": process.env.GUPSHUP_APP_NAME!,
  })

  const res = await fetch(`${BASE_URL}/msg`, {
    method: "POST",
    headers: { apikey: process.env.GUPSHUP_API_KEY!, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })

  if (!res.ok) throw new Error(`Gupshup quick_reply error ${res.status}: ${await res.text()}`)
}

export async function sendWhatsAppTemplate(
  to: string,
  templateId: string,
  templateParams: string[]
): Promise<{ messageId: string } | null> {
  const destination = normalizePhone(to)
  if (!destination) return null
  if (!process.env.GUPSHUP_API_KEY || !process.env.GUPSHUP_SENDER || !process.env.GUPSHUP_APP_NAME) {
    throw new Error("Missing Gupshup env vars (GUPSHUP_API_KEY, GUPSHUP_SENDER, GUPSHUP_APP_NAME)")
  }

  const params = new URLSearchParams({
    channel: "whatsapp",
    source: process.env.GUPSHUP_SENDER!,
    destination,
    "src.name": process.env.GUPSHUP_APP_NAME!,
    template: JSON.stringify({ id: templateId, params: templateParams }),
  })

  const res = await fetch(`${BASE_URL}/template/msg`, {
    method: "POST",
    headers: { apikey: process.env.GUPSHUP_API_KEY!, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })

  if (!res.ok) throw new Error(`Gupshup template error ${res.status}: ${await res.text()}`)

  const data = await res.json() as { status: string; messageId?: string }
  if (data.status === "submitted" && data.messageId) return { messageId: data.messageId }
  throw new Error(`Gupshup template not submitted (status=${data.status}, template=${templateId}, destination=${destination})`)
}
