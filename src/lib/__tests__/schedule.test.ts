import { describe, it, expect } from "vitest"
import { generateSlots } from "../schedule"
import type { ScheduleConfig, ScheduleBlock, Appointment } from "@/db/schema"

// ── helpers ───────────────────────────────────────────────────────────────────

function cfg(overrides: Partial<ScheduleConfig> = {}): ScheduleConfig {
  return {
    id: "cfg-1",
    organizationId: "org-1",
    userId: "user-1",
    workDays: "1,2,3,4,5", // seg–sex
    startTime: "08:00:00",
    endTime: "12:00:00",
    slotDuration: 60,
    breakStart: null,
    breakEnd: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function block(overrides: Partial<ScheduleBlock> = {}): ScheduleBlock {
  return {
    id: "blk-1",
    organizationId: "org-1",
    userId: "user-1",
    date: "2025-01-06",
    startTime: "10:00:00",
    endTime: "11:00:00",
    reason: "Reunião",
    createdAt: new Date(),
    ...overrides,
  }
}

type ApptWithExtra = Appointment & {
  clientName: string
  procedurePrice?: number | null
  clientPackageId?: string | null
  hasReturn?: boolean | null
  returnIntervalDays?: number | null
}

function appt(overrides: Partial<ApptWithExtra> = {}): ApptWithExtra {
  return {
    id: "appt-1",
    organizationId: "org-1",
    professionalId: "user-1",
    clientId: "client-1",
    clientName: "Maria",
    date: "2025-01-06",
    startTime: "09:00:00",
    endTime: "10:00:00",
    procedure: "Limpeza de pele",
    procedureId: null,
    procedurePrice: 15000,
    clientPackageId: null,
    hasReturn: false,
    returnIntervalDays: null,
    notes: null,
    status: "confirmed",
    createdById: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// ── dia fora da grade ─────────────────────────────────────────────────────────

describe("generateSlots — dia não útil", () => {
  it("retorna vazio para sábado (dia 6)", () => {
    expect(generateSlots(cfg(), "2025-01-04", [], [])).toHaveLength(0)
  })

  it("retorna vazio para domingo (dia 0)", () => {
    expect(generateSlots(cfg(), "2025-01-05", [], [])).toHaveLength(0)
  })

  it("inclui sábado quando está nos dias de trabalho", () => {
    const slots = generateSlots(cfg({ workDays: "6" }), "2025-01-04", [], [])
    expect(slots.length).toBeGreaterThan(0)
  })
})

// ── slots disponíveis ─────────────────────────────────────────────────────────

describe("generateSlots — slots livres", () => {
  it("gera quantidade correta com slots de 60 min", () => {
    // 08:00–12:00, 60 min → 4 slots
    const slots = generateSlots(cfg(), "2025-01-06", [], [])
    expect(slots).toHaveLength(4)
    expect(slots.map((s) => s.time)).toEqual(["08:00", "09:00", "10:00", "11:00"])
    expect(slots.every((s) => s.available)).toBe(true)
  })

  it("gera quantidade correta com slots de 30 min", () => {
    // 08:00–10:00, 30 min → 4 slots
    const slots = generateSlots(
      cfg({ startTime: "08:00:00", endTime: "10:00:00", slotDuration: 30 }),
      "2025-01-06",
      [],
      []
    )
    expect(slots).toHaveLength(4)
    expect(slots.map((s) => s.time)).toEqual(["08:00", "08:30", "09:00", "09:30"])
  })

  it("não inclui slot que ultrapassa o fim do expediente", () => {
    // 08:00–09:30, 60 min → só 08:00 cabe (08:00+60=09:00 ≤ 09:30)
    const slots = generateSlots(
      cfg({ startTime: "08:00:00", endTime: "09:30:00", slotDuration: 60 }),
      "2025-01-06",
      [],
      []
    )
    expect(slots).toHaveLength(1)
    expect(slots[0].time).toBe("08:00")
  })
})

// ── intervalo de almoço ───────────────────────────────────────────────────────

describe("generateSlots — intervalo", () => {
  it("exclui slots dentro do intervalo", () => {
    const slots = generateSlots(
      cfg({
        startTime: "08:00:00",
        endTime: "14:00:00",
        slotDuration: 60,
        breakStart: "12:00:00",
        breakEnd: "13:00:00",
      }),
      "2025-01-06",
      [],
      []
    )
    const times = slots.map((s) => s.time)
    expect(times).not.toContain("12:00")
    expect(times).toContain("11:00")
    expect(times).toContain("13:00")
  })

  it("não afeta slots fora do intervalo", () => {
    const slots = generateSlots(
      cfg({
        startTime: "08:00:00",
        endTime: "12:00:00",
        slotDuration: 60,
        breakStart: "10:00:00",
        breakEnd: "11:00:00",
      }),
      "2025-01-06",
      [],
      []
    )
    expect(slots.find((s) => s.time === "08:00")?.available).toBe(true)
    expect(slots.find((s) => s.time === "09:00")?.available).toBe(true)
    expect(slots.find((s) => s.time === "10:00")).toBeUndefined()
    expect(slots.find((s) => s.time === "11:00")?.available).toBe(true)
  })
})

// ── bloqueios manuais ─────────────────────────────────────────────────────────

describe("generateSlots — bloqueios", () => {
  it("marca slot como bloqueado", () => {
    const slots = generateSlots(cfg(), "2025-01-06", [block()], [])
    const s = slots.find((sl) => sl.time === "10:00")
    expect(s?.available).toBe(false)
    expect(s?.isBlocked).toBe(true)
    expect(s?.blockReason).toBe("Reunião")
  })

  it("não afeta outros slots", () => {
    const slots = generateSlots(cfg(), "2025-01-06", [block()], [])
    expect(slots.find((s) => s.time === "08:00")?.available).toBe(true)
    expect(slots.find((s) => s.time === "09:00")?.available).toBe(true)
    expect(slots.find((s) => s.time === "11:00")?.available).toBe(true)
  })

  it("blockReason é undefined quando não há motivo", () => {
    const slots = generateSlots(cfg(), "2025-01-06", [block({ reason: null })], [])
    expect(slots.find((s) => s.time === "10:00")?.blockReason).toBeUndefined()
  })
})

// ── agendamentos ──────────────────────────────────────────────────────────────

describe("generateSlots — agendamentos", () => {
  it("marca slot como indisponível com dados do agendamento", () => {
    const slots = generateSlots(cfg(), "2025-01-06", [], [appt()])
    const s = slots.find((sl) => sl.time === "09:00")
    expect(s?.available).toBe(false)
    expect(s?.clientName).toBe("Maria")
    expect(s?.procedure).toBe("Limpeza de pele")
    expect(s?.status).toBe("confirmed")
    expect(s?.procedurePrice).toBe(15000)
  })

  it("normaliza HH:MM:SS para HH:MM na comparação", () => {
    const slots = generateSlots(cfg(), "2025-01-06", [], [appt({ startTime: "08:00:00" })])
    expect(slots.find((s) => s.time === "08:00")?.available).toBe(false)
  })

  it("não afeta outros slots", () => {
    const slots = generateSlots(cfg(), "2025-01-06", [], [appt()])
    expect(slots.find((s) => s.time === "08:00")?.available).toBe(true)
    expect(slots.find((s) => s.time === "10:00")?.available).toBe(true)
  })

  it("inclui clientPackageId quando presente", () => {
    const slots = generateSlots(
      cfg(),
      "2025-01-06",
      [],
      [appt({ clientPackageId: "pkg-123" })]
    )
    expect(slots.find((s) => s.time === "09:00")?.clientPackageId).toBe("pkg-123")
  })

  it("inclui hasReturn e returnIntervalDays", () => {
    const slots = generateSlots(
      cfg(),
      "2025-01-06",
      [],
      [appt({ hasReturn: true, returnIntervalDays: 30 })]
    )
    const s = slots.find((sl) => sl.time === "09:00")
    expect(s?.hasReturn).toBe(true)
    expect(s?.returnIntervalDays).toBe(30)
  })
})
