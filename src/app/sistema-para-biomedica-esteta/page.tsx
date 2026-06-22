import type { Metadata } from "next"
import { SeoPage, type SeoPageContent } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "Sistema para Biomédica Esteta | Kira",
  description: "Sistema para biomédica esteta organizar agenda, clientes, prontuários, fotos de evolução, financeiro, estoque e pacotes de sessões. Teste grátis por 7 dias.",
  openGraph: {
    title: "Sistema para Biomédica Esteta | Kira",
    description: "Sistema para biomédica esteta organizar agenda, clientes, prontuários, fotos de evolução, financeiro, estoque e pacotes de sessões. Teste grátis por 7 dias.",
    url: "https://www.kiraclinic.com.br/sistema-para-biomedica-esteta",
    type: "website",
    images: [
      {
        url: "/og?title=Sistema+para+Biom%C3%A9dica+Esteta&sub=Fotos+de+evolu%C3%A7%C3%A3o%2C+pacotes+e+prontu%C3%A1rio+em+um+s%C3%B3+lugar.",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og?title=Sistema+para+Biom%C3%A9dica+Esteta&sub=Fotos+de+evolu%C3%A7%C3%A3o%2C+pacotes+e+prontu%C3%A1rio+em+um+s%C3%B3+lugar."],
  },
}

const content: SeoPageContent = {
  eyebrow: "Sistema para biomédica esteta",
  title: "Organize sua rotina de atendimentos, evolução e gestão em um só lugar",
  description: "O Kira ajuda biomédicas estetas a centralizar agenda, clientes, prontuários, fotos de antes e depois, financeiro e pacotes sem depender de WhatsApp, galeria e planilhas soltas. Tudo que importa na rotina da biomédica esteta, em um sistema pensado para essa realidade.",
  heroCardTitle: "O que o Kira organiza para biomédicos estetas",
  pains: [
    "Fotos de evolução ficam espalhadas na galeria e difíceis de encontrar depois.",
    "Histórico do cliente acaba dividido entre WhatsApp, ficha, caderno e memória.",
    "Pacotes de sessões exigem controle manual para saber o que já foi realizado.",
    "Receita, retornos e atendimentos do dia ficam sem uma visão clara.",
  ],
  benefits: [
    {
      title: "Evolução mais fácil de acompanhar",
      description: "Guarde fotos de antes e depois diretamente no histórico do cliente, junto ao procedimento realizado. Comparar resultados entre sessões, apresentar evolução e manter registros organizados fica muito mais simples do que buscar na galeria do celular.",
    },
    {
      title: "Agenda conectada à operação",
      description: "Veja seus horários, status dos atendimentos e próximos agendamentos sem trocar de ferramenta. O Kira envia confirmações automáticas via WhatsApp e permite acessar o prontuário do cliente direto da agenda — tudo no mesmo lugar.",
    },
    {
      title: "Gestão sem planilha",
      description: "Acompanhe financeiro, pacotes e estoque em uma plataforma pensada para estética. Saiba quanto entrou no mês, quais procedimentos foram mais realizados e quais clientes têm sessões em aberto — sem precisar cruzar informações de fontes diferentes.",
    },
  ],
  features: [
    "Agenda de atendimentos com lembretes automáticos",
    "Cadastro de clientes e prontuários completos",
    "Fotos de evolução por cliente e procedimento",
    "Comparação visual de antes e depois com IA",
    "Controle financeiro e receita mensal",
    "Pacotes de sessões com saldo de uso",
    "Estoque e controle de insumos",
  ],
  workflowTitle: "Do primeiro contato ao acompanhamento da evolução",
  workflowDescription: "O Kira foi pensado para a jornada do profissional de estética: registrar o cliente, acompanhar procedimentos ao longo do tempo e ter as informações certas sempre à mão, sem depender de memória ou mensagens antigas.",
  workflow: [
    {
      title: "Antes do atendimento",
      description: "Consulte agenda, histórico do cliente e procedimento previsto antes de cada atendimento. Acesse as fotos da última sessão, veja as observações anteriores e chegue preparado(a) para dar continuidade ao tratamento.",
    },
    {
      title: "Durante e após a sessão",
      description: "Registre fotos, observações e informações importantes para comparar resultados com mais contexto. O Kira tem área dedicada para evolução fotográfica — as imagens ficam vinculadas ao cliente e ao procedimento, não perdidas na galeria.",
    },
    {
      title: "Acompanhamento contínuo",
      description: "Acompanhe pacote, financeiro e próximos retornos sem depender de memória ou mensagens antigas. Veja quais clientes precisam de retorno, quais pacotes estão próximos do fim e tenha visibilidade da receita do período.",
    },
  ],
  faqs: [
    {
      question: "O Kira é específico para biomédico esteta ou serve para outros profissionais?",
      answer: "O Kira foi desenvolvido com foco nas necessidades de profissionais da estética e biomédicas estetas, mas também é usado por esteticistas, designers de cílios e outros profissionais da beleza. A estrutura de prontuários, fotos de evolução e controle de pacotes atende bem quem trabalha com tratamentos que evoluem ao longo de múltiplas sessões.",
    },
    {
      question: "O Kira substitui meu controle por WhatsApp?",
      answer: "Ele não substitui sua conversa com o cliente, mas centraliza as informações importantes para você não depender do histórico do WhatsApp para se organizar. Agenda, histórico, fotos e financeiro ficam no Kira — o WhatsApp fica para a relação com o cliente, não para gestão.",
    },
    {
      question: "Consigo registrar fotos de antes e depois diretamente no sistema?",
      answer: "Sim. O Kira tem área dedicada para fotos de evolução vinculadas a cada cliente. Você faz o upload diretamente pelo celular ou computador, as imagens ficam organizadas por sessão e você pode comparar resultados ao longo do tempo sem precisar buscar na galeria.",
    },
    {
      question: "Posso controlar pacotes de toxina botulínica, bioestimuladores ou outros tratamentos?",
      answer: "Sim. O sistema de pacotes do Kira permite criar pacotes com qualquer tipo de procedimento, registrar as sessões realizadas e acompanhar o saldo restante por cliente. É possível criar pacotes personalizados com quantidade de sessões, valor e controle de uso.",
    },
    {
      question: "A IA do Kira ajuda no atendimento?",
      answer: "Sim. O Kira usa IA para análise de fotos de evolução, comparação visual entre sessões e sugestão de procedimentos a partir das fotos. É uma ferramenta de apoio — complementa a análise do profissional, não substitui o diagnóstico clínico.",
    },
    {
      question: "O Kira funciona pelo celular?",
      answer: "Sim. O Kira é totalmente responsivo e funciona pelo navegador do celular. Você também pode instalá-lo como um aplicativo na tela inicial do seu smartphone, com acesso rápido durante a rotina de atendimentos.",
    },
    {
      question: "Preciso de cartão para testar?",
      answer: "Não. O teste gratuito dura 7 dias com acesso completo ao sistema — sem precisar informar cartão de crédito. Se decidir continuar após o teste, a assinatura custa R$ 49,90 por mês.",
    },
  ],
  relatedPages: [
    {
      title: "Sistema para clínica de estética",
      href: "/sistema-para-clinica-de-estetica",
      description: "Visão completa do Kira para gestão de clínicas e profissionais da estética.",
    },
    {
      title: "Prontuário estético digital",
      href: "/prontuario-estetico-digital",
      description: "Como o Kira organiza histórico, fotos e registros de cada cliente.",
    },
    {
      title: "Agenda para estética",
      href: "/agenda-para-estetica",
      description: "Organização de atendimentos, confirmações e retornos sem WhatsApp.",
    },
  ],
}

export default function Page() {
  return <SeoPage content={content} />
}
