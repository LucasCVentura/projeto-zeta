import { getOrganizationBySlug } from "@/lib/public-booking"
import { KiraMark } from "@/components/ui/kira-mark"
import { BookingFlow } from "./booking-flow"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)
  return { title: org ? `Agendar com ${org.name} — Kira` : "Agendamento — Kira" }
}

export default async function AgendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)

  if (!org) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
            <KiraMark size={23} />
          </div>
          <p className="text-base font-medium">Link inválido.</p>
          <p className="text-sm text-muted-foreground">Confira o endereço com quem te enviou o link.</p>
        </div>
      </div>
    )
  }

  return (
    <BookingFlow
      slug={slug}
      orgId={org.id}
      orgName={org.name}
      orgType={org.type}
      orgPhone={org.phone}
    />
  )
}
