import { notFound } from "next/navigation"
import Link from "next/link"
import { getClientAction } from "@/actions/clients"
import { getClientPackagesAction, getPackagesAction } from "@/actions/packages"
import { getOrganizationAction } from "@/actions/organization"
import { getClientDocumentsAction } from "@/actions/documents"
import { ClientPackagesSection } from "@/components/packages/client-packages-section"
import { ClientHistory } from "@/components/clients/client-history"
import { ClientDocumentsSection } from "@/components/clients/client-documents-section"
import { ArrowLeft, Phone, Mail, CalendarDays, Pencil, Images } from "lucide-react"

type Props = { params: Promise<{ id: string }> }

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "—"
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "long", year: "numeric",
  })
}

function formatDateTime(date: string, time: string) {
  return `${new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "short",
  })} às ${time.slice(0, 5)}`
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

export default async function ClientePerfilPage({ params }: Props) {
  const { id } = await params
  const data = await getClientAction(id)
  if (!data) notFound()

  const [clientPackages, allPackages, org, documents] = await Promise.all([
    getClientPackagesAction(id).catch((error) => {
      console.error("[clientes/:id] getClientPackagesAction failed", { clientId: id, error })
      return []
    }),
    getPackagesAction().catch((error) => {
      console.error("[clientes/:id] getPackagesAction failed", { clientId: id, error })
      return []
    }),
    getOrganizationAction().catch((error) => {
      console.error("[clientes/:id] getOrganizationAction failed", { clientId: id, error })
      return null
    }),
    getClientDocumentsAction(id).catch((error) => {
      console.error("[clientes/:id] getClientDocumentsAction failed", { clientId: id, error })
      return []
    }),
  ])

  const { client, anamnesis, history } = data

  return (
    <div className="container-page max-w-2xl py-6 space-y-6">
      {/* Voltar */}
      <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} />
        Clientes
      </Link>

      {/* Header do cliente */}
      <div className="surface flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {getInitials(client.name)}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-xl font-semibold">{client.name}</h2>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {(client.whatsapp ?? client.phone) && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Phone size={13} /> {client.whatsapp ?? client.phone}
              </span>
            )}
            {client.email && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <Mail size={13} /> {client.email}
              </span>
            )}
            {client.birthDate && (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <CalendarDays size={13} /> {formatDate(client.birthDate)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/clientes/${id}/fotos`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
          >
            <Images size={13} />
          </Link>
          <Link
            href={`/clientes/${id}/editar`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
          >
            <Pencil size={13} />
          </Link>
        </div>
      </div>

      {/* Observações internas */}
      {client.notes && (
        <div className="surface space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observações</p>
          <p className="text-sm">{client.notes}</p>
        </div>
      )}

      {/* Anamnese */}
      <div className="surface space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Ficha de anamnese</p>
          <Link href={`/clientes/${id}/anamnese`} className="text-xs text-primary hover:underline underline-offset-4">
            Editar ficha
          </Link>
        </div>

        {!anamnesis ? (
          <p className="text-sm text-muted-foreground">Ficha ainda não preenchida.</p>
        ) : (
          <div className="space-y-3">
            {anamnesis.aestheticGoal && (
              <InfoRow label="Objetivo estético" value={anamnesis.aestheticGoal} />
            )}
            {anamnesis.skinType && (
              <InfoRow label="Tipo de pele" value={anamnesis.skinType} />
            )}
            <BoolRow label="Alergias" active={anamnesis.hasAllergies} detail={anamnesis.allergiesDetail} />
            <BoolRow label="Contraindicações" active={anamnesis.hasContraindications} detail={anamnesis.contraindicationsDetail} />
            <BoolRow label="Medicamentos" active={anamnesis.usesMedication} detail={anamnesis.medicationDetail} />
            <BoolRow label="Doença crônica" active={anamnesis.hasChronicCondition} detail={anamnesis.chronicConditionDetail} />
            {anamnesis.isPregnant && (
              <div className="flex items-center gap-2 rounded-lg bg-yellow-50 border border-yellow-200 px-3 py-2">
                <span className="text-xs font-medium text-yellow-700">Gestante</span>
              </div>
            )}
            {anamnesis.skinComplaints && (
              <InfoRow label="Queixas da pele" value={anamnesis.skinComplaints} />
            )}
            {anamnesis.previousProcedures && (
              <InfoRow label="Procedimentos anteriores" value={anamnesis.previousProcedures} />
            )}
            {anamnesis.extraNotes && (
              <InfoRow label="Obs. extras" value={anamnesis.extraNotes} />
            )}
          </div>
        )}
      </div>

      {/* Pacotes */}
      <ClientPackagesSection
        clientId={id}
        clientPhone={client.phone ?? undefined}
        clientName={client.name}
        clientPackages={clientPackages}
        availablePackages={allPackages}
        orgName={org?.name ?? ""}
        orgAddress={org?.address ?? undefined}
      />

      {/* Documentos */}
      <ClientDocumentsSection clientId={id} documents={documents} />

      {/* Histórico de atendimentos */}
      <ClientHistory history={history} />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

function BoolRow({ label, active, detail }: { label: string; active: boolean | null; detail: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <div className="text-right">
        <span className={active ? "text-destructive font-medium" : "text-muted-foreground"}>
          {active ? "Sim" : "Não"}
        </span>
        {active && detail && <p className="text-xs text-muted-foreground">{detail}</p>}
      </div>
    </div>
  )
}
