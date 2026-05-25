const API_URL = "https://api.gupshup.io/wa/api/v1/msg"

export async function sendWhatsApp(to: string, body: string) {
  const normalized = to.replace(/\D/g, "")
  if (!normalized || normalized.length < 10) return

  const destination = `55${normalized.replace(/^55/, "")}`

  const params = new URLSearchParams({
    channel: "whatsapp",
    source: process.env.GUPSHUP_SENDER!,
    destination,
    message: JSON.stringify({ type: "text", text: body }),
    "src.name": process.env.GUPSHUP_APP_NAME!,
  })

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      apikey: process.env.GUPSHUP_API_KEY!,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Gupshup error ${res.status}: ${text}`)
  }
}
