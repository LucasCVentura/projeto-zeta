import { NextRequest, NextResponse } from "next/server"
import { handleWhatsAppButtonReply, handleWhatsAppReplyByPhone } from "@/actions/whatsapp"
import { logWhatsAppEvent } from "@/lib/whatsapp-logs"
import { db } from "@/db"
import { whatsappPendingConfirmations } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { handleInboundMessage } from "@/lib/chat-bot"

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

    const isAppointmentButton = buttonTitle ? /(confirmar|cancelar)/i.test(buttonTitle) : false

    if ((replyType === "button_reply" || replyType === "quick_reply") && buttonTitle && payload.source) {
      console.log("[WhatsApp][Webhook] button reply received", { replyType, contextMessageId, source: payload.source, title: buttonTitle })

      if (isAppointmentButton && contextMessageId) {
        await handleWhatsAppButtonReply(contextMessageId, buttonTitle, payload.source)
      } else if (isAppointmentButton) {
        await handleWhatsAppReplyByPhone(buttonTitle, payload.source)
      } else {
        // Botão do menu do chatbot (ex: Suporte, Comercial)
        const digits = payload.source.replace(/\D/g, "")
        const normalizedPhone = digits.startsWith("55") ? digits : `55${digits}`
        const senderName = payload.sender?.name ?? null
        await handleInboundMessage(normalizedPhone, buttonTitle, senderName)
      }
    } else if (buttonTitle && isAppointmentButton) {
      await handleWhatsAppReplyByPhone(buttonTitle, payload.source)
    } else if (replyType === "text" && payload.source) {
      const digits = payload.source.replace(/\D/g, "")
      const normalizedPhone = digits.startsWith("55") ? digits : `55${digits}`
      const messageText = payload.payload?.text ?? buttonTitle ?? ""
      const senderName = payload.sender?.name ?? null

      if (messageText) {
        const isAppointmentReply = /(confirmar|cancelar)/i.test(messageText)
        if (!isAppointmentReply) {
          // Não aciona o bot se o cliente respondeu a uma mensagem nossa (reply com contexto)
          const isReplyToOurs = !!contextMessageId
          if (!isReplyToOurs) {
            // Sem contexto: verifica se enviamos algo a esse número nas últimas 2h
            // (cliente digitou no chat sem usar o "responder") — também ignora o bot
            const rows = await db.execute<{ cnt: number }>(sql`
              SELECT COUNT(*)::int AS cnt FROM whatsapp_message_logs
              WHERE destination = ${normalizedPhone}
              AND created_at > NOW() - INTERVAL '2 hours'
              LIMIT 1
            `)
            const recentlySent = (Array.isArray(rows) ? rows[0]?.cnt : rows.rows?.[0]?.cnt) ?? 0
            if (!recentlySent) {
              await handleInboundMessage(normalizedPhone, messageText, senderName)
            }
          }
        }
      }
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
    sender?: {
      name?: string
      phone?: string
    }
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
