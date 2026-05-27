import { NextRequest, NextResponse } from "next/server"
import { handleWhatsAppButtonReply, handleWhatsAppReplyByPhone } from "@/actions/whatsapp"
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

    // Botão de quick reply clicado.
    // Gupshup pode enviar o ID da mensagem original em context.gsId (id Gupshup)
    // ou context.id (id WhatsApp). Nosso pending usa messageId da Gupshup.
    const replyType = (payload.type || "").toLowerCase()
    const contextMessageId = payload.context?.gsId ?? payload.context?.id ?? null
    const buttonTitle =
      payload.payload?.title ??
      payload.payload?.text ??
      payload.payload?.postbackText ??
      null

    if ((replyType === "button_reply" || replyType === "quick_reply") && contextMessageId && buttonTitle) {
      console.log("[WhatsApp][Webhook] button reply received", {
        replyType,
        contextMessageId,
        source: payload.source,
        title: buttonTitle,
      })
      await handleWhatsAppButtonReply(contextMessageId, buttonTitle, payload.source)
    } else if (buttonTitle && /(confirmar|cancelar)/i.test(buttonTitle)) {
      // Alguns clientes enviam a resposta rápida como texto, sem context.id/gsId.
      console.log("[WhatsApp][Webhook] text reply fallback", {
        replyType,
        source: payload.source,
        title: buttonTitle,
      })
      await handleWhatsAppReplyByPhone(buttonTitle, payload.source)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[WhatsApp][Webhook] erro no processamento", err)
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
      text?: string
      postbackText?: string
      id?: string
      reason?: string
      code?: string | number
    }
    context?: {
      id: string
      gsId?: string
    }
  }
}
