"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { createCheckoutSessionAction } from "@/actions/subscription"
import { KiraMark } from "@/components/ui/kira-mark"
import { Suspense } from "react"

const features = [
  "Agenda inteligente com gestão de horários",
  "Cadastro ilimitado de clientes",
  "Prontuários e fotos com análise por IA",
  "Controle financeiro e relatórios",
  "Gestão de estoque e procedimentos",
  "Pacotes de sessões para clientes",
  "Suporte prioritário",
]

function AssinarContent() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const motivo = searchParams.get("motivo")

  const trialExpirado = motivo === "trial-expirado"
  const semAssinatura = motivo === "sem-assinatura"

  const [subscribeError, setSubscribeError] = useState<string | null>(null)

  async function handleSubscribe() {
    setLoading(true)
    setSubscribeError(null)
    const result = await createCheckoutSessionAction()
    if ("error" in result) {
      setSubscribeError(result.error)
      setLoading(false)
      return
    }
    window.location.href = result.url
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
            <KiraMark size={25} />
          </div>
          <span className="text-xl font-semibold tracking-tight">Kira</span>
        </div>

        {/* Mensagem contextual */}
        {trialExpirado && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/10 px-5 py-4 text-center space-y-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
              Seu período de teste terminou 🌿
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-400/70 leading-relaxed">
              Esperamos que tenha curtido a experiência! Assine agora para continuar gerenciando sua clínica sem interrupções.
            </p>
          </div>
        )}

        {semAssinatura && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-center space-y-1">
            <p className="text-sm font-semibold text-primary">
              Sua assinatura está inativa
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Para continuar usando o Kira, reative sua assinatura abaixo.
            </p>
          </div>
        )}

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold font-heading">Kira Pro</h1>
            <p className="text-muted-foreground text-sm">Tudo que sua clínica precisa em um só lugar</p>
          </div>

          {/* Preço */}
          <div className="flex items-end justify-center gap-1">
            <span className="text-sm text-muted-foreground">R$</span>
            <span className="text-5xl font-bold tracking-tight">49</span>
            <span className="text-2xl font-bold">,90</span>
            <span className="text-sm text-muted-foreground mb-1">/mês</span>
          </div>

          {/* Features */}
          <ul className="space-y-2.5">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all hover:shadow-lg hover:shadow-primary/20"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Redirecionando...
              </span>
            ) : trialExpirado ? "Assinar e continuar" : "Assinar agora"}
          </button>

          {subscribeError && (
            <p className="text-center text-sm text-destructive">{subscribeError}</p>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Cancele quando quiser · Sem fidelidade
          </p>
        </div>

        {/* Rodapé de confiança */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Pagamento seguro via Stripe
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Dados protegidos pela LGPD
          </span>
        </div>

      </div>
    </div>
  )
}

export default function AssinarPage() {
  return (
    <Suspense>
      <AssinarContent />
    </Suspense>
  )
}
