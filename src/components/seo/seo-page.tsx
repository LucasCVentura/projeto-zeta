import Link from "next/link"
import { KiraMark } from "@/components/ui/kira-mark"

export type SeoPageContent = {
  eyebrow: string
  title: string
  description: string
  heroCardTitle: string
  primaryCta?: string
  pains: string[]
  benefits: { title: string; description: string }[]
  features: string[]
  workflowTitle: string
  workflowDescription: string
  workflow: { title: string; description: string }[]
  faqs: { question: string; answer: string }[]
  relatedPages?: { title: string; href: string; description: string }[]
}

export function SeoPage({ content }: { content: SeoPageContent }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <header className="border-b border-border bg-background/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
              <KiraMark size={32} />
            </div>
            <span className="font-semibold tracking-tight">Kira</span>
          </Link>
          <Link href="/register" className="rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Começar grátis
          </Link>
        </div>
      </header>

      <section className="px-5 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-medium text-primary">{content.eyebrow}</p>
            <h1 className="font-heading text-4xl font-bold leading-tight sm:text-5xl">
              {content.title}
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
              {content.description}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                {content.primaryCta ?? "Começar 7 dias grátis"}
              </Link>
              <Link href="/" className="inline-flex h-12 items-center justify-center rounded-full border border-border px-7 text-sm font-medium hover:bg-accent transition-colors">
                Conhecer o Kira
              </Link>
            </div>
            <p className="text-xs text-muted-foreground">Sem cartão de crédito no teste · Suporte por WhatsApp</p>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-primary/10">
            <p className="mb-4 text-sm font-semibold">{content.heroCardTitle}</p>
            <div className="space-y-3">
              {content.features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-primary/3 px-5 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Por que isso importa</p>
            <h2 className="font-heading text-3xl font-bold">A rotina cresce, a organização precisa acompanhar</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {content.pains.map((pain) => (
              <div key={pain} className="rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed">
                {pain}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary">Na prática</p>
            <h2 className="font-heading text-3xl font-bold">{content.workflowTitle}</h2>
            <p className="text-muted-foreground leading-relaxed">{content.workflowDescription}</p>
          </div>
          <div className="space-y-3">
            {content.workflow.map((item, index) => (
              <article key={item.title} className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[3rem_1fr]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl space-y-3">
            <p className="text-sm font-medium text-primary">Como o Kira ajuda</p>
            <h2 className="font-heading text-3xl font-bold">Mais controle sem deixar sua rotina pesada</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {content.benefits.map((benefit) => (
              <article key={benefit.title} className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-semibold">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-primary/3 px-5 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="space-y-4">
            <p className="text-sm font-medium text-primary">Dúvidas frequentes</p>
            <h2 className="font-heading text-3xl font-bold">Antes de começar</h2>
            <p className="text-muted-foreground">Respostas rápidas para entender se o Kira combina com sua operação.</p>
          </div>
          <div className="space-y-3">
            {content.faqs.map((faq) => (
              <details key={faq.question} className="group rounded-2xl border border-border bg-card p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                  {faq.question}
                  <span className="text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {content.relatedPages && content.relatedPages.length > 0 && (
        <section className="border-t border-border px-5 py-16">
          <div className="mx-auto max-w-6xl">
            <p className="mb-6 text-sm font-medium text-primary">Veja também</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {content.relatedPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">{page.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{page.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="px-5 py-20">
        <div className="mx-auto max-w-4xl rounded-3xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <h2 className="font-heading text-3xl font-bold">Comece a organizar sua rotina no Kira</h2>
          <p className="mx-auto mt-3 max-w-xl text-primary-foreground/75">
            Teste grátis por 7 dias e veja se o Kira se encaixa no seu jeito de atender.
          </p>
          <Link href="/register" className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-primary hover:bg-white/90 transition-colors">
            Criar conta grátis
          </Link>
        </div>
      </section>
    </main>
  )
}
