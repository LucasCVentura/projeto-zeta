"use client"

import { useState } from "react"
import { createCheckoutSessionAction } from "@/actions/subscription"

const features = [
  "Agenda inteligente com gestão de horários",
  "Cadastro ilimitado de clientes",
  "Prontuários e fotos com análise por IA",
  "Controle financeiro e relatórios",
  "Gestão de estoque e procedimentos",
  "Pacotes de sessões para clientes",
  "Suporte prioritário",
]

export default function AssinarPage() {
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    setLoading(true)
    await createCheckoutSessionAction()
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
            <BonsaiIcon size={14} className="text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Kira</span>
        </div>

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
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading ? "Redirecionando..." : "Assinar agora"}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            Cancele quando quiser. Sem fidelidade.
          </p>
        </div>
      </div>
    </div>
  )
}
