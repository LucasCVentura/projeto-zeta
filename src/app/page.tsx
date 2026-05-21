import Link from "next/link"

const features = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
    title: "Agenda inteligente",
    description: "Gerencie horários, confirmações e lembretes automáticos sem complicação.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: "Prontuários completos",
    description: "Histórico de procedimentos, fotos e evolução de cada cliente em um só lugar.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    ),
    title: "IA para evolução",
    description: "Análise automática de fotos antes e depois, com relatórios de evolução gerados por IA.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: "Financeiro simplificado",
    description: "Controle de receitas, pacotes de sessões e relatórios mensais sem planilha.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
    title: "Controle de estoque",
    description: "Gerencie insumos, defina alertas de reposição e vincule produtos aos procedimentos.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: "Funciona no celular",
    description: "Interface otimizada para uso durante o atendimento, sem precisar de computador.",
  },
]

const steps = [
  { number: "01", title: "Crie sua conta", description: "Cadastro em menos de 2 minutos, sem cartão de crédito." },
  { number: "02", title: "Configure sua clínica", description: "Adicione procedimentos, horários e preferências da sua rotina." },
  { number: "03", title: "Comece a atender", description: "Agenda, prontuários e financeiro prontos para usar no primeiro dia." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* ── Nav ── */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-foreground">
                <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-semibold tracking-tight">Zeta</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-5 pt-16 text-center">
        {/* Gradient blob */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute left-1/2 top-1/3 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, oklch(0.52 0.12 350), transparent 70%)" }}
          />
        </div>

        <div className="relative z-10 max-w-3xl space-y-6" style={{ animation: "fadeUp 0.7s ease both" }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1 text-xs font-medium text-primary">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Plataforma para profissionais da estética
          </div>

          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Gerencie sua clínica
            <br />
            <span className="text-primary">com elegância</span>
          </h1>

          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Agenda, prontuários, fotos com análise por IA, financeiro e estoque — tudo em uma plataforma pensada para esteticistas e biomédicos estetas.
          </p>

          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register"
              className="flex h-12 items-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
            >
              Começar grátis — 7 dias de teste
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="flex h-12 items-center gap-2 rounded-full border border-border px-7 text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Sem cartão de crédito no teste · Cancele quando quiser
          </p>
        </div>

        {/* Dashboard mockup */}
        <div
          className="relative z-10 mt-16 w-full max-w-4xl"
          style={{ animation: "fadeUp 0.9s ease 0.2s both" }}
        >
          <div className="rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 overflow-hidden">
            {/* Fake browser bar */}
            <div className="flex items-center gap-1.5 border-b border-border bg-muted/50 px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
              <div className="mx-auto rounded-md border border-border bg-background px-12 py-1 text-xs text-muted-foreground">
                app.zeta.com.br
              </div>
            </div>
            {/* Mock UI */}
            <div className="flex h-64 sm:h-80">
              {/* Sidebar */}
              <div className="hidden w-48 flex-col gap-1 border-r border-border bg-sidebar p-3 sm:flex">
                {["Dashboard", "Agenda", "Clientes", "Financeiro", "Estoque"].map((item, i) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium ${i === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-primary" : "bg-muted-foreground/40"}`} />
                    {item}
                  </div>
                ))}
              </div>
              {/* Content */}
              <div className="flex-1 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-3 w-28 rounded bg-foreground/10" />
                    <div className="h-2 w-16 rounded bg-foreground/5" />
                  </div>
                  <div className="h-7 w-24 rounded-full bg-primary/20" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[["Atendimentos", "24"], ["Receita", "R$2.480"], ["Clientes", "38"]].map(([label, val]) => (
                    <div key={label} className="rounded-xl border border-border bg-background p-3 space-y-1">
                      <div className="text-[10px] text-muted-foreground">{label}</div>
                      <div className="text-sm font-semibold">{val}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-background p-3 space-y-2">
                    <div className="h-2 w-20 rounded bg-foreground/10" />
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/15" />
                        <div className="space-y-0.5 flex-1">
                          <div className="h-1.5 w-20 rounded bg-foreground/10" />
                          <div className="h-1.5 w-12 rounded bg-foreground/5" />
                        </div>
                        <div className="h-4 w-12 rounded-full bg-green-500/10" />
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border bg-background p-3 space-y-2">
                    <div className="h-2 w-24 rounded bg-foreground/10" />
                    <div className="flex items-end gap-1 h-16">
                      {[30, 50, 40, 70, 55, 80, 65].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-sm bg-primary/20"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div className="absolute -bottom-8 left-1/2 h-16 w-2/3 -translate-x-1/2 rounded-full bg-primary/20 blur-2xl" />
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/40" style={{ animation: "bounce 2s infinite" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center space-y-3">
            <p className="text-sm font-medium text-primary">Funcionalidades</p>
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">Tudo que você precisa</h2>
            <p className="mx-auto max-w-md text-muted-foreground">
              Desenvolvido especificamente para a rotina de quem trabalha com estética e procedimentos.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 space-y-3 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                  {f.icon}
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-5 py-24 bg-primary/3">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center space-y-3">
            <p className="text-sm font-medium text-primary">Como funciona</p>
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">Comece em minutos</h2>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.number} className="relative flex flex-col items-center text-center space-y-3">
                {i < steps.length - 1 && (
                  <div className="absolute top-6 left-[calc(50%+2rem)] hidden h-px w-[calc(100%-2rem)] border-t border-dashed border-border sm:block" />
                )}
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/5 font-heading text-sm font-bold text-primary">
                  {s.number}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-lg text-center space-y-10">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Preço</p>
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">Simples e transparente</h2>
            <p className="text-muted-foreground">Um plano que inclui tudo. Sem surpresas.</p>
          </div>

          <div className="rounded-3xl border-2 border-primary/20 bg-card p-8 shadow-xl shadow-primary/10 space-y-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Zeta Pro</p>
              <div className="flex items-end justify-center gap-1">
                <span className="text-lg text-muted-foreground">R$</span>
                <span className="font-heading text-6xl font-bold">49</span>
                <span className="font-heading text-3xl font-bold">,90</span>
                <span className="text-muted-foreground mb-1">/mês</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">7 dias grátis para começar</p>
            </div>

            <ul className="space-y-2.5 text-left">
              {[
                "Agenda e gestão de horários",
                "Clientes e prontuários ilimitados",
                "Fotos com análise por IA",
                "Controle financeiro completo",
                "Gestão de estoque",
                "Pacotes de sessões",
                "Acesso pelo celular",
                "Suporte por WhatsApp",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="currentColor" className="text-primary/15" />
                    <path d="M8 12l3 3 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-primary" />
                  </svg>
                  {item}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="flex h-13 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:shadow-lg hover:shadow-primary/25"
            >
              Começar 7 dias grátis
            </Link>
            <p className="text-xs text-muted-foreground">Sem cartão de crédito no período de teste.</p>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="px-5 py-24">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center">
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-white/5" />
          <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/5" />
          <div className="relative z-10 space-y-5">
            <h2 className="font-heading text-3xl font-bold text-primary-foreground sm:text-4xl">
              Pronta para transformar<br />sua clínica?
            </h2>
            <p className="mx-auto max-w-sm text-primary-foreground/70">
              Junte-se a profissionais que já gerenciam sua clínica com mais organização e menos estresse.
            </p>
            <Link
              href="/register"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-sm font-semibold text-primary hover:bg-white/90 transition-all"
            >
              Criar conta grátis
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-foreground">
                <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" strokeLinejoin="round" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-sm font-semibold">Zeta</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Zeta. Todos os direitos reservados.</p>
          <div className="flex gap-5 text-xs text-muted-foreground">
            <Link href="/login" className="hover:text-foreground transition-colors">Entrar</Link>
            <Link href="/register" className="hover:text-foreground transition-colors">Cadastrar</Link>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50%       { transform: translateX(-50%) translateY(6px); }
        }
      `}</style>
    </div>
  )
}
