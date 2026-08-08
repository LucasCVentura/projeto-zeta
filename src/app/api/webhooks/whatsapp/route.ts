import { NextRequest, NextResponse } from "next/server"
import { handleWhatsAppButtonReply, handleWhatsAppReplyByPhone } from "@/actions/whatsapp"
import { logWhatsAppEvent } from "@/lib/whatsapp-logs"
import { db } from "@/db"
import { whatsappPendingConfirmations, adminChatMessages } from "@/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { handleInboundMessage } from "@/lib/chat-bot"
import { toWhatsAppDestination, onlyDigits } from "@/lib/phone"

export async function POST(req: NextRequest) {
  try {
    // Gupshup não assina o payload — o segredo vem por query string na URL de
    // callback configurada no painel deles (mesmo padrão do webhook do Resend).
    // Sem isso, qualquer um forja eventos (marcar mensagem como lida, disparar
    // reply automático) só sabendo a URL, que não é segredo.
    const expectedSecret = process.env.GUPSHUP_WEBHOOK_SECRET
    if (expectedSecret && req.nextUrl.searchParams.get("secret") !== expectedSecret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

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
        const normalizedPhone = toWhatsAppDestination(payload.source) ?? onlyDigits(payload.source)
        const senderName = payload.sender?.name ?? null
        await handleInboundMessage(normalizedPhone, buttonTitle, senderName)
      }
    } else if (buttonTitle && isAppointmentButton) {
      await handleWhatsAppReplyByPhone(buttonTitle, payload.source)
    } else if (replyType === "text" && payload.source) {
      const normalizedPhone = toWhatsAppDestination(payload.source) ?? onlyDigits(payload.source)
      const messageText = payload.payload?.text ?? buttonTitle ?? ""
      const senderName = payload.sender?.name ?? null

      if (messageText) {
        const isAppointmentReply = /(confirmar|cancelar)/i.test(messageText)
        if (!isAppointmentReply) {
          // Cliente respondeu a uma mensagem nossa (reply com contexto) → conversa já em andamento,
          // não aciona o menu do bot (mas a mensagem é salva e o admin é avisado por push).
          const isReplyToOurs = !!contextMessageId

          let recentlySent = false
          if (!isReplyToOurs) {
            // Sem contexto: verifica se um ATENDENTE (humano) mandou algo a esse número
            // nas últimas 2h pelo chat do admin (cliente digitou sem usar "responder") —
            // aí sim pula o menu do bot, pra não interromper quem já está sendo atendido.
            // Importante: olha só admin_chat_messages com answered_by='human', não
            // whatsapp_message_logs — esse último loga QUALQUER envio (inclusive as
            // próprias mensagens automáticas do bot), o que silenciava o bot depois
            // da primeira mensagem dele mesmo.
            const rows = await db
              .select({ id: adminChatMessages.id })
              .from(adminChatMessages)
              .where(and(
                eq(adminChatMessages.phone, normalizedPhone),
                eq(adminChatMessages.direction, "outbound"),
                eq(adminChatMessages.answeredBy, "human"),
                gt(adminChatMessages.createdAt, new Date(Date.now() - 2 * 60 * 60 * 1000)),
              ))
              .limit(1)
            recentlySent = rows.length > 0
          }

          await handleInboundMessage(normalizedPhone, messageText, senderName, {
            skipBot: isReplyToOurs || recentlySent,
          })
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
