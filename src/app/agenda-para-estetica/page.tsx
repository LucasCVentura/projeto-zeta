import type { Metadata } from "next"
import { SeoPage, type SeoPageContent } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "Agenda para Estética | Kira",
  description: "Agenda para estética organizar atendimentos, clientes, confirmações, retornos, pacotes e rotina profissional pelo celular.",
}

const content: SeoPageContent = {
  eyebrow: "Agenda para estética",
  title: "Organize seus atendimentos sem depender só do WhatsApp",
  description: "A agenda do Kira ajuda profissionais da estética e beleza a visualizar horários, clientes, status dos atendimentos e retornos com mais clareza.",
  heroCardTitle: "Agenda e rotina diária",
  pains: [
    "Horários ficam espalhados entre WhatsApp, agenda do celular e anotações.",
    "Confirmar, remarcar e lembrar retornos consome tempo da rotina.",
    "Fica difícil enxergar o dia quando os atendimentos aumentam.",
    "A agenda não conversa com cliente, prontuário, pacotes ou financeiro.",
  ],
  benefits: [
    { title: "Dia mais claro", description: "Veja os atendimentos do dia e seus status em uma visão organizada." },
    { title: "Cliente no contexto certo", description: "Acesse informações importantes da cliente junto da rotina de atendimento." },
    { title: "Mais que uma agenda", description: "Conecte agenda com prontuário, financeiro, pacotes e estoque." },
  ],
  features: ["Agenda diária", "Status do atendimento", "Cadastro de clientes", "Retornos", "Pacotes", "Financeiro"],
  workflowTitle: "Uma agenda conectada ao restante da rotina",
  workflowDescription: "Essa página foca na organização diária: horários, retornos, status dos atendimentos e contexto da cliente sem ficar caçando informação.",
  workflow: [
    { title: "Veja o dia com clareza", description: "Entenda rapidamente quem será atendida, horário e status de cada atendimento." },
    { title: "Acesse o contexto da cliente", description: "Saia da agenda para o cadastro, histórico e informações importantes sem perder tempo." },
    { title: "Conecte agenda e financeiro", description: "Acompanhe atendimentos, pacotes e receita com menos controles paralelos." },
  ],
  faqs: [
    { question: "O Kira é só uma agenda?", answer: "Não. A agenda é uma parte do sistema. O Kira também organiza clientes, prontuários, fotos, financeiro, estoque e pacotes." },
    { question: "Consigo usar pelo celular?", answer: "Sim. A interface é responsiva para uso durante a rotina de atendimentos." },
    { question: "Serve para profissionais da beleza?", answer: "Sim. Além de estética e biomédicas estetas, profissionais como designers de cílios e manicures também podem usar." },
  ],
}

export default function Page() {
  return <SeoPage content={content} />
}
