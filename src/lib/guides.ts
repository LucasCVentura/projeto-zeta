import type { LucideIcon } from "lucide-react"
import { Ticket, Calendar, ScrollText } from "lucide-react"

// Registro de guias — mesmo espírito do FEATURE_REGISTRY em feature-flags.ts,
// mas é só conteúdo (sem banco). Compartilhado entre a seção "Guias" em Ajuda
// e os banners "Como funciona X?" que aparecem dentro de cada feature, pra não
// duplicar texto que fica desatualizado em dois lugares.

export type GuideStep = { title: string; description: string; image?: string }
export type Guide = { key: string; title: string; icon: LucideIcon; steps: GuideStep[] }

export const GUIDES: Guide[] = [
  {
    key: "coupons",
    title: "Cupons e vale-presentes",
    icon: Ticket,
    steps: [
      { title: "Crie aqui", description: "Escolha cupom de desconto ou vale-presente, o procedimento, validade e pra quem enviar.", image: "/guides/coupons-1-create.png" },
      { title: "Cliente recebe no WhatsApp", description: "O envio já sai automático, com o QR code pronto pra usar.", image: "/guides/coupons-2-whatsapp.png" },
      { title: "Resgata na finalização", description: "Ao concluir o atendimento, clique em \"Escanear cupom ou vale-presente\" e aponte a câmera pro QR code.", image: "/guides/coupons-3-redeem.png" },
    ],
  },
  {
    key: "agenda",
    title: "Agenda",
    icon: Calendar,
    steps: [
      { title: "Configure seus horários", description: "Em Configurações → Agenda, defina dias de trabalho, horário de início/fim e duração padrão de cada atendimento.", image: "/guides/agenda-1-config.png" },
      { title: "Marque um atendimento", description: "Clique num horário livre no calendário, escolha a cliente e o procedimento.", image: "/guides/agenda-2-book.png" },
      { title: "Atualize o status", description: "Confirme, conclua ou cancele o atendimento direto no card, conforme ele acontece.", image: "/guides/agenda-3-status.png" },
    ],
  },
  {
    key: "termos",
    title: "Termos de consentimento",
    icon: ScrollText,
    steps: [
      { title: "Crie o termo", description: "Em Configurações → Termos, escreva o título e o texto do termo.", image: "/guides/termos-1-create.png" },
      { title: "Ative", description: "Vire a chavinha pra ativar — só termos ativos são enviados.", image: "/guides/termos-2-activate.png" },
      { title: "Cliente assina na ficha", description: "Termos ativos aparecem automaticamente na ficha de anamnese, pra cliente ler e assinar.", image: "/guides/termos-3-sign.png" },
    ],
  },
]

export function getGuide(key: string): Guide | undefined {
  return GUIDES.find((g) => g.key === key)
}
