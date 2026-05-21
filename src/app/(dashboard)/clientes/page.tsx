import Link from "next/link"
import { getClientsListAction } from "@/actions/clients"
import { ClientsList } from "@/components/clients/clients-list"
import { UserPlus } from "lucide-react"

type Props = { searchParams: Promise<{ q?: string; letra?: string }> }

export default async function ClientesPage({ searchParams }: Props) {
  const params = await searchParams
  const clients = await getClientsListAction(params.q)

  return (
    <div className="container-page py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {clients.length} {clients.length === 1 ? "cliente" : "clientes"}
          </p>
        </div>
        <Link
          href="/clientes/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <UserPlus size={15} />
          Novo cliente
        </Link>
      </div>

      <ClientsList clients={clients} initialSearch={params.q} initialLetra={params.letra} />
    </div>
  )
}
