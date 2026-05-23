import twilio from "twilio"

let _client: ReturnType<typeof twilio> | null = null

function getClient() {
  if (!_client) {
    _client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    )
  }
  return _client
}

const FROM = process.env.TWILIO_WHATSAPP_FROM ?? "whatsapp:+14155238886"

export async function sendWhatsApp(to: string, body: string) {
  const normalized = to.replace(/\D/g, "")
  if (!normalized || normalized.length < 10) return

  const toFormatted = `whatsapp:+55${normalized.replace(/^55/, "")}`

  await getClient().messages.create({ from: FROM, to: toFormatted, body })
}
