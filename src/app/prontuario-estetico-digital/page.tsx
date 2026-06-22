import type { Metadata } from "next"
import { SeoPage, type SeoPageContent } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "Prontuário Estético Digital | Kira",
  description: "Prontuário estético digital para organizar clientes, histórico de procedimentos, fotos de evolução antes e depois, e registros por sessão. Acesse pelo celular. Teste grátis.",
  openGraph: {
    title: "Prontuário Estético Digital | Kira",
    description: "Prontuário estético digital para organizar clientes, histórico de procedimentos, fotos de evolução antes e depois, e registros por sessão. Acesse pelo celular. Teste grátis.",
    url: "https://www.kiraclinic.com.br/prontuario-estetico-digital",
    type: "website",
    images: [
      {
        url: "/og?title=Prontu%C3%A1rio+Est%C3%A9tico+Digital&sub=Hist%C3%B3rico%2C+fotos+de+evolu%C3%A7%C3%A3o+e+registros+organizados+por+cliente.",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og?title=Prontu%C3%A1rio+Est%C3%A9tico+Digital&sub=Hist%C3%B3rico%2C+fotos+de+evolu%C3%A7%C3%A3o+e+registros+organizados+por+cliente."],
  },
}

const content: SeoPageContent = {
  eyebrow: "Prontuário estético digital",
  title: "Histórico do cliente, fotos e evolução organizados no mesmo lugar",
  description: "O Kira centraliza ficha do cliente, procedimentos realizados, fotos de antes e depois e observações por sessão em um prontuário estético digital — acessível pelo celular, sem depender de caderno, galeria ou WhatsApp para se lembrar do que foi feito.",
  heroCardTitle: "O que o prontuário do Kira organiza",
  pains: [
    "A ficha do cliente fica incompleta porque parte do histórico está no WhatsApp.",
    "Fotos de antes e depois se misturam com imagens pessoais ou de outros clientes.",
    "Depois de semanas sem atender, retomar o contexto do tratamento exige esforço.",
    "A evolução do resultado perde valor quando não tem registro organizado para mostrar.",
  ],
  benefits: [
    {
      title: "Prontuário completo e por cliente",
      description: "Cadastre dados do cliente, informações de saúde relevantes, procedimentos realizados e observações de cada sessão. Tudo vinculado ao cliente certo — não misturado com anotações de outras pessoas ou perdido no histórico de mensagens.",
    },
    {
      title: "Fotos de evolução com contexto",
      description: "Registre fotos de antes e depois diretamente no prontuário, vinculadas ao procedimento e à sessão correspondente. Na próxima consulta, você acessa a foto certa no momento certo — sem buscar na galeria do celular.",
    },
    {
      title: "Continuidade real no atendimento",
      description: "Antes de cada sessão, consulte o que foi feito, as fotos da última visita e as observações relevantes. Esse contexto melhora a qualidade do atendimento e transmite profissionalismo — o cliente percebe que você se lembra do que foi feito.",
    },
  ],
  features: [
    "Cadastro completo de clientes",
    "Histórico de procedimentos por sessão",
    "Fotos de antes e depois vinculadas ao atendimento",
    "Comparação visual de evolução com IA",
    "Observações e notas por sessão",
    "Agenda conectada ao prontuário",
    "Acesso pelo celular ou computador",
  ],
  workflowTitle: "Um prontuário que acompanha o cliente ao longo do tempo",
  workflowDescription: "O prontuário estético digital do Kira foi pensado para a realidade de quem atende o mesmo cliente em múltiplas sessões: registrar, acompanhar evolução e ter as informações certas antes de cada atendimento.",
  workflow: [
    {
      title: "Cadastro e primeira ficha",
      description: "Registre os dados do cliente, informações de saúde relevantes, objetivos e procedimentos de interesse. A ficha fica salva no sistema e pode ser complementada a cada atendimento, construindo um histórico real ao longo do tempo.",
    },
    {
      title: "Registro de cada sessão",
      description: "Após o atendimento, adicione fotos, observações, procedimento realizado e qualquer informação relevante para o próximo retorno. O registro fica vinculado àquela sessão — não ao dia ou ao profissional, mas à evolução daquele cliente.",
    },
    {
      title: "Consulta antes do próximo retorno",
      description: "Na consulta seguinte, acesse o histórico diretamente pela agenda. Veja o que foi feito, as fotos anteriores e as notas da sessão passada. Você retoma o tratamento com contexto completo, sem depender de memória ou mensagens antigas.",
    },
  ],
  faqs: [
    {
      question: "O prontuário estético digital do Kira é diferente de uma ficha de papel?",
      answer: "Sim, em vários aspectos. A ficha de papel guarda texto, mas não fotos, não histórico cronológico e não se conecta com a agenda. O prontuário digital do Kira centraliza dados do cliente, procedimentos realizados, fotos de evolução e observações por sessão — tudo acessível pelo celular antes de qualquer atendimento, sem precisar procurar uma ficha física.",
    },
    {
      question: "Posso guardar fotos de antes e depois no prontuário?",
      answer: "Sim. O Kira tem área dedicada para fotos de evolução vinculadas a cada cliente. Você faz o upload pelo celular ou computador, as imagens ficam organizadas por sessão e é possível comparar resultados visuais ao longo do tempo. A IA do Kira também pode ajudar na análise comparativa entre sessões.",
    },
    {
      question: "O prontuário fica acessível durante o atendimento?",
      answer: "Sim. O Kira é responsivo e funciona no navegador do celular. Durante ou antes do atendimento, você acessa o prontuário do cliente diretamente pela agenda — sem precisar abrir outro aplicativo ou procurar a ficha em outro lugar.",
    },
    {
      question: "Consigo registrar diferentes tipos de procedimentos no mesmo prontuário?",
      answer: "Sim. Você pode registrar qualquer tipo de procedimento estético — drenagem linfática, laser, bioestimuladores, toxina botulínica, limpeza de pele, entre outros. Cada sessão fica registrada com o procedimento específico, data, observações e fotos, formando um histórico completo por cliente.",
    },
    {
      question: "O Kira usa IA para análise das fotos de evolução?",
      answer: "Sim. O Kira tem recurso de comparação visual com IA para análise de fotos de antes e depois. A IA apoia a avaliação da evolução, identifica variações entre sessões e pode sugerir observações a partir das imagens. É uma ferramenta de apoio à profissional — o diagnóstico e a conduta continuam sendo da especialista.",
    },
    {
      question: "O prontuário estético digital é seguro? Minhas clientes podem acessar?",
      answer: "O acesso ao Kira é restrito à profissional e à equipe autorizada. As clientes não têm acesso ao prontuário. Os dados ficam armazenados com segurança e o sistema é acessado por login individual — o que garante controle sobre quem pode visualizar as informações.",
    },
    {
      question: "Preciso de cartão para testar?",
      answer: "Não. O teste gratuito dura 7 dias com acesso completo ao sistema, incluindo prontuário, agenda, financeiro e estoque — sem precisar informar cartão de crédito. Se decidir continuar após o teste, a assinatura custa R$ 49,90 por mês.",
    },
  ],
  relatedPages: [
    {
      title: "Sistema para clínica de estética",
      href: "/sistema-para-clinica-de-estetica",
      description: "Visão completa do Kira para gestão de clínicas e profissionais da estética.",
    },
    {
      title: "Sistema para biomédica esteta",
      href: "/sistema-para-biomedica-esteta",
      description: "Controle de fotos de evolução, pacotes e prontuário para biomédicas.",
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
