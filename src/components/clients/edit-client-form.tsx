"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { updateClientAction } from "@/actions/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const schema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  whatsapp: z.string().optional(),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
  cpf: z.string().optional(),
  birthDate: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  clientId: string
  defaultValues: FormData
}

export function EditClientForm({ clientId, defaultValues }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await updateClientAction(clientId, { ...data, phone: data.whatsapp })
    setIsLoading(false)
    if (!result.success) { setError(result.error); return }
    router.push(`/clientes/${clientId}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nome completo *</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp / Telefone</Label>
        <Input id="whatsapp" {...register("whatsapp")} placeholder="(11) 91234-5678" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" {...register("email")} placeholder="cliente@email.com" />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input id="cpf" {...register("cpf")} placeholder="000.000.000-00" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birthDate">Data de nascimento</Label>
          <Input id="birthDate" type="date" {...register("birthDate")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Observações</Label>
        <textarea
          id="notes"
          {...register("notes")}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
          placeholder="Anotações internas sobre a cliente..."
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Salvando..." : "Salvar alterações"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/clientes/${clientId}`)}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
