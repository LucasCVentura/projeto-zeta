"use client"

import { useState } from "react"
import Link from "next/link"
import { StatusBadge } from "@/components/agenda/status-badge"
import { ExternalLink, User } from "lucide-react"

const PAGE_SIZE = 8

type Appointment = {
  id: string
  date: string
  startTime: string
  procedure: string | null
  status: string
  notes: string | null
}

function formatDateTime(date: string, time: string) {
  return `${new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "short",
  })} às ${time.slice(0, 5)}`
}

export function ClientHistory({ history }: { history: Appointment[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE)
  const shown = history.slice(0, visible)
  const hasMore = visible < history.length

  return (
    <div className="surface space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Histórico</p>
        <span className="text-xs text-muted-foreground">
          {history.length} atendimento{history.length !== 1 ? "s" : ""}
        </span>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <User size={16} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Nenhum atendimento registrado.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {shown.map((appt) => (
              <div key={appt.id} className="flex items-start justify-between rounded-lg border border-border px-4 py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{appt.procedure ?? "Procedimento não informado"}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(appt.date, appt.startTime)}</p>
                  {appt.notes && <p className="mt-1 text-xs text-muted-foreground italic">{appt.notes}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={appt.status} />
                  {appt.status === "completed" && (
                    <Link
                      href={`/consulta/${appt.id}`}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Ver consulta / anexar fotos"
                    >
                      <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="w-full rounded-lg border border-border py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              Ver mais ({history.length - visible} restantes)
            </button>
          )}
        </>
      )}
    </div>
  )
}
