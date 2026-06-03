"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"
import { AppointmentModal } from "./appointment-modal"
import { BlockDrawer } from "./block-drawer"
import { CompleteAppointmentModal } from "./complete-appointment-modal"
import { updateAppointmentStatusAction, cancelAppointmentAction, getDaySlots } from "@/actions/schedule"
import { EditAppointmentModal } from "./edit-appointment-modal"
import Link from "next/link"
import type { TimeSlot } from "@/lib/schedule"
import type { AppointmentStatus } from "@/db/schema"

type Procedure = { id: string; name: string; price: number | null }
type Professional = { id: string; name: string }

type Props = {
  initialDate: string
  slots: TimeSlot[]
  hasConfig: boolean
  slotDuration: number
  procedures: Procedure[]
  professionals?: Professional[]
  canSelectProfessional?: boolean
}

const STATUS_OPTIONS: { value: AppointmentStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmar" },
  { value: "missed",    label: "Faltou" },
  { value: "cancelled", label: "Cancelar" },
]

// Transições válidas por status atual
const STATUS_TRANSITIONS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  waiting:   ["confirmed", "missed", "cancelled"],
  confirmed: ["missed", "cancelled"],
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

function toDateStr(d: Date) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00")
  d.setDate(d.getDate() + days)
  return toDateStr(d)
}

