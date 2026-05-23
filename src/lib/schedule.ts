import type { ScheduleConfig, ScheduleBlock, Appointment } from "@/db/schema"

export type TimeSlot = {
  time: string   // "08:00"
  available: boolean
  appointmentId?: string
  clientId?: string
  clientName?: string
  procedure?: string
  procedureId?: string | null
  procedurePrice?: number // centavos
  hasReturn?: boolean
  returnIntervalDays?: number | null
  clientPackageId?: string | null
  notes?: string | null
  status?: Appointment["status"]
  isBlocked?: boolean
  blockReason?: string
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(m: number): string {
  const h = Math.floor(m / 60).toString().padStart(2, "0")
  const min = (m % 60).toString().padStart(2, "0")
  return `${h}:${min}`
}

export function generateSlots(
  config: ScheduleConfig,
  date: string,
  blocks: ScheduleBlock[],
  appointments: (Appointment & { clientName: string; procedurePrice?: number | null; clientPackageId?: string | null; hasReturn?: boolean | null; returnIntervalDays?: number | null })[],
): TimeSlot[] {
  const dayOfWeek = new Date(date + "T12:00:00").getDay()
  const workDays = config.workDays.split(",").map(Number)

  if (!workDays.includes(dayOfWeek)) return []

  const start = timeToMinutes(config.startTime)
  const end = timeToMinutes(config.endTime)
  const duration = config.slotDuration
  const breakStart = config.breakStart ? timeToMinutes(config.breakStart) : null
  const breakEnd = config.breakEnd ? timeToMinutes(config.breakEnd) : null

  const slots: TimeSlot[] = []

  for (let t = start; t + duration <= end; t += duration) {
    const time = minutesToTime(t)
    const slotEnd = t + duration

    // Verifica intervalo
    if (breakStart !== null && breakEnd !== null) {
      if (t >= breakStart && t < breakEnd) continue
    }

    // Verifica bloqueio manual
    const block = blocks.find((b) => {
      const bs = timeToMinutes(b.startTime.slice(0, 5))
      const be = timeToMinutes(b.endTime.slice(0, 5))
      return t >= bs && t < be
    })

    if (block) {
      slots.push({ time, available: false, isBlocked: true, blockReason: block.reason ?? undefined })
      continue
    }

    // Verifica agendamento existente (normaliza HH:MM:SS → HH:MM)
    const appt = appointments.find((a) => a.startTime.slice(0, 5) === time)
    if (appt) {
      slots.push({
        time,
        available: false,
        appointmentId: appt.id,
        clientId: appt.clientId,
        clientName: appt.clientName,
        procedure: appt.procedure ?? undefined,
        procedureId: appt.procedureId ?? null,
        procedurePrice: appt.procedurePrice ?? undefined,
        hasReturn: appt.hasReturn ?? false,
        returnIntervalDays: appt.returnIntervalDays ?? null,
        clientPackageId: appt.clientPackageId ?? null,
        notes: appt.notes ?? null,
        status: appt.status,
      })
      continue
    }

    slots.push({ time, available: true })
  }

  return slots
}
