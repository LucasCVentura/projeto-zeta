export type Notice = {
  id: string
  type: "info" | "warning" | "success"
  title: string
  message: string
  expiresAt?: string // ISO date — aviso some automaticamente após essa data
}

export const NOTICES: Notice[] = [
  {
    id: "whatsapp-resumo-voltou",
    type: "success",
    title: "Resumo de agendamento via WhatsApp de volta",
    message: "O envio automático de resumos por WhatsApp está funcionando normalmente, incluindo o link da ficha de anamnese.",
    expiresAt: "2026-06-10T00:00:00.000Z",
  },
]

export function getActiveNotices(): Notice[] {
  const now = new Date()
  return NOTICES.filter(n => !n.expiresAt || new Date(n.expiresAt) > now)
}
