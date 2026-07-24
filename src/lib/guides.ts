import type { LucideIcon } from "lucide-react"
import { Ticket, Calendar, ScrollText } from "lucide-react"

// Registro de guias — mesmo espírito do FEATURE_REGISTRY em feature-flags.ts,
// mas é só conteúdo (sem banco). Compartilhado entre a seção "Guias" em Ajuda
// e os banners "Como funciona X?" que aparecem dentro de cada feature, pra não
// duplicar texto que fica desatualizado em dois lugares.

export type GuideStep = { title: string; description: string }
export type Guide = { key: string; title: string; icon: LucideIcon; steps: GuideStep[] }

export const GUIDES: Guide[] = [
  {
    key: "coupons",
    title: "Cupons e vale-presentes",
    icon: Ticket,
    steps: [
      { title: "Crie aqui", description: "Escolha cupom de desconto ou vale-presente, o procedimento, validade e pra quem enviar." },
      { title: "Cliente recebe no WhatsApp", description: "O envio já sai automático, com o QR code pronto pra usar." },
      { title: "Resgata na finalização", description: "Ao concluir o atendimento, clique em \"Escanear cupom ou vale-presente\" e aponte a câmera pro QR code." },
    ],
  },
  {
    key: "agenda",
    title: "Agenda",
    icon: Calendar,
    steps: [
      { title: "Configure seus horários", description: "Em Configurações → Agenda, defina dias de trabalho, horário de início/fim e duração padrão de cada atendimento." },
      { title: "Marque um atendimento", description: "Clique num horário livre no calendário, escolha a cliente e o procedimento." },
      { title: "Atualize o status", description: "Confirme, conclua ou cancele o atendimento direto no card, conforme ele acontece." },
    ],
  },
  {
    key: "termos",
    title: "Termos de consentimento",
    icon: ScrollText,
    steps: [
      { title: "Crie o termo", description: "Em Configurações → Termos, escreva o título e o texto do termo." },
      { title: "Ative", description: "Vire a chavinha pra ativar — só termos ativos são enviados." },
      { title: "Cliente assina na ficha", description: "Termos ativos aparecem automaticamente na ficha de anamnese, pra cliente ler e assinar." },
    ],
  },
]

export function getGuide(key: string): Guide | undefined {
  return GUIDES.find((g) => g.key === key)
}
