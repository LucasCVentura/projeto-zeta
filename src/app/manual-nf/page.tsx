import type { Metadata } from "next"
import Link from "next/link"
import {
  Calendar,
  ClipboardList,
  Wallet,
  Package,
  Camera,
  MessageCircle,
  ArrowRight,
  Check,
} from "lucide-react"
import { KiraMark } from "@/components/ui/kira-mark"
import { MANUAL_NF_TRIAL_DAYS, DEFAULT_TRIAL_DAYS } from "@/lib/referral"

export const metadata: Metadata = {
  title: "Bem-vinda ao Kira | Parceria Manual NF",
  description:
    "Aluna do Manual NF? Ganhe 30 dias grátis no Kira — o sistema de gestão feito para quem atende estética.",
  openGraph: {
    title: "Bem-vinda ao Kira | Parceria Manual NF",
    description:
      "Aluna do Manual NF? Ganhe 30 dias grátis no Kira — o sistema de gestão feito para quem atende estética.",
    url: "https://www.kiraclinic.com.br/manual-nf",
    type: "website",
  },
  robots: { index: false, follow: true },
}

const REGISTER_HREF = "/register?ref=manual-nf"

const pillars = [
  {
    icon: Calendar,
    title: "Agenda sem WhatsApp perdido",
    description:
      "Horários, confirmações e lembretes automáticos direto pro celular da cliente — sem você precisar lembrar de mandar mensagem.",
  },
  {
    icon: ClipboardList,
    title: "Prontuário de cada cliente",
    description:
      "Histórico de procedimentos, anamnese e observações organizados — a base que você aprendeu a valorizar no Manual NF, agora na prática.",
  },
  {
    icon: Camera,
    title: "Fotos de evolução",
    description:
      "Antes e depois de cada sessão salvos na ficha da cliente, prontos pra mostrar o resultado do seu trabalho.",
  },
  {
    icon: Wallet,
    title: "Financeiro sem planilha",
    description:
      "Receita do mês, ticket médio e o que cada cliente já pagou, num relance — sem fechar planilha no fim do mês.",
  },
  {
    icon: Package,
    title: "Pacotes de sessões",
    description:
      "Venda pacotes e acompanhe quantas sessões já foram usadas — o desconto acontece sozinho a cada atendimento.",
  },
  {
    icon: MessageCircle,
    title: "Suporte de gente de verdade",
    description:
      "Dúvida na hora de configurar? Chama no WhatsApp que a gente responde — sem robô e sem fila.",
  },
]

const testimonials = [
  {
    quote:
      "O Kira me ajudou a organizar agenda, clientes e fotos de evolução sem depender de WhatsApp e anotações soltas. Além dos recursos com IA como apoio na organização da evolução, que me ajudam a ganhar tempo!",
    name: "Nathalia Fialho",
    role: "Biomédica esteta",
    credential: "CRBM-RJ 07488",
    initials: "NF",
  },
  {
    quote:
      "O Kira tem sido uma ferramenta importante para auxiliar na organização da clínica, principalmente no agendamento, controle de pacientes e gestão dos atendimentos. A interface facilita bastante a rotina do dia a dia.",
    name: "Studio Colleto",
    role: "Clínica de estética",
    credential: "@studio_colleto",
    initials: "SC",
  },
]

