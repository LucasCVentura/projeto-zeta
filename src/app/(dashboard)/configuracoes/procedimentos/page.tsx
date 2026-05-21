import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getProceduresAction } from "@/actions/procedures"
import { ProceduresList } from "@/components/procedures/procedures-list"

export default async function ProcedimentosPage() {
  const procedures = await getProceduresAction()

  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <Link href="/configuracoes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Configurações
      </Link>
      <div>
        <h2 className="font-heading text-xl font-semibold">Procedimentos</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie o catálogo de procedimentos e valores.
        </p>
      </div>
      <ProceduresList initialProcedures={procedures} />
    </div>
  )
}
