import type { Metadata } from "next"
import Link from "next/link"
import {
  Calendar,
  ClipboardList,
  Wallet,
  Package,
  MessageCircle,
  Sparkles,
  Check,
} from "lucide-react"
import { KiraMark } from "@/components/ui/kira-mark"

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
      "Histórico de procedimentos, observações e fotos de evolução organizados — a base que você aprendeu a valorizar nos conteúdos do Manual NF, agora na prática.",
  },
  {
    icon: Wallet,
    title: "Financeiro sem planilha",
    description: "Receita do mês, atendimentos realizados e o que cada cliente já pagou, num relance.",
  },
  {
    icon: Package,
    title: "Pacotes de sessões",
    description: "Venda pacotes de procedimentos e acompanhe quantas sessões já foram usadas, sem controle manual.",
  },
]

export default function ManualNfWelcomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="https://www.kiraclinic.com.br" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
              <KiraMark size={32} />
            </div>
            <span className="font-semibold tracking-tight">Kira</span>
          </Link>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            em parceria com o Manual NF
          </span>
        </div>
      </header>

      <section className="px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Sparkles className="size-3.5" />
            Parceria Manual NF × Kira
          </p>
          <h1 className="mt-5 font-heading text-4xl font-bold leading-tight sm:text-5xl">
            Você estudou a teoria. Agora organize a clínica pra colocar em prática.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Como aluna do Manual NF, você ganha{" "}
            <span className="font-semibold text-foreground">30 dias grátis no Kira</span> — o
            sistema de gestão feito pra quem vive de estética, em vez dos 7 dias padrão.
          </p>

          <div className="mx-auto mt-8 inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Check className="size-3.5" />
            </span>
            <span>
              <span className="font-semibold text-foreground">30 dias grátis</span>{" "}
              <span className="text-muted-foreground">(o dobro do normal) · sem cartão de crédito</span>
            </span>
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/register?ref=manual-nf"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Criar conta com 30 dias grátis
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border px-7 text-sm font-medium transition-colors hover:bg-accent"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-primary/3 px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <p className="text-sm font-medium text-primary">O que o Kira organiza</p>
            <h2 className="mt-2 font-heading text-3xl font-bold">
              A rotina de atender, sem depender de WhatsApp e caderno
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {pillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <pillar.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{pillar.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {pillar.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="size-5" />
            </span>
            <p className="font-semibold">Depois do teste</p>
          </div>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Ao final dos 30 dias, o Kira custa{" "}
            <span className="font-semibold text-foreground">R$ 49,90/mês</span>, com agenda,
            prontuários, financeiro, estoque e pacotes de sessão incluídos — sem taxa de setup e
            sem fidelidade. Se não fizer sentido pra sua rotina, é só não continuar.
          </p>
          <Link
            href="/register?ref=manual-nf"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Começar meus 30 dias grátis
          </Link>
        </div>
      </section>
    </main>
  )
}
