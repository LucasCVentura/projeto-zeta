"use client"

import { useState } from "react"
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
import { createBlockAction } from "@/actions/schedule"

const schema = z.object({
  startTime: z.string().min(1, "Informe o horário de início"),
  endTime: z.string().min(1, "Informe o horário de fim"),
  reason: z.string().optional(),
})

type FormData = z.infer<typeof schema>

type Props = {
  open: boolean
  onClose: () => void
  date: string
  initialTime?: string
}

export function BlockDrawer({ open, onClose, date, initialTime }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { startTime: initialTime ?? "", endTime: "" },
  })

  async function onSubmit(data: FormData) {
    setIsLoading(true)
    setError(null)
    const result = await createBlockAction({ date, ...data })
    setIsLoading(false)
    if (!result.success) { setError(result.error); return }
    onClose()
  }

  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long",
  })

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-heading">Bloquear horário</DrawerTitle>
          <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
        </DrawerHeader>

        <form className="space-y-4 px-4">
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início</Label>
              <Input type="time" {...register("startTime")} />
              {errors.startTime && <p className="text-destructive text-xs">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Fim</Label>
              <Input type="time" {...register("endTime")} />
              {errors.endTime && <p className="text-destructive text-xs">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Motivo <span className="text-muted-foreground">(opcional)</span></Label>
            <Input placeholder="Ex: Almoço, Reunião..." {...register("reason")} />
          </div>
        </form>

        <DrawerFooter className="flex-row gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button className="flex-1" onClick={handleSubmit(onSubmit)} disabled={isLoading}>
            {isLoading ? "Salvando..." : "Bloquear"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
