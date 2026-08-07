import type { LucideIcon } from "lucide-react"
import { Ticket, Calendar, ScrollText, Package, Boxes, Users, Wallet, ClipboardList, UserPlus, Images, MessageCircle, Link2 } from "lucide-react"

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
  {
    key: "pacotes",
    title: "Pacotes",
    icon: Package,
    steps: [
      { title: "Crie o pacote", description: "Em Configurações → Pacotes, escolha o procedimento, a quantidade de sessões e o preço.", image: "/guides/pacotes-1-create.png" },
      { title: "Venda pra cliente", description: "Na ficha da cliente, atribua o pacote e a data da compra — já gera o lançamento no financeiro.", image: "/guides/pacotes-2-assign.png" },
      { title: "Sessões descontam sozinhas", description: "Cada atendimento vinculado ao pacote desconta uma sessão automaticamente ao ser concluído, sem precisar mexer em nada.", image: "/guides/pacotes-3-sessions.png" },
    ],
  },
  {
    key: "estoque",
    title: "Estoque",
    icon: Boxes,
    steps: [
      { title: "Cadastre o insumo", description: "Em Estoque, informe nome, unidade, custo e o estoque mínimo — é ele que dispara o alerta.", image: "/guides/estoque-1-create.png" },
      { title: "Vincule ao procedimento", description: "Em Configurações → Procedimentos, edite o procedimento e defina quanto do insumo é gasto por sessão.", image: "/guides/estoque-2-link.png" },
      { title: "Baixa automática", description: "Ao concluir um atendimento desse procedimento, o estoque desconta sozinho — abaixo do mínimo, aparece alerta na tela e no sininho.", image: "/guides/estoque-3-alert.png" },
    ],
  },
  {
    key: "equipe",
    title: "Equipe",
    icon: Users,
    steps: [
      { title: "Convide por e-mail", description: "Em Configurações → Equipe (só o dono acessa), informe nome, e-mail e função — a pessoa recebe um convite pra criar a senha.", image: "/guides/equipe-1-invite.png" },
      { title: "Convite pendente até aceitar", description: "Fica em \"Convites pendentes\", dá pra cancelar, e a lista atualiza sozinha quando a pessoa aceita.", image: "/guides/equipe-2-pending.png" },
      { title: "Cada função vê uma coisa", description: "Profissional atende, agenda e prontuários; Recepcionista cuida de agenda e clientes sem financeiro; Financeiro só vê financeiro e relatórios.", image: "/guides/equipe-3-roles.png" },
    ],
  },
  {
    key: "financeiro",
    title: "Financeiro",
    icon: Wallet,
    steps: [
      { title: "Tudo aqui é automático", description: "Nenhum lançamento manual — a receita entra sozinha ao concluir um atendimento ou vender um pacote.", image: "/guides/financeiro-1-auto.png" },
      { title: "Receita, custo e lucro", description: "Acompanhe mês a mês: receita bruta, ticket médio, custo de insumos e lucro líquido, com gráfico e top procedimentos/clientes.", image: "/guides/financeiro-2-reports.png" },
      { title: "Veja cada lançamento", description: "A lista no final da página mostra cada atendimento, forma de pagamento, cupom usado e comissão do profissional.", image: "/guides/financeiro-3-transactions.png" },
    ],
  },
  {
    key: "anamnese",
    title: "Anamnese",
    icon: ClipboardList,
    steps: [
      { title: "Personalize as perguntas", description: "Em Configurações → Anamnese, adicione, reordene ou remova perguntas — já vem com um conjunto padrão pronto.", image: "/guides/anamnese-1-questions.png" },
      { title: "Escolha o tipo de resposta", description: "Texto livre, sim/não (com detalhe), escolha única ou múltipla escolha.", image: "/guides/anamnese-2-types.png" },
      { title: "Cliente responde na ficha", description: "As respostas ficam salvas na ficha da cliente, prontas pra consultar antes de cada atendimento.", image: "/guides/anamnese-3-answers.png" },
    ],
  },
  {
    key: "clients",
    title: "Clientes",
    icon: UserPlus,
    steps: [
      { title: "Cadastre manualmente", description: "Em Clientes → Novo, preencha nome, CPF e data de nascimento — telefone e e-mail vêm no passo seguinte.", image: "/guides/clients-1-create.png" },
      { title: "Ou importe de uma planilha", description: "Em Clientes → Importar, suba um CSV ou Excel da sua lista atual — o Kira detecta as colunas sozinho, sem precisar renomear nada.", image: "/guides/clients-2-import.png" },
      { title: "Tudo centralizado na ficha", description: "Termos de consentimento, anamnese, pacotes e documentos ficam todos na ficha do cliente, num só lugar.", image: "/guides/clients-3-profile.png" },
    ],
  },
  {
    key: "photos",
    title: "Fotos de evolução",
    icon: Images,
    steps: [
      { title: "Registre a evolução", description: "Em Fotos, na ficha do cliente, adicione uma foto vinculada ao procedimento — elas ficam organizadas em linha do tempo por data.", image: "/guides/photos-1-timeline.png" },
      { title: "Selecione pra comparar", description: "Toque em duas ou mais fotos pra selecioná-las — aparecem as opções de comparar lado a lado ou pedir uma análise por IA.", image: "/guides/photos-2-select.png" },
      { title: "Veja em tela cheia", description: "Abra qualquer foto em tela cheia, com a data e o procedimento, e navegue entre as fotos daquele cliente.", image: "/guides/photos-3-fullscreen.png" },
    ],
  },
  {
    key: "whatsapp",
    title: "WhatsApp automático",
    icon: MessageCircle,
    steps: [
      { title: "Basta ter o WhatsApp cadastrado", description: "Com o número salvo na ficha do cliente, o Kira já sabe pra onde mandar as mensagens — sem nenhuma configuração extra.", image: "/guides/whatsapp-1-contact.png" },
      { title: "Confirmação e lembrete automáticos", description: "Ao confirmar o agendamento, a cliente já recebe a confirmação no WhatsApp; um lembrete sai sozinho perto da data.", image: "/guides/whatsapp-2-agenda.png" },
      { title: "Cada status dispara uma mensagem", description: "Mudou pra \"Faltou\" ou concluiu o atendimento? A mensagem certa sai sozinha — incluindo o agradecimento e pedido de avaliação pós-atendimento.", image: "/guides/whatsapp-3-status.png" },
    ],
  },
  {
    key: "public-booking",
    title: "Agendamento online",
    icon: Link2,
    steps: [
      { title: "Cliente escolhe o procedimento", description: "Compartilhe o link público da sua agenda — a cliente escolhe a profissional e o procedimento, com preço, sem precisar ligar ou mandar mensagem.", image: "/guides/public-booking-1-procedures.png" },
      { title: "Escolhe o melhor horário", description: "Só aparecem os horários realmente livres, já considerando sua configuração de agenda.", image: "/guides/public-booking-2-datetime.png" },
      { title: "Sem criar conta", description: "A cliente só informa nome e WhatsApp pra confirmar — nada de senha ou cadastro. O agendamento já cai na sua agenda.", image: "/guides/public-booking-3-clientinfo.png" },
    ],
  },
]

export function getGuide(key: string): Guide | undefined {
  return GUIDES.find((g) => g.key === key)
}
