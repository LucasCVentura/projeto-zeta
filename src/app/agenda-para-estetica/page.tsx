import type { Metadata } from "next"
import { SeoPage, type SeoPageContent } from "@/components/seo/seo-page"

export const metadata: Metadata = {
  title: "Agenda para Estética | Kira",
  description: "Agenda para estética organizar atendimentos, confirmações automáticas via WhatsApp, retornos, pacotes e rotina profissional pelo celular. Teste grátis por 7 dias.",
  openGraph: {
    title: "Agenda para Estética | Kira",
    description: "Agenda para estética organizar atendimentos, confirmações automáticas via WhatsApp, retornos, pacotes e rotina profissional pelo celular. Teste grátis por 7 dias.",
    url: "https://www.kiraclinic.com.br/agenda-para-estetica",
    type: "website",
    images: [
      {
        url: "/og?title=Agenda+para+Est%C3%A9tica&sub=Confirma%C3%A7%C3%B5es+autom%C3%A1ticas%2C+retornos+e+rotina+organizada+pelo+celular.",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og?title=Agenda+para+Est%C3%A9tica&sub=Confirma%C3%A7%C3%B5es+autom%C3%A1ticas%2C+retornos+e+rotina+organizada+pelo+celular."],
  },
}

const content: SeoPageContent = {
  eyebrow: "Agenda para estética",
  title: "Organize seus atendimentos sem depender só do WhatsApp",
  description: "A agenda do Kira ajuda profissionais da estética a visualizar horários, status dos atendimentos e próximas clientes em um só lugar — com confirmações automáticas por WhatsApp, acesso ao histórico da cliente e conexão com financeiro e pacotes.",
  heroCardTitle: "O que a agenda do Kira organiza",
  pains: [
    "Horários ficam espalhados entre WhatsApp, agenda do celular e caderno.",
    "Confirmar, remarcar e lembrar retornos consome tempo da rotina toda semana.",
    "Fica difícil enxergar o dia inteiro quando os atendimentos aumentam.",
    "A agenda não conversa com prontuário, pacotes ou financeiro — você precisa alternar.",
  ],
  benefits: [
    {
      title: "Visão clara do dia",
      description: "Veja os atendimentos do dia, status de cada cliente e quem ainda não confirmou em uma tela só. Sem precisar checar WhatsApp, caderno e agenda do celular separadamente — tudo centralizado e atualizado em tempo real.",
    },
    {
      title: "Confirmações automáticas por WhatsApp",
      description: "O Kira envia lembretes e confirmações automáticas via WhatsApp para suas clientes. Você configura os horários de envio e o sistema cuida do restante — reduzindo faltas e economizando o tempo gasto em mensagens manuais de confirmação.",
    },
    {
      title: "Agenda conectada à operação",
      description: "Da agenda, acesse o prontuário da cliente, veja o pacote em andamento e registre o atendimento no financeiro. Tudo no mesmo sistema — sem alternar entre ferramentas para ter o contexto completo antes de cada sessão.",
    },
  ],
  features: [
    "Agenda de atendimentos com status",
    "Confirmações automáticas via WhatsApp",
    "Acesso ao prontuário direto da agenda",
    "Controle de retornos e reagendamentos",
    "Pacotes e sessões vinculados ao agendamento",
    "Visão semanal e mensal dos atendimentos",
    "Acesso pelo celular ou computador",
  ],
  workflowTitle: "Uma agenda conectada ao restante da sua rotina",
  workflowDescription: "O Kira foi pensado para a rotina de quem atende várias clientes por dia: visualizar o dia, acessar contexto rápido antes de cada atendimento e reduzir o tempo gasto em tarefas administrativas.",
  workflow: [
    {
      title: "Comece o dia preparada",
      description: "Acesse a agenda do dia e veja quem está confirmada, quem ainda não respondeu e qual procedimento está previsto para cada cliente. Lembretes automáticos já foram enviados pelo Kira — você começa o dia sem precisar enviar mensagem para ninguém.",
    },
    {
      title: "Acesse o contexto antes de cada sessão",
      description: "Clique na cliente na agenda e acesse direto o histórico de procedimentos, fotos de evolução e observações anteriores. Você chega preparada para o atendimento e a cliente percebe que você se lembra do que foi feito nas sessões anteriores.",
    },
    {
      title: "Registre e feche o atendimento",
      description: "Após cada sessão, registre o procedimento realizado, atualize o saldo do pacote e anote observações para o próximo retorno. O Kira conecta o atendimento ao prontuário e ao financeiro — sem precisar fazer isso em lugares separados.",
    },
  ],
  faqs: [
    {
      question: "A agenda do Kira envia confirmação de agendamento pelo WhatsApp?",
      answer: "Sim. O Kira envia lembretes e confirmações automáticas via WhatsApp para as clientes. Você configura os horários de envio — por exemplo, 24 horas antes do atendimento — e o sistema cuida do restante. Isso reduz faltas e elimina o tempo gasto enviando mensagens manuais de confirmação.",
    },
    {
      question: "O Kira é só uma agenda ou tem mais funcionalidades?",
      answer: "A agenda é uma parte do sistema. O Kira também organiza clientes, prontuários com fotos de evolução, controle financeiro, estoque e pacotes de sessões. O diferencial é que tudo está conectado: da agenda você acessa o histórico da cliente, o pacote em andamento e registra o atendimento no financeiro.",
    },
    {
      question: "Consigo usar a agenda do Kira pelo celular durante os atendimentos?",
      answer: "Sim. O Kira é totalmente responsivo e funciona no navegador do celular. Você também pode instalá-lo como um aplicativo na tela inicial do smartphone para acesso mais rápido. É pensado para uso durante a rotina — não apenas na frente do computador.",
    },
    {
      question: "Posso controlar retornos e reagendamentos pela agenda?",
      answer: "Sim. O Kira permite visualizar clientes que precisam de retorno, registrar reagendamentos e manter o histórico atualizado. Se uma cliente faltou ou precisa remarcar, isso fica registrado no sistema — não apenas como uma mensagem de WhatsApp sem rastreamento.",
    },
    {
      question: "A agenda do Kira funciona para profissionais autônomas e para clínicas com equipe?",
      answer: "Sim. Para profissionais autônomas, a agenda organiza a rotina individual com todas as clientes. Para clínicas com equipe, é possível gerenciar múltiplos profissionais com agendas separadas e controle por atendente. O sistema escala conforme a operação cresce.",
    },
    {
      question: "Consigo vincular pacotes de sessões ao agendamento?",
      answer: "Sim. Quando você agenda um atendimento para uma cliente que tem pacote em aberto, o Kira mostra o saldo disponível. Ao registrar o atendimento, uma sessão é descontada automaticamente do pacote — sem precisar fazer esse controle em planilha separada.",
    },
    {
      question: "Preciso de cartão para testar?",
      answer: "Não. O teste gratuito dura 7 dias com acesso completo à agenda, prontuários, financeiro, estoque e pacotes — sem precisar informar cartão de crédito. Se decidir continuar após o teste, a assinatura custa R$ 49,90 por mês.",
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
      title: "Prontuário estético digital",
      href: "/prontuario-estetico-digital",
      description: "Histórico, fotos de evolução e registros organizados por cliente.",
    },
  ],
}

export default function Page() {
  return <SeoPage content={content} />
}
