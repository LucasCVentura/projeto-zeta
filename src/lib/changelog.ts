// O histórico de fato mora no banco (tabela changelog_entries) — editável em
// /admin → Changelog e pelo fluxo "Ativar pra todas" de Novas Features, sem
// precisar de deploy novo a cada entrada. Esse arquivo só guarda o tipo
// compartilhado entre a leitura (src/actions/changelog.ts) e a UI
// (src/components/changelog/whats-new-modal.tsx).

export type ChangelogEntry = {
  version: string
  date: string
  items: { type: "new" | "improvement" | "fix"; text: string }[]
}
