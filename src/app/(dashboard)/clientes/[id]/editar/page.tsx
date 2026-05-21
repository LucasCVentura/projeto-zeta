import { getClientAction } from "@/actions/clients"
import { EditClientForm } from "@/components/clients/edit-client-form"
import { notFound } from "next/navigation"
import Link from "next/link"

type Props = { params: Promise<{ id: string }> }

export default async function EditarClientePage({ params }: Props) {
  const { id } = await params
  const client = await getClientAction(id)
  if (!client) notFound()

  return (
    <div className="container-page max-w-2xl py-6">
      <div className="mb-6 flex items-center gap-3">
        <Link href={`/clientes/${id}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Voltar
        </Link>
      </div>
      <div className="mb-6">
        <h2 className="font-heading text-xl font-semibold">Editar cliente</h2>
        <p className="text-sm text-muted-foreground mt-1">Atualize os dados cadastrais de {client.name}.</p>
      </div>
      <EditClientForm clientId={id} defaultValues={{
        name: client.name,
        phone: client.phone ?? "",
        whatsapp: client.whatsapp ?? "",
        email: client.email ?? "",
        cpf: client.cpf ?? "",
        birthDate: client.birthDate ?? "",
        notes: client.notes ?? "",
      }} />
    </div>
  )
}
