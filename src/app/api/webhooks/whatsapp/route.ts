import { NextRequest, NextResponse } from "next/server"
import { handleWhatsAppButtonReply } from "@/actions/whatsapp"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as GupshupWebhookPayload

    const payload = body?.payload
    if (!payload) return NextResponse.json({ ok: true })

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
  payload?: {
    id: string
    source: string
    type: string
    payload?: {
      title?: string
      id?: string
    }
    context?: {
      id: string
    }
  }
}
