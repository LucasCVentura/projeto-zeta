"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createAppointmentAction, getClientsAction } from "@/actions/schedule"

const schema = z.object({
  clientId: z.string().min(1, "Selecione um cliente"),
  procedure: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>
type Client = { id: string; name: string; phone: string | null }

type Props = {
  open: boolean
  onClose: () => void
  date: string
  time: string
}

export function AppointmentDrawer({ open, onClose, date, time }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (open) {
      getClientsAction().then(setClients)
      reset()
      setError(null)
    }
  }, [open, reset])

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await createAppointmentAction({
      clientId: data.clientId,
      date,
      startTime: time,
      procedure: data.procedure,
      notes: data.notes,
    })
    setIsLoading(false)
    if (!result.success) {
      setError(result.error)
      return
    }
    onClose()
  }

  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  })

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-heading">Novo agendamento</DrawerTitle>
          <p className="text-sm text-muted-foreground capitalize">
            {formattedDate} às {time}
          </p>
        </DrawerHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Cliente</Label>
            {clients.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado.</p>
                <a href="/clientes/novo" className="text-sm text-primary hover:underline">
                  Cadastrar cliente
                </a>
              </div>
            ) : (
              <Select onValueChange={(v: string | null) => { if (v) setValue("clientId", v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {c.phone && <span className="text-muted-foreground ml-2 text-xs">{c.phone}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {errors.clientId && <p className="text-destructive text-xs">{errors.clientId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Procedimento <span className="text-muted-foreground">(opcional)</span></Label>
            <Input placeholder="Ex: Limpeza de pele, Botox..." {...register("procedure")} />
          </div>

          <div className="space-y-2">
            <Label>Observações <span className="text-muted-foreground">(opcional)</span></Label>
            <Input placeholder="Notas internas..." {...register("notes")} />
          </div>
        </form>

        <DrawerFooter className="flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit(onSubmit)}
            disabled={isLoading || clients.length === 0}
          >
            {isLoading ? "Salvando..." : "Agendar"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
