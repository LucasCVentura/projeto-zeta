"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createAppointmentAction, getClientsAction, getProceduresForBookingAction } from "@/actions/schedule"
import { suggestRecurrenceAction } from "@/actions/ai"
import { getActiveClientPackagesForProcedureAction } from "@/actions/packages"
import { Search, User, ChevronDown, X, Sparkles, Loader2, Package } from "lucide-react"
import { cn } from "@/lib/utils"

const schema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  procedureId: z.string().optional(),
  notes: z.string().optional(),
  recurring: z.boolean(),
  frequency: z.enum(["weekly", "biweekly", "monthly"]),
  recurrenceCount: z.number().min(2).max(12),
})

type FormData = z.infer<typeof schema>
type Client = { id: string; name: string; phone: string | null }
type Procedure = { id: string; name: string; price: number }
type ActivePackage = { id: string; packageName: string; sessionsUsed: number; totalSessions: number; sessionsRemaining: number }

const FREQUENCY_OPTIONS = [
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quinzenal" },
  { value: "monthly", label: "Mensal" },
] as const

type Professional = { id: string; name: string }

type Props = {
  open: boolean
  onClose: (warning?: string) => void
  date: string
  time: string
  professionals?: Professional[]
}

function formatPrice(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function AppointmentModal({ open, onClose, date, time, professionals = [] }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [procedures, setProcedures] = useState<Procedure[]>([])

  const [clientSearch, setClientSearch] = useState("")
  const [clientPickerOpen, setClientPickerOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const [procedurePickerOpen, setProcedurePickerOpen] = useState(false)
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null)

  const [activePackages, setActivePackages] = useState<ActivePackage[]>([])
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)

  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string>("")

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { recurring: false, frequency: "weekly", recurrenceCount: 4 },
    })

  const recurring = watch("recurring")
  const frequency = watch("frequency")
  const recurrenceCount = watch("recurrenceCount")

  useEffect(() => {
    if (open) {
      getClientsAction().then((d) => setClients(d as Client[]))
      getProceduresForBookingAction().then((d) => setProcedures(d))
      reset({ recurring: false, frequency: "weekly", recurrenceCount: 4 })
      setSelectedClient(null)
      setSelectedProcedure(null)
      setActivePackages([])
      setSelectedPackageId(null)
      setSelectedProfessionalId("")
      setClientSearch("")
      setError(null)
      setAiExplanation(null)
    }
  }, [open, reset])

  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
    (c.phone ?? "").includes(clientSearch)
  )

  function selectClient(client: Client) {
    setSelectedClient(client)
    setValue("clientId", client.id)
    setClientPickerOpen(false)
    setClientSearch("")
  }

  async function selectProcedure(proc: Procedure) {
    setSelectedProcedure(proc)
    setValue("procedureId", proc.id)
    setProcedurePickerOpen(false)
    setSelectedPackageId(null)
    setActivePackages([])
    if (selectedClient) {
      const pkgs = await getActiveClientPackagesForProcedureAction(selectedClient.id, proc.id)
      setActivePackages(pkgs as ActivePackage[])
    }
  }

  async function handleAiSuggest() {
    if (!selectedClient) return
    setAiLoading(true)
    setAiExplanation(null)
    const result = await suggestRecurrenceAction(selectedClient.id)
    setAiLoading(false)
    if (!result.success || !result.frequency) {
      setAiExplanation(result.error ?? "Não foi possível gerar sugestão.")
      return
    }
    setValue("frequency", result.frequency)
    setValue("recurrenceCount", result.count ?? 4)
    setAiExplanation(result.explanation ?? null)
  }

  function clearProcedure() {
    setSelectedProcedure(null)
    setValue("procedureId", "")
    setActivePackages([])
    setSelectedPackageId(null)
  }

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await createAppointmentAction({
      clientId: data.clientId,
      date,
      startTime: time,
      procedureId: data.procedureId || undefined,
      procedure: selectedProcedure?.name,
      clientPackageId: selectedPackageId || undefined,
      notes: data.notes,
      professionalId: selectedProfessionalId || undefined,
      recurrence: data.recurring
        ? { frequency: data.frequency, count: data.recurrenceCount }
        : undefined,
    })
    setIsLoading(false)
    if (!result.success) { setError(result.error); return }
    if (result.skipped && result.skipped > 0) {
      // fecha mas avisa sobre pulados
      onClose(`${result.skipped} horário${result.skipped > 1 ? "s" : ""} já ocupado${result.skipped > 1 ? "s" : ""} foram pulados.`)
      return
    }
    onClose()
  }

  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  })

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Novo agendamento</DialogTitle>
          <p className="text-sm text-muted-foreground capitalize">
            {formattedDate} às {time}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <PickerButton
              selected={selectedClient ? { label: selectedClient.name, sub: selectedClient.phone ?? undefined } : null}
              placeholder="Selecionar cliente..."
              isOpen={clientPickerOpen}
              onToggle={() => setClientPickerOpen((v) => !v)}
              onClear={() => { setSelectedClient(null); setValue("clientId", "") }}
            />
            {clientPickerOpen && (
              <PickerDropdown
                search={clientSearch}
                onSearch={setClientSearch}
                placeholder="Buscar cliente..."
                empty={clients.length === 0 ? "Nenhum cliente cadastrado" : "Sem resultados"}
                emptyLink={clients.length === 0 ? { href: "/clientes/novo", label: "Cadastrar cliente" } : undefined}
              >
                {filteredClients.map((c) => (
                  <PickerItem
                    key={c.id}
                    label={c.name}
                    sub={c.phone ?? undefined}
                    onClick={() => selectClient(c)}
                  />
                ))}
              </PickerDropdown>
            )}
            {errors.clientId && <p className="text-destructive text-xs">{errors.clientId.message}</p>}
          </div>

          {/* Procedimento */}
          <div className="space-y-2">
            <Label>Procedimento <span className="text-muted-foreground">(opcional)</span></Label>
            <PickerButton
              selected={selectedProcedure
                ? { label: selectedProcedure.name, sub: formatPrice(selectedProcedure.price) }
                : null}
              placeholder="Selecionar procedimento..."
              isOpen={procedurePickerOpen}
              onToggle={() => setProcedurePickerOpen((v) => !v)}
              onClear={clearProcedure}
            />
            {procedurePickerOpen && (
              <PickerDropdown
                search=""
                onSearch={() => {}}
                placeholder=""
                showSearch={false}
                empty="Nenhum procedimento cadastrado"
                emptyLink={{ href: "/configuracoes/procedimentos", label: "Cadastrar procedimentos" }}
              >
                {procedures.map((p) => (
                  <PickerItem
                    key={p.id}
                    label={p.name}
                    sub={formatPrice(p.price)}
                    onClick={() => selectProcedure(p)}
                  />
                ))}
              </PickerDropdown>
            )}
          </div>

          {/* Pacotes ativos do cliente para este procedimento */}
          {activePackages.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Package size={13} className="text-primary" />
                Usar sessão de pacote
              </Label>
              <div className="space-y-1.5">
                {activePackages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackageId(selectedPackageId === pkg.id ? null : pkg.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
                      selectedPackageId === pkg.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <span className="font-medium">{pkg.packageName}</span>
                    <span className={cn("text-xs", selectedPackageId === pkg.id ? "text-primary" : "text-muted-foreground")}>
                      {pkg.sessionsRemaining} {pkg.sessionsRemaining !== 1 ? "sessões" : "sessão"} restante{pkg.sessionsRemaining !== 1 ? "s" : ""}
                    </span>
                  </button>
                ))}
              </div>
              {selectedPackageId && (
                <p className="text-xs text-primary">
                  Sessão será descontada do pacote ao concluir o atendimento.
                </p>
              )}
            </div>
          )}

          {/* Profissional responsável — visível apenas para owner/receptionist */}
          {professionals.length > 0 && (
            <div className="space-y-2">
              <Label>Profissional responsável</Label>
              <select
                value={selectedProfessionalId}
                onChange={(e) => setSelectedProfessionalId(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Selecionar profissional...</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {!selectedProfessionalId && (
                <p className="text-xs text-muted-foreground">Se não selecionado, será atribuído a você.</p>
              )}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label>Observações <span className="text-muted-foreground">(opcional)</span></Label>
            <Input placeholder="Notas internas sobre o atendimento..." {...register("notes")} />
          </div>

          {/* Recorrência */}
          <div className="space-y-3 rounded-lg border border-border p-3">
            <button
              type="button"
              onClick={() => setValue("recurring", !recurring)}
              className="flex w-full items-center justify-between text-sm"
            >
              <span className="font-medium">Repetir agendamento</span>
              <div className={cn(
                "relative h-6 w-10 shrink-0 rounded-full outline-none transition-colors",
                recurring ? "bg-primary" : "bg-muted"
              )}>
                <div className={cn(
                  "absolute top-0.5 left-0 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                  recurring ? "translate-x-4.5" : "translate-x-0.5"
                )} />
              </div>
            </button>

            {recurring && (
              <div className="space-y-3 pt-1">
                <div className="flex gap-2">
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setValue("frequency", opt.value)}
                      className={cn(
                        "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                        frequency === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground shrink-0">Repetições</Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setValue("recurrenceCount", Math.max(2, recurrenceCount - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
                    >
                      <span className="text-base leading-none">−</span>
                    </button>
                    <span className="w-8 text-center text-sm font-medium">{recurrenceCount}×</span>
                    <button
                      type="button"
                      onClick={() => setValue("recurrenceCount", Math.min(12, recurrenceCount + 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
                    >
                      <span className="text-base leading-none">+</span>
                    </button>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    = {recurrenceCount} agendamentos
                  </span>
                </div>

                {selectedClient && (
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4 disabled:opacity-50"
                  >
                    {aiLoading
                      ? <Loader2 size={12} className="animate-spin" />
                      : <Sparkles size={12} />
                    }
                    {aiLoading ? "Analisando histórico..." : "Sugerir com IA"}
                  </button>
                )}

                {aiExplanation && (
                  <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
                    <Sparkles size={12} className="text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">{aiExplanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onClose()}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Agendar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Componentes reutilizáveis de picker ───────────────────────────────────────

function PickerButton({
  selected, placeholder, isOpen, onToggle, onClear,
}: {
  selected: { label: string; sub?: string } | null
  placeholder: string
  isOpen: boolean
  onToggle: () => void
  onClear: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm transition-colors",
        isOpen ? "border-primary ring-2 ring-primary/20" : "border-input hover:border-primary/40"
      )}
    >
      {selected ? (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {selected.label[0].toUpperCase()}
          </div>
          <span className="font-medium">{selected.label}</span>
          {selected.sub && <span className="text-muted-foreground text-xs">{selected.sub}</span>}
        </div>
      ) : (
        <span className="text-muted-foreground">{placeholder}</span>
      )}
      <div className="flex items-center gap-1">
        {selected && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => { e.stopPropagation(); onClear() }}
            className="rounded p-0.5 hover:bg-muted"
          >
            <X size={13} className="text-muted-foreground" />
          </span>
        )}
        <ChevronDown size={15} className={cn("text-muted-foreground transition-transform", isOpen && "rotate-180")} />
      </div>
    </button>
  )
}

function PickerDropdown({
  children, search, onSearch, placeholder, showSearch = true, empty, emptyLink,
}: {
  children: React.ReactNode
  search: string
  onSearch: (v: string) => void
  placeholder: string
  showSearch?: boolean
  empty: string
  emptyLink?: { href: string; label: string }
}) {
  return (
    <div className="rounded-lg border border-border bg-card shadow-lg overflow-hidden">
      {showSearch && (
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Search size={14} className="shrink-0 text-muted-foreground" />
          <input
            autoFocus
            placeholder={placeholder}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}
      <div className="max-h-48 overflow-y-auto">
        {!children || (Array.isArray(children) && children.length === 0) ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <User size={16} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{empty}</p>
            {emptyLink && (
              <a href={emptyLink.href} className="text-xs text-primary hover:underline">
                {emptyLink.label}
              </a>
            )}
          </div>
        ) : children}
      </div>
    </div>
  )
}

function PickerItem({ label, sub, onClick }: { label: string; sub?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-accent transition-colors"
    >
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {label[0].toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium truncate">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </button>
  )
}
