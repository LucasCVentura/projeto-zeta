import { ImportClientsView } from "@/components/clients/import-clients-view"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ImportarClientesPage() {
  return (
    <div className="container-page max-w-2xl py-6 space-y-6">
      <div>
        <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={14} /> Clientes
        </Link>
        <h2 className="font-heading text-xl font-semibold mt-3">Importar clientes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Importe sua lista de clientes a partir de um arquivo CSV ou Excel.
        </p>
      </div>
      <ImportClientsView />
    </div>
  )
}
