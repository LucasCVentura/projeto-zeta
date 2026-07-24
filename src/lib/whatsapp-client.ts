const BASE_URL = "https://api.gupshup.io/wa/api/v1"

function normalizePhone(to: string): string | null {
  const digits = to.replace(/\D/g, "")
  // DDD (2) + fixo (8) ou celular (9) = 10 ou 11 dígitos sem código do país.
  if (digits.length === 10 || digits.length === 11) return `55${digits}`
  // já vem com código do país (55 + DDD + número) = 12 ou 13 dígitos.
  // Decide pelo tamanho, não por bater o prefixo "55" — DDD 55 (Santa Maria/RS)
  // é real, e um replace(/^55/, "") ingênuo arrancava o DDD junto.
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) return digits
  return null
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

  const responseBody = await res.text()
  console.log("[Gupshup][quick_reply] status:", res.status, "body:", responseBody)

  if (!res.ok) throw new Error(`Gupshup quick_reply error ${res.status}: ${responseBody}`)
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

// Template com cabeçalho de mídia (imagem) — usado pra cupons/vale-presentes.
// O template precisa ter sido criado no painel do Gupshup com header do tipo
// IMAGE. A imagem do header NÃO entra em "template.params" (isso é só pros
// placeholders do corpo, {{1}}..{{N}}) — vai num campo "message" separado,
// conforme a doc oficial: https://docs.gupshup.io/reference/sending-image-template
// Botar a URL como 1º item de params (como fizemos antes) faz a Gupshup contar
// um parâmetro a mais do que o template espera e falhar com "localizable_params
// does not match".
export async function sendWhatsAppTemplateWithMedia(
  to: string,
  templateId: string,
  imageUrl: string,
  bodyParams: string[]
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
    template: JSON.stringify({ id: templateId, params: bodyParams }),
    message: JSON.stringify({ type: "image", image: { link: imageUrl } }),
  })

  const res = await fetch(`${BASE_URL}/template/msg`, {
    method: "POST",
    headers: { apikey: process.env.GUPSHUP_API_KEY!, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  })

  if (!res.ok) throw new Error(`Gupshup template (media) error ${res.status}: ${await res.text()}`)

  const data = await res.json() as { status: string; messageId?: string }
  if (data.status === "submitted" && data.messageId) return { messageId: data.messageId }
  throw new Error(`Gupshup template (media) not submitted (status=${data.status}, template=${templateId}, destination=${destination})`)
}
