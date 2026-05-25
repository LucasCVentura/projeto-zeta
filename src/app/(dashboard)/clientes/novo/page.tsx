import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ClientForm } from "@/components/clients/client-form"

export default function NovoClientePage() {
  return (
    <div className="container-page max-w-2xl py-6 space-y-6">
      <div>
        <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Clientes
        </Link>
        <h2 className="font-heading text-xl font-semibold mt-3">Novo cliente</h2>
        <p className="text-sm text-muted-foreground mt-1">Preencha os dados cadastrais e a ficha de anamnese.</p>
      </div>
      <ClientForm />
    </div>
  )
}
