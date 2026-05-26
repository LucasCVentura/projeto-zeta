"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { getClientAction, upsertAnamnesisAction } from "@/actions/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const SKIN_TYPES = ["Normal", "Oleosa", "Seca", "Mista", "Sensível"]

type AnamnesisData = {
  hasAllergies: boolean
  allergiesDetail: string
  hasContraindications: boolean
  contraindicationsDetail: string
  usesMedication: boolean
  medicationDetail: string
  hasChronicCondition: boolean
  chronicConditionDetail: string
  isPregnant: boolean
  skinType: string
  aestheticGoal: string
  skinComplaints: string
  previousProcedures: string
  extraNotes: string
}

const defaultData: AnamnesisData = {
  hasAllergies: false, allergiesDetail: "",
  hasContraindications: false, contraindicationsDetail: "",
  usesMedication: false, medicationDetail: "",
  hasChronicCondition: false, chronicConditionDetail: "",
  isPregnant: false,
  skinType: "", aestheticGoal: "", skinComplaints: "", previousProcedures: "", extraNotes: "",
}

export default function EditarAnamnesePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<AnamnesisData>(defaultData)
  const [clientName, setClientName] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getClientAction(id).then((result) => {
      if (!result) {
        setIsLoading(false)
        setError("Cliente não encontrado ou sem acesso.")
        router.replace("/clientes")
        return
      }
      setClientName(result.client.name)
      if (result.anamnesis) {
        setData({
          hasAllergies: result.anamnesis.hasAllergies ?? false,
          allergiesDetail: result.anamnesis.allergiesDetail ?? "",
          hasContraindications: result.anamnesis.hasContraindications ?? false,
          contraindicationsDetail: result.anamnesis.contraindicationsDetail ?? "",
          usesMedication: result.anamnesis.usesMedication ?? false,
          medicationDetail: result.anamnesis.medicationDetail ?? "",
          hasChronicCondition: result.anamnesis.hasChronicCondition ?? false,
          chronicConditionDetail: result.anamnesis.chronicConditionDetail ?? "",
          isPregnant: result.anamnesis.isPregnant ?? false,
          skinType: result.anamnesis.skinType ?? "",
          aestheticGoal: result.anamnesis.aestheticGoal ?? "",
          skinComplaints: result.anamnesis.skinComplaints ?? "",
          previousProcedures: result.anamnesis.previousProcedures ?? "",
          extraNotes: result.anamnesis.extraNotes ?? "",
        })
      }
      setIsLoading(false)
    })
  }, [id, router])

  function set<K extends keyof AnamnesisData>(key: K, value: AnamnesisData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    const result = await upsertAnamnesisAction(id, {
      hasAllergies: data.hasAllergies,
      allergiesDetail: data.allergiesDetail || null,
      hasContraindications: data.hasContraindications,
      contraindicationsDetail: data.contraindicationsDetail || null,
      usesMedication: data.usesMedication,
      medicationDetail: data.medicationDetail || null,
      hasChronicCondition: data.hasChronicCondition,
      chronicConditionDetail: data.chronicConditionDetail || null,
      isPregnant: data.isPregnant,
      skinType: data.skinType || null,
      aestheticGoal: data.aestheticGoal || null,
      skinComplaints: data.skinComplaints || null,
      previousProcedures: data.previousProcedures || null,
      extraNotes: data.extraNotes || null,
    })
    setIsSaving(false)
    if (!result.success) { setError(result.error ?? "Erro ao salvar."); return }
    router.push(`/clientes/${id}`)
  }

  if (isLoading) return <div className="container-page py-12 text-center text-sm text-muted-foreground">Carregando...</div>

  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <Link href={`/clientes/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> {clientName}
      </Link>

      <div>
        <h2 className="font-heading text-xl font-semibold">Ficha de anamnese</h2>
        <p className="text-sm text-muted-foreground mt-1">Informações de saúde e histórico estético.</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <div className="space-y-4">
        {/* Tipo de pele */}
        <div className="surface space-y-3">
          <Label>Tipo de pele</Label>
          <div className="flex flex-wrap gap-2">
            {SKIN_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("skinType", data.skinType === t ? "" : t)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  data.skinType === t
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Saúde */}
        <div className="surface space-y-4">
          <p className="text-sm font-medium">Saúde</p>

          <AnamnesisToggle label="Possui alergias?" checked={data.hasAllergies}
            onChange={(v) => set("hasAllergies", v)}
            detail={data.allergiesDetail} onDetailChange={(v) => set("allergiesDetail", v)}
            placeholder="Ex: látex, penicilina..." />

          <AnamnesisToggle label="Possui contraindicações?" checked={data.hasContraindications}
            onChange={(v) => set("hasContraindications", v)}
            detail={data.contraindicationsDetail} onDetailChange={(v) => set("contraindicationsDetail", v)}
            placeholder="Ex: marca-passo, gestante..." />

          <AnamnesisToggle label="Faz uso de medicamentos?" checked={data.usesMedication}
            onChange={(v) => set("usesMedication", v)}
            detail={data.medicationDetail} onDetailChange={(v) => set("medicationDetail", v)}
            placeholder="Ex: anticoagulante, isotretinoína..." />

          <AnamnesisToggle label="Possui doença crônica?" checked={data.hasChronicCondition}
            onChange={(v) => set("hasChronicCondition", v)}
            detail={data.chronicConditionDetail} onDetailChange={(v) => set("chronicConditionDetail", v)}
            placeholder="Ex: diabetes, hipertensão..." />

          <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
            <span className="text-sm">Gestante?</span>
            <Toggle checked={data.isPregnant} onChange={(v) => set("isPregnant", v)} />
          </div>
        </div>

        {/* Histórico estético */}
        <div className="surface space-y-4">
          <p className="text-sm font-medium">Histórico estético</p>
          <div className="space-y-2">
            <Label>Objetivo estético</Label>
            <Input placeholder="Ex: reduzir manchas, uniformizar o tom..." value={data.aestheticGoal} onChange={(e) => set("aestheticGoal", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Queixas da pele</Label>
            <Input placeholder="Ex: manchas, acne, oleosidade..." value={data.skinComplaints} onChange={(e) => set("skinComplaints", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Procedimentos anteriores</Label>
            <Input placeholder="Ex: peeling, botox, microagulhamento..." value={data.previousProcedures} onChange={(e) => set("previousProcedures", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Observações extras</Label>
            <Input placeholder="Informações adicionais..." value={data.extraNotes} onChange={(e) => set("extraNotes", e.target.value)} />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="w-full">
        {isSaving ? "Salvando..." : "Salvar ficha"}
      </Button>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={cn("relative h-6 w-10 shrink-0 rounded-full outline-none transition-colors", checked ? "bg-primary" : "bg-muted")}
    >
      <span className={cn("absolute top-0.5 left-0 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200", checked ? "translate-x-4.5" : "translate-x-0.5")} />
    </button>
  )
}

function AnamnesisToggle({ label, checked, onChange, detail, onDetailChange, placeholder }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
  detail: string; onDetailChange: (v: string) => void; placeholder: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
        <span className="text-sm">{label}</span>
        <Toggle checked={checked} onChange={onChange} />
      </div>
      {checked && (
        <Input placeholder={placeholder} value={detail} onChange={(e) => onDetailChange(e.target.value)} />
      )}
    </div>
  )
}
