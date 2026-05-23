import type { Metadata } from "next"
import { SeoPage, type SeoPageContent } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "Sistema para Clínica de Estética | Kira",
  description: "Sistema para clínica de estética organizar agenda, clientes, prontuários, fotos, financeiro, estoque, pacotes e rotina de atendimentos.",
}

const content: SeoPageContent = {
  eyebrow: "Sistema para clínica de estética",
  title: "Uma gestão mais organizada para sua clínica de estética",
  description: "Controle agenda, clientes, procedimentos, financeiro, estoque e pacotes em uma plataforma simples para a rotina de clínicas e profissionais da estética.",
  heroCardTitle: "Operação da clínica",
  pains: [
    "A agenda cresce, mas as informações continuam espalhadas entre ferramentas diferentes.",
    "A clínica atende bem, mas demora para enxergar receita, retornos e pendências.",
    "Estoque e insumos só aparecem como problema quando algo falta.",
    "Pacotes e sessões vendidas ficam difíceis de acompanhar conforme a base aumenta.",
  ],
  benefits: [
    { title: "Rotina centralizada", description: "Reúna agenda, clientes, histórico, financeiro e estoque no mesmo sistema." },
    { title: "Mais clareza para decidir", description: "Veja receita, atendimentos e procedimentos com uma visão mais simples do negócio." },
    { title: "Experiência mais profissional", description: "Organização interna também reflete na percepção da cliente durante o atendimento." },
  ],
  features: ["Agenda da clínica", "Cadastro de clientes", "Prontuários", "Controle financeiro", "Estoque", "Pacotes de sessões"],
  workflowTitle: "Uma visão mais clara da operação",
  workflowDescription: "Essa página mostra o Kira pela ótica de clínica: organização da agenda, controle de receita, insumos e acompanhamento do volume de atendimentos.",
  workflow: [
    { title: "Organize a agenda", description: "Veja atendimentos do dia, status e clientes sem espalhar a operação entre várias ferramentas." },
    { title: "Acompanhe o negócio", description: "Controle receita, procedimentos realizados, clientes e pacotes com uma visão mais gerencial." },
    { title: "Evite falhas operacionais", description: "Mantenha estoque, insumos e histórico dos atendimentos mais próximos da rotina real da clínica." },
  ],
  faqs: [
    { question: "O Kira serve para clínica pequena?", answer: "Sim. Ele foi pensado para começar simples e acompanhar a profissional ou clínica conforme a rotina cresce." },
    { question: "Também serve para profissional autônoma?", answer: "Sim. Profissionais autônomas podem usar o Kira para organizar agenda, clientes, fotos e financeiro." },
    { question: "O teste tem custo?", answer: "Não. Você pode testar por 7 dias grátis, sem cartão de crédito." },
  ],
}

export default function Page() {
  return <SeoPage content={content} />
}
