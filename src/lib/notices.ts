export type Notice = {
  id: string
  type: "info" | "warning" | "success"
  title: string
  message: string
  expiresAt?: string // ISO date — aviso some automaticamente após essa data
}

export const NOTICES: Notice[] = [
  {
    id: "whatsapp-resumo-manutencao",
    type: "warning",
    title: "Resumo de agendamento via WhatsApp temporariamente indisponível",
    message: "Estamos realizando melhorias no envio automático de resumos por WhatsApp. Previsão de retorno: segunda-feira, 08/06.",
    expiresAt: "2026-06-09T00:00:00.000Z",
  },
]

export function getActiveNotices(): Notice[] {
  const now = new Date()
  return NOTICES.filter(n => !n.expiresAt || new Date(n.expiresAt) > now)
}
