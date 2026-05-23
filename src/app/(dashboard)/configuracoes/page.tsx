import Link from "next/link"
import { Calendar, Stethoscope, Building2, ChevronRight, Package, CreditCard } from "lucide-react"

const sections = [
  {
    title: "Agenda",
    description: "Dias de trabalho, horários e duração dos atendimentos",
    href: "/configuracoes/agenda",
    icon: Calendar,
  },
  {
    title: "Procedimentos",
    description: "Catálogo de procedimentos e valores",
    href: "/configuracoes/procedimentos",
    icon: Stethoscope,
  },
  {
    title: "Pacotes",
    description: "Pacotes de sessões para oferecer aos clientes",
    href: "/configuracoes/pacotes",
    icon: Package,
  },
  {
    title: "Clínica",
    description: "Nome, contato e informações da sua clínica",
    href: "/configuracoes/clinica",
    icon: Building2,
  },
]

export default function ConfiguracoesPage() {
  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <div className="space-y-2">
        {sections.map(({ title, description, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="surface flex items-center gap-4 hover:border-primary/30 hover:bg-primary/5 transition-colors no-underline"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{title}</p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>

      <Link
        href="/configuracoes/assinatura"
        className="surface flex items-center gap-4 hover:border-primary/30 hover:bg-primary/5 transition-colors no-underline"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <CreditCard size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Assinatura</p>
          <p className="text-xs text-muted-foreground">Status, próxima cobrança e dados de pagamento</p>
        </div>
        <ChevronRight size={16} className="text-muted-foreground shrink-0" />
      </Link>
    </div>
  )
}
