"use client"

import { useState, useRef, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
})

type FormData = z.infer<typeof schema>

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

export function ProfileForm({ user }: { user: User }) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.image ? mediaUrl(user.image) + "?t=" + Date.now() : null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name,
      phone: user.phone ?? "",
      whatsapp: user.whatsapp ?? "",
      birthDate: user.birthDate ?? "",
      instagram: user.instagram ?? "",
      professionalDocument: user.professionalDocument ?? "",
      professionalDocumentType: user.professionalDocumentType ?? "",
    },
  })

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
        // Add cache-buster so browser/CDN doesn't serve the old image
        const { mediaUrl: toUrl } = await import("@/lib/media-url")
        setAvatarPreview(toUrl(result.imageUrl) + "?t=" + Date.now())
      } else if (!result.success) {
        setAvatarError(result.error ?? "Erro ao enviar foto.")
      }
    })
  }

  async function onSubmit(data: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await updateProfileAction(data)
      if (!result.success) { setError(result.error ?? "Erro ao salvar."); return }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    })
  }

  const professionLabel = user.profession === "biomedico" ? "Biomédico(a)" : "Esteticista"

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

        <div className="grid grid-cols-2 gap-4">
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

      {/* Dados profissionais */}
      <div className="surface space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Dados profissionais</p>

        <div className="grid grid-cols-2 gap-4">
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