function getWeekDays(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00")
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const curr = new Date(monday)
    curr.setDate(monday.getDate() + i)
    return toDateStr(curr)
  })
}

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export function AgendaView({ initialDate, slots: initialSlots, hasConfig, slotDuration, procedures, professionals = [], canSelectProfessional = false }: Props) {
  const router = useRouter()
  const [date, setDate] = useState(initialDate)
  const [slots, setSlots] = useState(initialSlots)
  const [appointmentDrawer, setAppointmentDrawer] = useState<{ open: boolean; time: string }>({
    open: false, time: "",
  })
  const [blockDrawer, setBlockDrawer] = useState(false)
  const [activeSlot, setActiveSlot] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [completeModal, setCompleteModal] = useState<{
    open: boolean
    appointmentId: string
    clientId?: string
    clientName: string
    procedure?: string
    procedurePrice?: number
    isPackageSession?: boolean
    hasReturn?: boolean
    returnIntervalDays?: number | null
    appointmentDate?: string
  }>({ open: false, appointmentId: "", clientName: "" })
  const [editModal, setEditModal] = useState<{
    open: boolean
    appointmentId: string
    procedureId?: string | null
    notes?: string | null
  }>({ open: false, appointmentId: "" })
  const [isPending, startTransition] = useTransition()

  const weekDays = getWeekDays(date)
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
  const nowBRT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  const nowMinutes = nowBRT.getHours() * 60 + nowBRT.getMinutes()

  function isSlotPast(slotTime: string) {
    if (date < today) return true
    if (date > today) return false
    const [h, m] = slotTime.split(":").map(Number)
    return h * 60 + m < nowMinutes
  }

  const refreshSlots = useCallback(async (forDate: string) => {
    const result = await getDaySlots(forDate)
    setSlots(result.slots)
  }, [])

  function navigate(newDate: string) {
    setDate(newDate)
    router.push(`/agenda?data=${newDate}`)
    startTransition(async () => {
      await refreshSlots(newDate)
    })
  }

  function handleStatusChange(slot: TimeSlot, status: AppointmentStatus) {
    const appointmentId = slot.appointmentId!
    if (status === "completed") {
      setActiveSlot(null)
      setCompleteModal({
        open: true,
        appointmentId,
        clientId: slot.clientId,
        clientName: slot.clientName ?? "",
        procedure: slot.procedure,
        procedurePrice: slot.procedurePrice,
        isPackageSession: !!slot.clientPackageId,
        hasReturn: slot.hasReturn,
        returnIntervalDays: slot.returnIntervalDays,
        appointmentDate: date,
      })
      return
    }
    startTransition(async () => {
      if (status === "cancelled") {
        await cancelAppointmentAction(appointmentId)
      } else {
        await updateAppointmentStatusAction(appointmentId, status)
      }
      await refreshSlots(date)
    })
  }

  return (
    <>
      {/* Navegação de data */}
      <div className="space-y-4">
        {/* Semana */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigate(addDays(date, -7))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <div className="flex flex-1 gap-1 overflow-x-auto">
            {weekDays.map((d) => {
              const dayObj = new Date(d + "T12:00:00")
              const dayLabel = DAY_LABELS[dayObj.getDay()]
              const dayNum = dayObj.getDate()
              const isSelected = d === date
              const isToday = d === today
              return (
                <button
                  key={d}
                  onClick={() => navigate(d)}
                  className={cn(
                    "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 transition-colors min-w-9",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span className="text-[10px] font-medium">{dayLabel}</span>
                  <span className={cn("text-sm font-bold", isSelected ? "" : "")}>{dayNum}</span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => navigate(addDays(date, 7))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Data selecionada + ações */}
        <div className="flex items-center justify-between">
          <p className="capitalize text-sm text-muted-foreground">{formatDate(date)}</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBlockDrawer(true)}
              disabled={!hasConfig}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M4.93 4.93l14.14 14.14" />
              </svg>
              Bloquear
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(today)}
              variant="outline"
            >
              Hoje
            </Button>
          </div>
        </div>
      </div>

      {warning && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700">
          {warning}
        </div>
      )}

      {/* Grade de slots */}
      {!hasConfig ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Configure sua agenda para visualizar os horários.
        </div>
      ) : slots.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          Nenhum horário disponível neste dia.
        </div>
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => (
            <SlotCard
              key={slot.time}
              slot={slot}
              isActive={activeSlot === slot.time}
              isPast={isSlotPast(slot.time)}
              onToggle={() => setActiveSlot(activeSlot === slot.time ? null : slot.time)}
              onBook={() => setAppointmentDrawer({ open: true, time: slot.time })}
              onStatusChange={(status) => handleStatusChange(slot, status)}
              onEdit={() => slot.appointmentId && setEditModal({
                open: true,
                appointmentId: slot.appointmentId,
                procedureId: slot.procedureId,
                notes: slot.notes,
              })}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      <AppointmentModal
        open={appointmentDrawer.open}
        onClose={(w) => {
          setAppointmentDrawer({ open: false, time: "" })
          if (w) { setWarning(w); setTimeout(() => setWarning(null), 5000) }
          startTransition(() => refreshSlots(date))
        }}
        date={date}
        time={appointmentDrawer.time}
        professionals={canSelectProfessional ? professionals : []}
      />

      <BlockDrawer
        open={blockDrawer}
        onClose={() => {
          setBlockDrawer(false)
          startTransition(() => refreshSlots(date))
        }}
        date={date}
      />

      <CompleteAppointmentModal
        open={completeModal.open}
        onClose={() => {
          setCompleteModal((m) => ({ ...m, open: false }))
          startTransition(() => refreshSlots(date))
        }}
        appointmentId={completeModal.appointmentId}
        clientId={completeModal.clientId}
        date={date}
        clientName={completeModal.clientName}
        procedure={completeModal.procedure}
        procedurePrice={completeModal.procedurePrice}
        isPackageSession={completeModal.isPackageSession}
        hasReturn={completeModal.hasReturn}
        returnIntervalDays={completeModal.returnIntervalDays}
        appointmentDate={completeModal.appointmentDate}
      />

      <EditAppointmentModal
        open={editModal.open}
        onClose={() => {
          setEditModal((m) => ({ ...m, open: false }))
          startTransition(() => refreshSlots(date))
        }}
        appointmentId={editModal.appointmentId}
        currentProcedureId={editModal.procedureId}
        currentNotes={editModal.notes}
        procedures={procedures}
      />
    </>
  )
}

// ── Slot Card ─────────────────────────────────────────────────────────────────

function SlotCard({
  slot,
  isActive,
  isPast,
  onToggle,
  onBook,
  onStatusChange,
  onEdit,
  isPending,
}: {
  slot: TimeSlot
  isActive: boolean
  isPast: boolean
  onToggle: () => void
  onBook: () => void
  onStatusChange: (status: AppointmentStatus) => void
  onEdit: () => void
  isPending: boolean
}) {
  if (slot.isBlocked) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/40 px-4 py-3">
        <span className="w-12 shrink-0 text-sm font-medium text-muted-foreground">{slot.time}</span>
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M4.93 4.93l14.14 14.14" />
          </svg>
          <span className="text-sm">{slot.blockReason ?? "Bloqueado"}</span>
        </div>
      </div>
    )
  }

  if (slot.available) {
    if (isPast) {
      return (
        <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/40 px-4 py-3 opacity-40">
          <span className="w-12 shrink-0 text-sm font-medium text-muted-foreground">{slot.time}</span>
          <span className="text-sm text-muted-foreground">—</span>
        </div>
      )
    }
    return (
      <button
        onClick={onBook}
        className="flex w-full items-center gap-4 rounded-xl border border-dashed border-border px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5 group"
      >
        <span className="w-12 shrink-0 text-sm font-medium text-muted-foreground">{slot.time}</span>
        <span className="text-sm text-muted-foreground group-hover:text-primary transition-colors">
          + Agendar
        </span>
      </button>
    )
  }

  // Slot ocupado
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        className="flex w-full items-center gap-4 px-4 py-3 text-left"
        onClick={onToggle}
      >
        <span className="w-12 shrink-0 text-sm font-medium">{slot.time}</span>
        <div className="flex flex-1 items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{slot.clientName}</p>
            {slot.procedure && (
              <p className="truncate text-xs text-muted-foreground">{slot.procedure}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {slot.status && <StatusBadge status={slot.status} />}
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={cn("text-muted-foreground transition-transform", isActive && "rotate-180")}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>
      </button>

      {/* Ações expandidas */}
      {isActive && slot.appointmentId && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Editar
            </button>
            {slot.status === "confirmed" && (
              <Link
                href={`/consulta/${slot.appointmentId}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Iniciar atendimento
              </Link>
            )}
          </div>
          {STATUS_TRANSITIONS[slot.status] && (
            <>
              <p className="text-xs font-medium text-muted-foreground">Alterar status</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.filter((o) => STATUS_TRANSITIONS[slot.status]?.includes(o.value)).map((opt) => (
                  <Button
                    key={opt.value}
                    size="sm"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => onStatusChange(opt.value)}
                    className={cn(
                      opt.value === "cancelled" || opt.value === "missed"
                        ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                        : "border-blue-300 text-blue-700 hover:bg-blue-50"
                    )}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  )
}
