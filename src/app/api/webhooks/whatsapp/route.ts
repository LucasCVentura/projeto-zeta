import { NextRequest, NextResponse } from "next/server"
import { handleWhatsAppButtonReply } from "@/actions/whatsapp"
import { logWhatsAppEvent } from "@/lib/whatsapp-logs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GupshupWebhookPayload

    const payload = body?.payload
    if (!payload) return NextResponse.json({ ok: true })

    // Eventos de status de mensagens outbound (enqueued/sent/delivered/read/failed)
    if (body.type === "message-event" && payload.id && payload.type) {
      const maybeError =
        payload.payload?.reason ??
        payload.payload?.code ??
        null
      await logWhatsAppEvent({
        messageId: payload.id,
        eventType: payload.type,
        error: maybeError ? String(maybeError) : null,
        destination: payload.destination,
        payload: body,
      })
    }

    // Botão de quick reply clicado
    if (payload.type === "button_reply" && payload.context?.id && payload.payload?.title) {
      await handleWhatsAppButtonReply(
        payload.context.id,
        payload.payload.title,
        payload.source
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}

// Gupshup envia GET para validar o webhook na configuração
export async function GET() {
  return NextResponse.json({ ok: true })
}

type GupshupWebhookPayload = {
  app?: string
  type?: string
  payload?: {
    id: string
    source: string
    destination?: string
    type: string
    payload?: {
      title?: string
      id?: string
      reason?: string
      code?: string | number
    }
    context?: {
      id: string
    }
  }
}
