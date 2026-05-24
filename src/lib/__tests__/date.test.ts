import { describe, it, expect } from "vitest"
import { todayBRT, nowBRT } from "../date"

describe("todayBRT", () => {
  it("returns a string in YYYY-MM-DD format", () => {
    expect(todayBRT()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it("returns a valid calendar date", () => {
    const d = new Date(todayBRT() + "T12:00:00")
    expect(isNaN(d.getTime())).toBe(false)
  })
})

describe("nowBRT", () => {
  it("returns a Date instance", () => {
    expect(nowBRT()).toBeInstanceOf(Date)
  })

  it("returns a valid date", () => {
    expect(isNaN(nowBRT().getTime())).toBe(false)
  })

  it("date part matches todayBRT", () => {
    const today = todayBRT()
    const now = nowBRT()
    const [year, month, day] = today.split("-").map(Number)
    expect(now.getFullYear()).toBe(year)
    expect(now.getMonth() + 1).toBe(month)
    expect(now.getDate()).toBe(day)
  })

  it("returns a time in the past or present", () => {
    expect(nowBRT().getTime()).toBeLessThanOrEqual(Date.now() + 1000)
  })
})
