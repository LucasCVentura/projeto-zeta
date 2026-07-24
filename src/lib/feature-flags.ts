import { db } from "@/db"
import { featureFlags, featureFlagOrgs } from "@/db/schema"
import { eq, and } from "drizzle-orm"

// ── Registro de features ──────────────────────────────────────────────────────
// "Launch control": toda feature grande nova entra aqui com uma chave estável.
// Não precisa de migration por feature — a linha em `feature_flags` é criada/
// atualizada automaticamente (ver syncFeatureRegistry) na primeira vez que o
// admin abre a aba "Novas Features".
//
// Pra lançar uma feature nova:
//   1. Adicione uma entrada aqui, incluindo `changelogDraft` — a frase pronta
//      (tom de usuário final, não de admin) que vai pré-preencher o changelog
//      na hora de "Ativar pra todas". `description` é só pro painel admin.
//   2. Gate o código real (actions, páginas, UI) com `isFeatureEnabled(orgId, "sua-chave")`.
//   3. No painel /admin → Novas Features, libere pra uma org de teste, depois pra todas
//      — nesse último passo o changelog já sai pré-escrito, só revisar e publicar.

export const FEATURE_REGISTRY = [
  {
    key: "coupons",
    label: "Cupons e vale-presentes",
    description: "Criar cupons de desconto e vale-presentes, enviar por WhatsApp com QR code e resgatar na finalização do atendimento.",
    changelogDraft: "Cupons e vale-presentes: crie promoções com desconto ou presenteie uma cliente com um procedimento grátis — envia por WhatsApp com QR code, e o resgate já aplica tudo certinho na hora de finalizar o atendimento",
  },
  {
    key: "nav-redesign",
    label: "Menu reorganizado",
    description: "Sidebar promove Procedimentos, Pacotes e Equipe pro menu principal. No mobile, o botão \"Mais\" abre um painel em grade que sobe de trás da barra, no lugar da tela cheia antiga.",
    changelogDraft: "Menu reorganizado: Procedimentos, Pacotes e Equipe agora têm atalho direto no menu — e no celular, o botão \"Mais\" abre um painel rápido em vez de tomar a tela toda",
  },
  {
    key: "support-tickets",
    label: "Chamados de suporte",
    description: "Substitui o suporte via WhatsApp/e-mail por uma conversa contínua dentro do painel, em Ajuda — com histórico e envio de imagens.",
    changelogDraft: "Chamados de suporte: agora dá pra falar com a gente direto pelo painel, em Ajuda — manda print de qualquer problema e a conversa fica salva, sem depender de WhatsApp ou e-mail",
  },
  {
    key: "guides",
    label: "Guias",
    description: "Aba \"Guias\" em Ajuda, com passo a passo de cada funcionalidade (screenshots reais do app), organizada em abas junto de Contato e Sugestões.",
    changelogDraft: "Guias: nova aba em Ajuda com o passo a passo de cada funcionalidade, com telas reais do Kira",
  },
] as const

export type FeatureKey = (typeof FEATURE_REGISTRY)[number]["key"]

export function getFeatureRegistryEntry(key: string) {
  return FEATURE_REGISTRY.find((f) => f.key === key)
}

// Garante que toda entrada do registro tem uma linha correspondente em `feature_flags`
// (cria se não existir; atualiza label/descrição se o código mudou). Idempotente —
// seguro de chamar toda vez que o painel admin carrega.
export async function syncFeatureRegistry() {
  for (const f of FEATURE_REGISTRY) {
    await db
      .insert(featureFlags)
      .values({ key: f.key, label: f.label, description: f.description })
      .onConflictDoUpdate({
        target: featureFlags.key,
        set: { label: f.label, description: f.description, updatedAt: new Date() },
      })
  }
}

// Checagem real usada em todo o app (actions, páginas, UI) — sem cache, pra uma
// mudança feita no /admin valer na hora, sem esperar revalidação.
export async function isFeatureEnabled(organizationId: string, key: FeatureKey): Promise<boolean> {
  const [feature] = await db
    .select({ id: featureFlags.id, enabledForAll: featureFlags.enabledForAll })
    .from(featureFlags)
    .where(eq(featureFlags.key, key))

  if (!feature) return false // feature não registrada/sincronizada ainda = desligada
  if (feature.enabledForAll) return true

  const [allowed] = await db
    .select({ organizationId: featureFlagOrgs.organizationId })
    .from(featureFlagOrgs)
    .where(and(eq(featureFlagOrgs.featureFlagId, feature.id), eq(featureFlagOrgs.organizationId, organizationId)))

  return !!allowed
}
