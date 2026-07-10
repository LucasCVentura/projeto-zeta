"use client"

import { useState, useRef, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateProfileAction, uploadAvatarAction } from "@/actions/user"
import { mediaUrl } from "@/lib/media-url"
import { Camera, Check } from "lucide-react"
import type { User } from "@/db/schema"

const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  birthDate: z.string().optional(),
  instagram: z.string().optional(),
  professionalDocument: z.string().optional(),
  professionalDocumentType: z.string().optional(),
  professionSegment: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

const professionSegmentLabels: Record<string, string> = {
  designer_cilios: "Designer de cílios",
  manicure_nail_designer: "Manicure / Nail designer",
  micropigmentadora: "Micropigmentadora",
  cabeleireira: "Cabeleireira",
  massoterapeuta: "Massoterapeuta",
  outro_beleza: "Outro segmento de beleza",
}

const otherSegments = [
  { value: "designer_cilios", label: "Designer de cílios" },
  { value: "manicure_nail_designer", label: "Manicure / Nail designer" },
  { value: "micropigmentadora", label: "Micropigmentadora" },
  { value: "cabeleireira", label: "Cabeleireira" },
  { value: "massoterapeuta", label: "Massoterapeuta" },
  { value: "outro_beleza", label: "Outro segmento de beleza" },
]

const fixedSegmentValues = new Set(otherSegments.map((s) => s.value))

const isCustomSegment = (seg: string | null | undefined) =>
  !!seg && !fixedSegmentValues.has(seg)

const professions = [
  { value: "esteticista", label: "Esteticista" },
  { value: "biomedico", label: "Biomédico(a) Esteta" },
  { value: "outro", label: "Outro segmento" },
]

