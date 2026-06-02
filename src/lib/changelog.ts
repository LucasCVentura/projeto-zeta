export type ChangelogEntry = {
  version: string
  date: string
  items: { type: "new" | "improvement" | "fix"; text: string }[]
}

export const CHANGELOG: ChangelogEntry[] = [
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
