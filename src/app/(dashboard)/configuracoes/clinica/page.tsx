import { getOrganizationAction } from "@/actions/organization"
import { ClinicForm } from "@/components/settings/clinic-form"
import Link from "next/link"

export default async function ClinicaPage() {
  const org = await getOrganizationAction()

  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/configuracoes" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Configurações
        </Link>
      </div>
      <div>
        <h2 className="font-heading text-xl font-semibold">Clínica</h2>
        <p className="text-sm text-muted-foreground mt-1">Nome, contato e informações da sua clínica.</p>
      </div>
      <ClinicForm defaultValues={{
        name: org?.name ?? "",
        phone: org?.phone ?? "",
        email: org?.email ?? "",
        instagram: org?.instagram ?? "",
        address: org?.address ?? "",
      }} />
    </div>
  )
}
