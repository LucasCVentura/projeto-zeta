"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "./status-badge"
import { AppointmentModal } from "./appointment-modal"
import { BlockDrawer } from "./block-drawer"
import { CompleteAppointmentModal } from "./complete-appointment-modal"
import { updateAppointmentStatusAction, cancelAppointmentAction, getDaySlots, getMonthAppointments, getWeekSlotsAction } from "@/actions/schedule"
import type { MonthAppointment } from "@/actions/schedule"
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
  const [view, setView] = useState<"day" | "week" | "month">("day")
  const [monthData, setMonthData] = useState<Record<string, MonthAppointment[]>>({})
  const [isLoadingMonth, setIsLoadingMonth] = useState(false)
  const [weekSlots, setWeekSlots] = useState<Record<string, TimeSlot[]>>({})
  const [isLoadingWeek, setIsLoadingWeek] = useState(false)

  async function loadMonth(dateStr: string) {
    const [y, m] = dateStr.split("-").map(Number)
    setIsLoadingMonth(true)
    const data = await getMonthAppointments(y, m)
    setMonthData((prev) => ({ ...prev, ...data }))
    setIsLoadingMonth(false)
  }

  async function loadWeekSlots(days: string[]) {
    setIsLoadingWeek(true)
    const data = await getWeekSlotsAction(days)
    setWeekSlots(data)
    setIsLoadingWeek(false)
  }

  function switchView(v: "day" | "week" | "month") {
    setView(v)
    if (v === "month") loadMonth(date)
    if (v === "week") loadWeekSlots(getWeekDays(date))
  }

  function navigateMonth(dir: -1 | 1) {
    const [y, m] = date.split("-").map(Number)
    const d = new Date(y, m - 1 + dir, 1)
    const newDate = toDateStr(d)
    setDate(newDate)
    router.push(`/agenda?data=${newDate}`)
    loadMonth(newDate)
  }

  function navigateWeek(dir: -1 | 1) {
    const newDate = addDays(date, dir * 7)
    setDate(newDate)
    router.push(`/agenda?data=${newDate}`)
    loadWeekSlots(getWeekDays(newDate))
  }

  function handleDayClick(d: string) {
    setView("day")
    navigate(d)
  }

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
        {view === "day" ? (
          /* Strip de dias — visão dia */
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigate(addDays(date, -7))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
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
                    <span className="text-sm font-bold">{dayNum}</span>
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => navigate(addDays(date, 7))}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        ) : view === "week" ? (
          /* Semana — cabeçalho com range */
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigateWeek(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <p className="text-sm font-medium">
              {new Date(weekDays[0] + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}
              {" – "}
              {new Date(weekDays[6] + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <button
              onClick={() => navigateWeek(1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        ) : (
          /* Mês — cabeçalho de navegação */
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <p className="capitalize text-sm font-medium">
              {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
            <button
              onClick={() => navigateMonth(1)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border hover:bg-accent transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}

        {/* Data selecionada + ações — empilha no mobile, lado a lado no desktop */}
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          {view === "day" ? (
            <p className="first-letter:uppercase text-sm text-muted-foreground">{formatDate(date)}</p>
          ) : view === "week" ? (
            <p className="text-sm text-muted-foreground">
              {weekDays.includes(today) ? "Semana atual" : ""}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {date === today ? "Hoje" : `Selecionado: ${new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short" })}`}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {view === "day" && (
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
            )}
            {/* Toggle Dia / Semana / Mês */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => switchView("day")}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors",
                  view === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                Dia
              </button>
              <button
                onClick={() => switchView("week")}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors border-l border-border",
                  view === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                Semana
              </button>
              <button
                onClick={() => switchView("month")}
                className={cn(
                  "px-3 py-1.5 text-sm transition-colors border-l border-border",
                  view === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
                )}
              >
                Mês
              </button>
            </div>
            <Button size="sm" onClick={() => { setView("day"); navigate(today) }} variant="outline">
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

      {/* Grade de slots, visão semanal ou mensal */}
      {view === "month" ? (
        <MonthView
          date={date}
          monthData={monthData}
          isLoading={isLoadingMonth}
          today={today}
          onDayClick={handleDayClick}
        />
      ) : view === "week" ? (
        <WeekView
          weekDays={weekDays}
          weekSlots={weekSlots}
          isLoading={isLoadingWeek}
          today={today}
          selectedDate={date}
          onDayClick={handleDayClick}
        />
      ) : !hasConfig ? (
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
        appointmentDate={completeModal.appointmentDate}
      />

      <EditAppointmentModal
        open={editModal.open}
        onClose={() => {
          setEditModal((m) => ({ ...m, open: false }))
          startTransition(() => refreshSlots(date))
        }}
        appointmentId={editModal.appointmentId}
        currentNotes={editModal.notes}
        procedures={procedures}
      />
    </>
  )
}

// ── Week View ─────────────────────────────────────────────────────────────────

const STATUS_BORDER: Record<string, string> = {
  waiting:   "border-l-amber-400",
  confirmed: "border-l-blue-500",
  completed: "border-l-emerald-500",
  missed:    "border-l-red-400",
}

function WeekView({
  weekDays,
  weekSlots,
  isLoading,
  today,
  selectedDate,
  onDayClick,
}: {
  weekDays: string[]
  weekSlots: Record<string, TimeSlot[]>
  isLoading: boolean
  today: string
  selectedDate: string
  onDayClick: (d: string) => void
}) {
  if (isLoading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  // Derive time axis from any working day's slots
  const allTimes = Object.values(weekSlots).find((s) => s.length > 0)?.map((s) => s.time) ?? []

  if (allTimes.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Configure sua agenda para visualizar os horários.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-150 border border-border rounded-xl overflow-hidden">
        {/* Header com os dias */}
        <div className="grid border-b border-border" style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}>
          <div className="border-r border-border" />
          {weekDays.map((d) => {
            const dayObj = new Date(d + "T12:00:00")
            const isToday = d === today
            const isSelected = d === selectedDate
            return (
              <button
                key={d}
                onClick={() => onDayClick(d)}
                className={cn(
                  "flex flex-col items-center py-2.5 border-r border-border last:border-r-0 transition-colors",
                  isSelected ? "bg-primary text-primary-foreground"
                  : isToday ? "bg-primary/10 text-primary"
                  : "hover:bg-accent text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-[10px] font-medium">{DAY_LABELS[dayObj.getDay()]}</span>
                <span className="text-sm font-bold">{dayObj.getDate()}</span>
              </button>
            )
          })}
        </div>

        {/* Grade de horários */}
        <div>
          {allTimes.map((time) => (
            <div
              key={time}
              className="grid border-b border-border/50 last:border-b-0"
              style={{ gridTemplateColumns: "48px repeat(7, 1fr)" }}
            >
              {/* Label do horário */}
              <div className="flex items-start justify-end pt-1.5 pr-2 border-r border-border shrink-0">
                <span className="text-[10px] text-muted-foreground tabular-nums">{time}</span>
              </div>

              {/* Células de cada dia */}
              {weekDays.map((d) => {
                const daySlots = weekSlots[d] ?? []
                const slot = daySlots.find((s) => s.time === time)

                if (!slot) {
                  return <div key={d} className="h-14 border-r border-border/40 last:border-r-0 bg-muted/10 opacity-40" />
                }

                if (slot.isBlocked) {
                  return (
                    <div key={d} className="h-14 border-r border-border/40 last:border-r-0 flex items-center px-1.5 bg-muted/20">
                      <span className="text-[9px] text-muted-foreground/50 truncate">Bloqueado</span>
                    </div>
                  )
                }

                if (slot.available) {
                  return (
                    <div key={d} className="h-14 border-r border-border/40 last:border-r-0 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => onDayClick(d)} />
                  )
                }

                return (
                  <button
                    key={d}
                    onClick={() => onDayClick(d)}
                    className="h-14 border-r border-border/40 last:border-r-0 p-1"
                  >
                    <div className={cn(
                      "h-full w-full border-l-2 rounded-r-sm px-1.5 flex flex-col justify-center hover:opacity-80 transition-opacity bg-muted/40",
                      slot.status ? (STATUS_BORDER[slot.status] ?? "border-l-muted-foreground") : "border-l-muted-foreground",
                    )}>
                      <span className="block text-[10px] font-medium truncate leading-tight">
                        {slot.clientName?.split(" ")[0]}
                      </span>
                      {slot.procedure && (
                        <span className="block text-[9px] text-muted-foreground truncate leading-tight mt-0.5">
                          {slot.procedure}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Month View ────────────────────────────────────────────────────────────────

const MONTH_DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]

const STATUS_DOT: Record<string, string> = {
  waiting:   "bg-amber-400",
  confirmed: "bg-blue-500",
  completed: "bg-emerald-500",
  missed:    "bg-red-400",
}

const STATUS_PILL_BG: Record<string, string> = {
  waiting:   "bg-amber-400/20 text-amber-500",
  confirmed: "bg-blue-500/20 text-blue-400",
  completed: "bg-emerald-500/20 text-emerald-500",
  missed:    "bg-red-400/20 text-red-400",
}

function MonthView({
  date,
  monthData,
  isLoading,
  today,
  onDayClick,
}: {
  date: string
  monthData: Record<string, MonthAppointment[]>
  isLoading: boolean
  today: string
  onDayClick: (d: string) => void
}) {
  const [y, m] = date.split("-").map(Number)

  // Build calendar grid starting on Monday
  const firstDay = new Date(y, m - 1, 1)
  const dow = firstDay.getDay() // 0=Sun
  const daysBeforeFirst = dow === 0 ? 6 : dow - 1
  const cursor = new Date(firstDay)
  cursor.setDate(cursor.getDate() - daysBeforeFirst)

  const weeks: string[][] = []
  for (let w = 0; w < 6; w++) {
    const week: string[] = []
    for (let d = 0; d < 7; d++) {
      week.push(cursor.toLocaleDateString("en-CA"))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
    // Stop after last day of month is covered
    if (cursor.getMonth() !== m - 1 && w >= 3) break
  }

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-muted-foreground">Carregando...</div>
  }

  return (
    <div className="space-y-1">
      {/* Header dias da semana */}
      <div className="grid grid-cols-7">
        {MONTH_DAY_LABELS.map((l) => (
          <div key={l} className="py-1.5 text-center text-[11px] font-medium text-muted-foreground">
            {l}
          </div>
        ))}
      </div>

      {/* Semanas */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1">
          {week.map((d) => {
            const [, dm] = d.split("-").map(Number)
            const isCurrentMonth = dm === m || (d.split("-")[1] && parseInt(d.split("-")[1]) === m)
            const currentMonthCheck = d.startsWith(`${y}-${String(m).padStart(2, "0")}`)
            const isToday = d === today
            const isSelected = d === date
            const appts = monthData[d] ?? []

            return (
              <button
                key={d}
                onClick={() => onDayClick(d)}
                className={cn(
                  "flex flex-col items-start rounded-xl py-2 px-1.5 min-h-18 transition-colors gap-1",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : isToday
                    ? "bg-primary/10 text-primary"
                    : currentMonthCheck
                    ? "hover:bg-accent"
                    : "opacity-30 hover:bg-accent"
                )}
              >
                <span className="text-sm font-medium leading-none w-full text-center">
                  {new Date(d + "T12:00:00").getDate()}
                </span>
                <div className="flex flex-col gap-0.5 w-full">
                  {appts.slice(0, 2).map((a, i) => (
                    <span
                      key={i}
                      className={cn(
                        "block truncate rounded px-1 text-[9px] font-medium leading-3.5",
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : STATUS_PILL_BG[a.status] ?? "bg-muted text-muted-foreground"
                      )}
                    >
                      {a.time}
                    </span>
                  ))}
                  {appts.length > 2 && (
                    <span className={cn("text-[9px] leading-none pl-1", isSelected ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      +{appts.length - 2}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      ))}
    </div>
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
