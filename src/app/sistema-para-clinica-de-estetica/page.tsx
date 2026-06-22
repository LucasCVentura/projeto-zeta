import type { Metadata } from "next"
import { SeoPage, type SeoPageContent } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "Sistema para Clínica de Estética | Kira",
  description: "Sistema para clínica de estética organizar agenda, clientes, prontuários, fotos, financeiro, estoque e pacotes de sessões. Teste grátis por 7 dias.",
  openGraph: {
    title: "Sistema para Clínica de Estética | Kira",
    description: "Sistema para clínica de estética organizar agenda, clientes, prontuários, fotos, financeiro, estoque e pacotes de sessões. Teste grátis por 7 dias.",
    url: "https://www.kiraclinic.com.br/sistema-para-clinica-de-estetica",
    type: "website",
    images: [
      {
        url: "/og?title=Sistema+para+Cl%C3%ADnica+de+Est%C3%A9tica&sub=Agenda%2C+prontu%C3%A1rios%2C+financeiro+e+pacotes+em+um+s%C3%B3+lugar.",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og?title=Sistema+para+Cl%C3%ADnica+de+Est%C3%A9tica&sub=Agenda%2C+prontu%C3%A1rios%2C+financeiro+e+pacotes+em+um+s%C3%B3+lugar."],
  },
}

const content: SeoPageContent = {
  eyebrow: "Sistema para clínica de estética",
  title: "Uma gestão mais organizada para sua clínica de estética",
  description: "Controle agenda, clientes, procedimentos, financeiro, estoque e pacotes em uma plataforma simples para a rotina de clínicas e profissionais da estética. Sem planilha, sem agenda de papel, sem informação perdida no WhatsApp.",
  heroCardTitle: "O que o Kira organiza na sua clínica",
  pains: [
    "A agenda cresce, mas as informações continuam espalhadas entre ferramentas diferentes.",
    "A clínica atende bem, mas demora para enxergar receita, retornos e pendências.",
    "Estoque e insumos só aparecem como problema quando algo falta.",
    "Pacotes e sessões vendidas ficam difíceis de acompanhar conforme a base aumenta.",
  ],
  benefits: [
    {
      title: "Rotina centralizada",
      description: "Reúna agenda, clientes, histórico, financeiro e estoque no mesmo sistema. Sem alternar entre WhatsApp, planilha e agenda de papel — tudo que importa está em um só lugar, acessível pelo celular ou computador.",
    },
    {
      title: "Mais clareza para decidir",
      description: "Veja receita do mês, atendimentos realizados e procedimentos mais frequentes com uma visão simples do negócio. Identifique clientes que precisam de retorno e pacotes em aberto sem fazer conta manual.",
    },
    {
      title: "Experiência mais profissional",
      description: "Organização interna também reflete na percepção do cliente durante o atendimento. Acessar o histórico rapidamente, ter as fotos organizadas e registrar o procedimento na hora passa confiança.",
    },
  ],
  features: [
    "Agenda da clínica com status de atendimento",
    "Cadastro de clientes e prontuários",
    "Fotos de evolução por cliente",
    "Controle financeiro e receita mensal",
    "Gestão de estoque e insumos",
    "Pacotes de sessões com controle de uso",
    "Lembretes automáticos via WhatsApp",
  ],
  workflowTitle: "Uma visão mais clara da operação da clínica",
  workflowDescription: "O Kira foi pensado para a rotina real de clínicas de estética: organizar o dia, acompanhar clientes ao longo do tempo e ter visibilidade do negócio sem precisar de várias ferramentas.",
  workflow: [
    {
      title: "Organize a agenda sem WhatsApp",
      description: "Veja atendimentos do dia, status de cada cliente e quem precisa confirmar. Lembretes automáticos são enviados pelo próprio sistema, reduzindo o tempo gasto em mensagens manuais.",
    },
    {
      title: "Acompanhe cada cliente com contexto",
      description: "Antes de cada sessão, acesse o histórico de procedimentos, fotos de evolução e observações anteriores. O cliente percebe que você se lembra do que foi feito — porque você tem tudo registrado.",
    },
    {
      title: "Tenha visibilidade do negócio",
      description: "Controle receita, procedimentos realizados, clientes novos e pacotes em andamento com uma visão mais gerencial. Útil para entender o que está funcionando e onde focar.",
    },
  ],
  faqs: [
    {
      question: "O sistema para clínica de estética do Kira serve para profissional autônomo também?",
      answer: "Sim. O Kira foi pensado tanto para profissionais autônomos quanto para clínicas com mais de um profissional. A versão individual organiza agenda, clientes, prontuários e financeiro de um único profissional. Para clínicas com equipe, é possível gerenciar múltiplos profissionais e ter controle separado por atendente.",
    },
    {
      question: "Preciso instalar algum aplicativo ou programa?",
      answer: "Não é necessário instalar nada. O Kira funciona direto pelo navegador, no celular ou computador. Ele também pode ser adicionado à tela inicial do celular como um aplicativo, funcionando de forma parecida com um app nativo — inclusive com acesso rápido sem precisar abrir o navegador.",
    },
    {
      question: "O Kira envia confirmação de agendamento pelo WhatsApp?",
      answer: "Sim. O sistema envia lembretes e confirmações automáticas via WhatsApp para os clientes. Isso reduz faltas e economiza o tempo gasto em mensagens manuais. O profissional configura os horários de envio e o sistema cuida do restante.",
    },
    {
      question: "Consigo controlar pacotes de sessões no Kira?",
      answer: "Sim. Você pode criar pacotes de procedimentos, registrar quais sessões já foram realizadas e acompanhar o saldo restante de cada cliente. Isso é especialmente útil para tratamentos que envolvem múltiplas sessões, como drenagem, laser ou bioestimuladores.",
    },
    {
      question: "O sistema para clínica de estética tem controle financeiro?",
      answer: "Sim. O Kira registra receitas por atendimento, gera visão de receita mensal e mostra os procedimentos mais realizados. É um controle simples e direto, focado em dar visibilidade do caixa sem a complexidade de um sistema contábil.",
    },
    {
      question: "Como funciona o período de teste?",
      answer: "Você pode testar o Kira por 7 dias gratuitamente, sem precisar informar cartão de crédito. Durante o teste você tem acesso completo ao sistema — agenda, clientes, prontuários, financeiro, estoque e pacotes. Se decidir continuar, a assinatura custa R$ 49,90 por mês.",
    },
    {
      question: "O Kira substitui minha planilha de controle?",
      answer: "Para a maioria das profissionais, sim. O Kira cobre agenda, histórico de clientes, fotos, controle financeiro e estoque. Se você usa planilha para anotar atendimentos, clientes ou receita, o Kira organiza tudo isso de forma mais acessível e integrada.",
    },
  ],
  relatedPages: [
    {
      title: "Sistema para biomédica esteta",
      href: "/sistema-para-biomedica-esteta",
      description: "Controle de fotos de evolução, pacotes e prontuário para biomédicas.",
    },
    {
      title: "Agenda para estética",
      href: "/agenda-para-estetica",
      description: "Como o Kira organiza sua agenda de atendimentos e confirmações.",
    },
    {
      title: "Prontuário estético digital",
      href: "/prontuario-estetico-digital",
      description: "Histórico, fotos de evolução e registros organizados por cliente.",
    },
  ],
}

export default function Page() {
  return <SeoPage content={content} />
}
