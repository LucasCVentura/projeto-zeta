import type { Metadata } from "next"
import { SeoPage, type SeoPageContent } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "Sistema para Biomédica Esteta | Kira",
  description: "Sistema para biomédica esteta organizar agenda, clientes, prontuários, fotos de evolução, financeiro, estoque e pacotes de sessões.",
}

const content: SeoPageContent = {
  eyebrow: "Sistema para biomédica esteta",
  title: "Organize sua rotina de atendimentos, evolução e gestão em um só lugar",
  description: "O Kira ajuda biomédicas estetas a centralizar agenda, clientes, prontuários, fotos de antes e depois, financeiro e pacotes sem depender de WhatsApp, galeria e planilhas soltas.",
  heroCardTitle: "Rotina da biomédica esteta",
  pains: [
    "Fotos de evolução ficam espalhadas na galeria e difíceis de encontrar depois.",
    "Histórico da cliente acaba dividido entre WhatsApp, ficha, caderno e memória.",
    "Pacotes de sessões exigem controle manual para saber o que já foi realizado.",
    "Receita, retornos e atendimentos do dia ficam sem uma visão clara.",
  ],
  benefits: [
    { title: "Evolução mais fácil de acompanhar", description: "Guarde fotos e histórico da cliente junto ao atendimento, facilitando comparações e acompanhamento." },
    { title: "Agenda conectada à operação", description: "Veja seus horários, status dos atendimentos e próximas clientes sem trocar de ferramenta." },
    { title: "Gestão sem planilha", description: "Acompanhe financeiro, pacotes e estoque em uma plataforma pensada para estética." },
  ],
  features: ["Agenda de atendimentos", "Clientes e prontuários", "Fotos de evolução", "Financeiro", "Pacotes de sessões", "Estoque e insumos"],
  workflowTitle: "Do primeiro contato ao acompanhamento da evolução",
  workflowDescription: "Essa página foca na jornada da biomédica esteta: registrar a cliente, acompanhar procedimentos e ganhar tempo com informações centralizadas.",
  workflow: [
    { title: "Antes do atendimento", description: "Consulte agenda, histórico da cliente e procedimento previsto antes dela chegar." },
    { title: "Durante a evolução", description: "Registre fotos, observações e informações importantes para comparar resultados com mais contexto." },
    { title: "Depois da sessão", description: "Acompanhe pacote, financeiro e próximos retornos sem depender de memória ou mensagens antigas." },
  ],
  faqs: [
    { question: "O Kira substitui meu controle por WhatsApp?", answer: "Ele não substitui sua conversa com a cliente, mas centraliza as informações importantes para você não depender do histórico do WhatsApp para se organizar." },
    { question: "Consigo registrar fotos de antes e depois?", answer: "Sim. O Kira tem área de fotos para acompanhar evolução e manter o histórico da cliente mais organizado." },
    { question: "Preciso de cartão para testar?", answer: "Não. O teste gratuito dura 7 dias e não exige cartão de crédito." },
  ],
}

export default function Page() {
  return <SeoPage content={content} />
}
