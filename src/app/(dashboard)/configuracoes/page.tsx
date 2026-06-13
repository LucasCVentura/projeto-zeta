import Link from "next/link"
import { Calendar, Stethoscope, Building2, ChevronRight, Package, CreditCard, Users, ClipboardList, ScrollText } from "lucide-react"
import { InstallAppButton } from "@/components/settings/install-app-button"
import { requireSession } from "@/lib/session"
import { can } from "@/lib/permissions"

export default async function ConfiguracoesPage() {
  const { role } = await requireSession()

  const sections = [
    {
      title: "Agenda",
      description: "Dias de trabalho, horários e duração dos atendimentos",
      href: "/configuracoes/agenda",
      icon: Calendar,
      show: true,
    },
    {
      title: "Procedimentos",
      description: "Catálogo de procedimentos e valores",
      href: "/configuracoes/procedimentos",
      icon: Stethoscope,
      show: can(role, "org:update"),
    },
    {
      title: "Pacotes",
      description: "Pacotes de sessões para oferecer aos clientes",
      href: "/configuracoes/pacotes",
      icon: Package,
      show: can(role, "org:update"),
    },
    {
      title: "Clínica",
      description: "Nome, contato e informações da sua clínica",
      href: "/configuracoes/clinica",
      icon: Building2,
      show: can(role, "org:update"),
    },
    {
      title: "Anamnese",
      description: "Personalize as perguntas da ficha de cada cliente",
      href: "/configuracoes/anamnese",
      icon: ClipboardList,
      show: can(role, "org:update"),
    },
    {
      title: "Termos",
      description: "Termos de consentimento exibidos na ficha de anamnese",
      href: "/configuracoes/termos",
      icon: ScrollText,
      show: can(role, "org:update"),
    },
  ].filter((s) => s.show)

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

        {role === "owner" && (
          <Link
            href="/configuracoes/equipe"
            className="surface flex items-center gap-4 hover:border-primary/30 hover:bg-primary/5 transition-colors no-underline"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Equipe</p>
              <p className="text-xs text-muted-foreground">Convide profissionais e gerencie acessos</p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </Link>
        )}
      </div>

      <InstallAppButton />

      {role === "owner" && (
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
      )}
    </div>
  )
}
