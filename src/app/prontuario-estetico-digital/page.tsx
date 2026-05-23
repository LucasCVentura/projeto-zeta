import type { Metadata } from "next"
import { SeoPage, type SeoPageContent } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "Prontuário Estético Digital | Kira",
  description: "Prontuário estético digital para organizar clientes, histórico de atendimentos, fotos de evolução, procedimentos e informações importantes.",
}

const content: SeoPageContent = {
  eyebrow: "Prontuário estético digital",
  title: "Histórico da cliente, fotos e evolução organizados no mesmo lugar",
  description: "Use o Kira para manter informações da cliente, procedimentos realizados, fotos de evolução e registros importantes sem depender de anotações soltas.",
  heroCardTitle: "Prontuário e evolução",
  pains: [
    "Ficha e histórico ficam incompletos quando parte da informação está no WhatsApp.",
    "Fotos de antes e depois se misturam com imagens pessoais ou de outras clientes.",
    "Fica difícil retomar o contexto de uma cliente depois de semanas ou meses.",
    "A evolução do tratamento perde força quando os registros não estão organizados.",
  ],
  benefits: [
    { title: "Histórico por cliente", description: "Mantenha informações e registros vinculados à cliente certa." },
    { title: "Fotos com mais contexto", description: "Organize imagens de evolução para acompanhar resultados com mais clareza." },
    { title: "Atendimento mais consistente", description: "Recupere detalhes importantes antes de cada sessão e reduza esquecimentos." },
  ],
  features: ["Cadastro de clientes", "Histórico de procedimentos", "Fotos de antes e depois", "Evolução", "Agenda conectada", "Relatórios com IA"],
  workflowTitle: "Um prontuário que acompanha a cliente ao longo do tempo",
  workflowDescription: "Essa página aprofunda a parte de histórico: registros, fotos, procedimentos e informações que ajudam a manter continuidade no atendimento.",
  workflow: [
    { title: "Cadastro completo", description: "Centralize dados da cliente e informações relevantes para consultar antes de cada sessão." },
    { title: "Registro de evolução", description: "Guarde fotos de antes e depois junto ao contexto do procedimento realizado." },
    { title: "Histórico para próximos atendimentos", description: "Retome o que foi feito, acompanhe resultados e conduza retornos com mais segurança." },
  ],
  faqs: [
    { question: "O prontuário do Kira é feito para estética?", answer: "Sim. A estrutura foi pensada para profissionais da estética acompanharem clientes, procedimentos e evolução visual." },
    { question: "Posso guardar fotos no histórico?", answer: "Sim. O Kira tem área para fotos e acompanhamento de evolução da cliente." },
    { question: "O Kira também tem agenda?", answer: "Sim. Além do prontuário, o Kira inclui agenda, financeiro, estoque e pacotes." },
  ],
}

export default function Page() {
  return <SeoPage content={content} />
}