export function ProfileForm({ user }: { user: User }) {
  const { update: updateSession } = useSession()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image ? mediaUrl(user.image) : null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedProfession, setSelectedProfession] = useState<"esteticista" | "biomedico" | "outro">(
    user.profession ?? "esteticista"
  )
  const [showCustomSegment, setShowCustomSegment] = useState(
    user.profession === "outro" && isCustomSegment(user.professionSegment)
  )
  const [dailyAgendaWhatsapp, setDailyAgendaWhatsapp] = useState(user.dailyAgendaWhatsapp)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? "",
      whatsapp: user.whatsapp ?? "",
      birthDate: user.birthDate ?? "",
      instagram: user.instagram ?? "",
      professionalDocument: user.professionalDocument ?? "",
      professionalDocumentType: user.professionalDocumentType ?? "",
      professionSegment: user.professionSegment ?? "",
    },
  })

  const selectedSegment = watch("professionSegment")

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    // Reset input so the same file can be selected again
    e.target.value = ""
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setAvatarError("Máximo 3MB."); return }
    if (!file.type.startsWith("image/")) { setAvatarError("Formato inválido."); return }

    setAvatarError(null)
    const reader = new FileReader()
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    const formData = new FormData()
    formData.append("avatar", file)
    startTransition(async () => {
      const result = await uploadAvatarAction(formData)
      if (result.success && result.imageUrl) {
        const ts = Date.now()
        const { mediaUrl: toUrl } = await import("@/lib/media-url")
        setAvatarPreview(toUrl(result.imageUrl) + "?t=" + ts)
        window.dispatchEvent(new CustomEvent("avatar-updated", { detail: ts }))
        await updateSession()
      } else if (!result.success) {
        setAvatarError(result.error ?? "Erro ao enviar foto.")
      }
    })
  }

  async function onSubmit(data: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateProfileAction({
        ...data,
        profession: selectedProfession,
        professionSegment: selectedProfession === "outro" ? data.professionSegment : undefined,
        dailyAgendaWhatsapp,
      })
      if (!result.success) { setError(result.error ?? "Erro ao salvar."); return }
      await updateSession()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  const professionLabel =
    user.profession === "biomedico"
      ? "Biomédico(a)"
      : user.profession === "esteticista"
        ? "Esteticista"
        : (user.professionSegment
            ? (professionSegmentLabels[user.professionSegment] ?? user.professionSegment)
            : "Outro segmento")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Avatar */}
      <div className="surface flex items-center gap-5">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary overflow-hidden">
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              getInitials(user.name)
            )}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
          >
            <Camera size={13} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div>
          <p className="font-medium text-sm">{user.name}</p>
          <p className="text-xs text-muted-foreground">{professionLabel}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {avatarError && <p className="text-xs text-destructive mt-1">{avatarError}</p>}
        </div>
      </div>

      {/* Dados pessoais */}
      <div className="surface space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dados pessoais</p>

        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input id="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" placeholder="(00) 00000-0000" {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" placeholder="(00) 00000-0000" {...register("whatsapp")} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de nascimento</Label>
          <Input id="birthDate" type="date" {...register("birthDate")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="instagram">Instagram</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
            <Input id="instagram" className="pl-7" placeholder="seu.perfil" {...register("instagram")} />
          </div>
        </div>
      </div>

      {/* Notificações */}
      <div className="surface space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notificações</p>

        <button
          type="button"
          onClick={() => setDailyAgendaWhatsapp((v) => !v)}
          className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all
            ${dailyAgendaWhatsapp
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-border hover:border-primary/40 hover:bg-muted/50"}`}
        >
          <span>
            <span className="block text-sm font-medium">Agenda do dia no WhatsApp</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Receba todo dia de manhã um resumo dos seus atendimentos no seu WhatsApp.
            </span>
          </span>
          <span
            className={`ml-4 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors
              ${dailyAgendaWhatsapp ? "bg-primary" : "bg-muted-foreground/25"}`}
          >
            <span
              className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform
                ${dailyAgendaWhatsapp ? "translate-x-5" : "translate-x-0"}`}
            />
          </span>
        </button>
        {dailyAgendaWhatsapp && !watch("whatsapp") && (
          <p className="text-xs text-destructive">
            Preencha seu WhatsApp em Dados pessoais para receber a agenda do dia.
          </p>
        )}
      </div>

      {/* Dados profissionais */}
      <div className="surface space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dados profissionais</p>

        <div className="space-y-2">
          <Label>Profissão</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {professions.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setSelectedProfession(p.value as "esteticista" | "biomedico" | "outro")
                  if (p.value !== "outro") {
                    setShowCustomSegment(false)
                    setValue("professionSegment", "")
                  }
                }}
                className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all
                  ${selectedProfession === p.value
                    ? "border-primary bg-primary/5 text-foreground shadow-sm"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {selectedProfession === "outro" && (
          <div className="space-y-2">
            <Label>Segmento / área de atuação</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {otherSegments.map((segment) => (
                <button
                  key={segment.value}
                  type="button"
                  onClick={() => {
                    if (segment.value === "outro_beleza") {
                      setShowCustomSegment(true)
                      setValue("professionSegment", "")
                    } else {
                      setShowCustomSegment(false)
                      setValue("professionSegment", segment.value)
                    }
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-all
                    ${(segment.value === "outro_beleza" ? showCustomSegment : selectedSegment === segment.value)
                      ? "border-primary bg-primary/5 text-foreground shadow-sm"
                      : "border-border text-muted-foreground hover:border-primary/40 hover:bg-muted/50"}`}
                >
                  {segment.label}
                </button>
              ))}
            </div>
            {showCustomSegment && (
              <Input
                placeholder="Digite sua profissão ou área de atuação..."
                {...register("professionSegment")}
                autoFocus
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="professionalDocumentType">Tipo de registro</Label>
            <Input id="professionalDocumentType" placeholder="Ex: CRBM, CRF" {...register("professionalDocumentType")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="professionalDocument">Número</Label>
            <Input id="professionalDocument" placeholder="00000/UF" {...register("professionalDocument")} />
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando..." : success ? (
          <span className="flex items-center gap-2"><Check size={15} /> Salvo!</span>
        ) : "Salvar alterações"}
      </Button>
    </form>
  )
}
