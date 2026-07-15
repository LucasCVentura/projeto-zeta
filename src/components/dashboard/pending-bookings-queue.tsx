"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { CalendarClock } from "lucide-react"
import { updateAppointmentStatusAction } from "@/actions/schedule"

type PendingBooking = {
  id: string
  date: string
  startTime: string
  procedure: string | null
  clientName: string
}

function formatDateBR(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })
}

export function PendingBookingsQueue({ bookings }: { bookings: PendingBooking[] }) {
  const [items, setItems] = useState(bookings)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handle(id: string, status: "confirmed" | "cancelled") {
    startTransition(async () => {
      await updateAppointmentStatusAction(id, status)
      setItems((prev) => prev.filter((b) => b.id !== id))
      router.refresh()
    })
  }

  if (items.length === 0) return null

  return (
    <div className="surface space-y-4 border-primary/30">
      <div className="flex items-center gap-2">
        <CalendarClock size={16} className="text-primary" />
        <p className="text-sm font-medium">Pedidos de agendamento aguardando aprovação</p>
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {items.length}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{b.clientName}</p>
              <p className="text-xs text-muted-foreground truncate">
                {b.procedure ?? "Sem procedimento"} — {formatDateBR(b.date)} às {b.startTime.slice(0, 5)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                disabled={isPending}
                onClick={() => handle(b.id, "cancelled")}
                className="rounded-lg border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                Recusar
              </button>
              <button
                disabled={isPending}
                onClick={() => handle(b.id, "confirmed")}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Aprovar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
