import { getClientAction } from "@/actions/clients"
import { EditClientForm } from "@/components/clients/edit-client-form"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params
  const data = await getClientAction(id)
  if (!data) notFound()
  const { client } = data

  return (
    <div className="container-page max-w-2xl py-6 space-y-6">
      <div>
        <Link href={`/clientes/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> {client.name}
        </Link>
        <h2 className="font-heading text-xl font-semibold mt-3">Editar cliente</h2>
        <p className="text-sm text-muted-foreground mt-1">Atualize os dados cadastrais de {client.name}.</p>
      </div>
      <EditClientForm clientId={id} defaultValues={{
        name: client.name,
        whatsapp: client.whatsapp ?? client.phone ?? "",
        email: client.email ?? "",
        cpf: client.cpf ?? "",
        birthDate: client.birthDate ?? "",
        notes: client.notes ?? "",
      }} />
    </div>
  )
}
