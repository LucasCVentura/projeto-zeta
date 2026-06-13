export type ChangelogEntry = {
  version: string
  date: string
  items: { type: "new" | "improvement" | "fix"; text: string }[]
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: "1.7.0",
    date: "2026-06-12",
    items: [
      { type: "new",         text: "Termos de consentimento: crie múltiplos termos em Configurações → Termos e envie junto com a ficha de anamnese para o cliente aceitar ou recusar" },
      { type: "new",         text: "Respostas dos termos ficam registradas na ficha do cliente com data e hora — editáveis pelo profissional a qualquer momento" },
      { type: "improvement", text: "Termos podem ser ativados ou desativados individualmente sem perder o histórico de respostas" },
    ],
  },
  {
    version: "1.6.0",
    date: "2026-06-07",
    items: [
      { type: "new",         text: "Dashboard reformulado: próximos agendamentos da semana, clientes sem retorno há 30+ dias, aniversariantes da semana e procedimentos mais realizados" },
      { type: "new",         text: "Notificações no sininho quando paciente confirma ou cancela agendamento via WhatsApp" },
      { type: "new",         text: "Notificação no sininho quando paciente preenche a ficha de anamnese — com link direto para a ficha" },
      { type: "new",         text: "Link para ficha de anamnese enviado automaticamente no resumo de agendamento via WhatsApp" },
      { type: "new",         text: "Pacientes podem preencher e editar a ficha de anamnese pelo link sem precisar de login" },
      { type: "improvement", text: "Taxa de confirmação exibida no dashboard no lugar de 'confirmados hoje'" },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-06-05",
    items: [
      { type: "new",         text: "Ficha de anamnese personalizável: adicione, remova e reordene as perguntas da ficha de cada cliente em Configurações → Anamnese" },
      { type: "new",         text: "Suporte a 4 tipos de perguntas na anamnese: texto livre, sim/não, seleção única e múltipla escolha" },
      { type: "improvement", text: "Ficha de anamnese agora salva as respostas por cliente de forma dinâmica — sem campos fixos" },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-06-03",
    items: [
      { type: "new",         text: "Importação de clientes via CSV ou Excel — suba sua lista de qualquer sistema com mapeamento automático de colunas" },
      { type: "new",         text: "Plano Vitalício: acesso permanente sem assinatura ativa" },
      { type: "improvement", text: "Campo de contato unificado em WhatsApp / Telefone no cadastro de clientes" },
      { type: "fix",         text: "Lembretes e mensagens pós-atendimento agora usam o número de WhatsApp do cliente corretamente" },
      { type: "fix",         text: "Análise visual da pele: labels das anotações exibiam caracteres japoneses em alguns dispositivos" },
    ],
  },
  {
    version: "1.3.0",
    date: "2026-06-03",
    items: [
      { type: "new",         text: "Sistema de comissões: defina a % de comissão de cada procedimento e acompanhe os ganhos por profissional" },
      { type: "new",         text: "Profissionais agora têm acesso ao financeiro com visão exclusiva das próprias comissões" },
      { type: "new",         text: "Owner e recepcionista podem selecionar o profissional responsável ao criar um agendamento" },
      { type: "improvement", text: "Financeiro do dono exibe total de comissões a pagar e breakdown por profissional" },
      { type: "fix",         text: "Análise visual da pele: labels das anotações exibiam caracteres japoneses em alguns dispositivos" },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-06-02",
    items: [
      { type: "new",         text: "Forma de pagamento agora é registrada ao finalizar o atendimento (Pix, débito, crédito, parcelado ou dinheiro)" },
      { type: "new",         text: "Financeiro: novo KPI com breakdown de receita por forma de pagamento e barra de proporção" },
      { type: "improvement", text: "Cada lançamento no financeiro exibe um badge colorido com a forma de pagamento utilizada" },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-05-28",
    items: [
      { type: "new",         text: "Análise visual da pele: a IA marca as áreas de atenção diretamente na foto" },
      { type: "new",         text: "Indicações de procedimentos por IA a partir de fotos da cliente" },
      { type: "improvement", text: "Respostas da IA agora falam com você de forma natural, com saudação pelo nome" },
      { type: "fix",         text: "Fotos da evolução não carregavam mais após recarregar a página (F5)" },
      { type: "improvement", text: "Upload de fotos agora aceita arquivos maiores (até 10 MB)" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-05-01",
    items: [
      { type: "new", text: "Lançamento do Kira — agenda, clientes, financeiro e prontuário estético" },
      { type: "new", text: "Comparação de fotos com análise automática por IA" },
      { type: "new", text: "Lembretes de consulta via WhatsApp com confirmação de presença" },
      { type: "new", text: "Sugestão de retorno com IA baseada no histórico da cliente" },
    ],
  },
]

export const CURRENT_VERSION = CHANGELOG[0].version