export default function ManualNfWelcomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="https://www.kiraclinic.com.br" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
              <KiraMark size={32} />
            </div>
            <span className="font-semibold tracking-tight">Kira</span>
          </Link>
          <Link
            href={REGISTER_HREF}
            className="hidden h-9 items-center rounded-full bg-primary px-5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 sm:flex"
          >
            Ativar meus {MANUAL_NF_TRIAL_DAYS} dias
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-32 pb-20 text-center sm:pt-40">
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
            Parceria Manual NF × Kira
          </div>

          <h1 className="font-heading text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Você estudou a teoria.
            <br />
            <span className="text-primary">Agora organize a prática.</span>
          </h1>

          <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            O Kira cuida da agenda, dos prontuários, das fotos de evolução e do financeiro — pra
            você gastar seu tempo atendendo, não organizando.
          </p>
        </div>

        {/* Oferta — o centro da página */}
        <div
          className="relative z-10 mt-10 w-full max-w-md"
          style={{ animation: "fadeUp 0.8s ease 0.15s both" }}
        >
          <div className="relative overflow-hidden rounded-3xl border-2 border-primary/25 bg-card p-8 shadow-xl shadow-primary/10">
            <div
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-30 blur-2xl"
              style={{ background: "radial-gradient(circle, oklch(0.52 0.12 350), transparent 70%)" }}
            />
            <p className="relative text-xs font-semibold uppercase tracking-widest text-primary">
              Exclusivo pra aluna do Manual NF
            </p>

            <div className="relative mt-4 flex items-end justify-center gap-3">
              <span className="font-heading text-6xl font-bold leading-none text-foreground">
                {MANUAL_NF_TRIAL_DAYS}
              </span>
              <span className="pb-1.5 text-left text-sm leading-tight text-muted-foreground">
                dias
                <br />
                grátis
              </span>
            </div>

            <p className="relative mt-3 text-sm text-muted-foreground">
              em vez dos{" "}
              <span className="font-medium text-foreground/70 line-through decoration-primary/60">
                {DEFAULT_TRIAL_DAYS} dias
              </span>{" "}
              de teste padrão
            </p>

            <Link
              href={REGISTER_HREF}
              className="relative mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25"
            >
              Criar minha conta
              <ArrowRight className="size-4" />
            </Link>

            <p className="relative mt-3 text-xs text-muted-foreground">
              Sem cartão de crédito · Sem fidelidade
            </p>
          </div>

          <p className="mt-5 text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </section>

      {/* ── O que o Kira organiza ── */}
      <section className="border-y border-border bg-muted/30 px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-12 max-w-xl text-center space-y-3">
            <p className="text-sm font-medium text-primary">O que o Kira organiza</p>
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              A rotina de atender, sem caderno e sem planilha
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article
                key={pillar.title}
                className="group space-y-3 rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <pillar.icon className="size-5" />
                </span>
                <h3 className="font-semibold">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{pillar.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Prova social ── */}
      <section className="px-5 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-12 max-w-xl text-center space-y-3">
            <p className="text-sm font-medium text-primary">Quem já usa</p>
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              Profissionais organizando a rotina com o Kira
            </h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {testimonials.map((t) => (
              <figure
                key={t.name}
                className="flex h-full flex-col justify-between rounded-3xl border border-primary/20 bg-card p-8 text-center shadow-xl shadow-primary/10"
              >
                <blockquote className="text-base leading-relaxed text-foreground sm:text-lg">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-8 flex flex-col items-center gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.role} · {t.credential}
                    </p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Depois do teste ── */}
      <section className="px-5 pb-24">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8 sm:p-10">
          <p className="text-sm font-medium text-primary">Depois dos {MANUAL_NF_TRIAL_DAYS} dias</p>
          <h2 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
            R$ 49,90 por mês. Só isso.
          </h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              "Agenda e confirmações no WhatsApp",
              "Prontuários e fotos de evolução",
              "Financeiro, estoque e pacotes",
              "Sem taxa de setup nem fidelidade",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Se não fizer sentido pra sua rotina, é só não continuar — a gente não cobra nada durante
            o teste e não pede cartão pra começar.
          </p>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="px-5 pb-24">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center">
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white blur-3xl" />
            <div className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full bg-white blur-3xl" />
          </div>
          <div className="relative space-y-5">
            <h2 className="font-heading text-3xl font-bold text-primary-foreground sm:text-4xl">
              Comece agora com {MANUAL_NF_TRIAL_DAYS} dias grátis
            </h2>
            <p className="mx-auto max-w-md text-primary-foreground/80">
              Leva menos de 2 minutos pra criar a conta e já sair agendando.
            </p>
            <Link
              href={REGISTER_HREF}
              className="mx-auto flex h-12 w-fit items-center gap-2 rounded-full bg-background px-8 text-sm font-semibold text-foreground transition-transform hover:scale-[1.02]"
            >
              Ativar meus {MANUAL_NF_TRIAL_DAYS} dias
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-5 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
              <KiraMark size={28} />
            </div>
            <span className="text-sm font-semibold">Kira</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Kira em parceria com o Manual NF · kiraclinic.com.br
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
