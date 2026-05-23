import { KiraMark } from "@/components/ui/kira-mark"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Form panel — mobile: full screen, desktop: right side */}
      <div className="flex min-h-screen flex-col justify-center px-6 py-12 lg:order-2 lg:px-12">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
            <SparkleIcon />
          </div>
          <span className="text-lg font-semibold tracking-tight">Kira</span>
        </div>

        <div className="mx-auto w-full max-w-sm sm:max-w-md">{children}</div>
      </div>

      {/* Branding panel — desktop only, left side */}
      <div className="relative hidden overflow-hidden bg-primary lg:order-1 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -right-16 h-112 w-md rounded-full bg-white/5" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95">
            <SparkleIcon />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Kira</span>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="font-heading text-4xl font-bold leading-tight text-white">
              Gerencie sua clínica com elegância
            </h1>
            <p className="text-lg leading-relaxed text-white/70">
              A plataforma pensada para profissionais da estética e biomédicos estetas que buscam excelência no atendimento.
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {[
              "Agenda inteligente e gestão de clientes",
              "Prontuários e registros de procedimentos",
              "Controle financeiro simplificado",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <CheckIcon />
                </span>
                <span className="text-sm text-white/80">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-white/40">
          © {new Date().getFullYear()} Kira. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}

function SparkleIcon() {
  return <KiraMark size={23} />
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
