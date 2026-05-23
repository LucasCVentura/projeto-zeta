const TZ = "America/Sao_Paulo"

/** Returns today's date as YYYY-MM-DD in America/Sao_Paulo timezone */
export function todayBRT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ })
}

/** Returns current Date object adjusted to America/Sao_Paulo */
export function nowBRT(): Date {
  const now = new Date()
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).formatToParts(now)
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "0"
  return new Date(
    parseInt(get("year")), parseInt(get("month")) - 1, parseInt(get("day")),
    parseInt(get("hour")), parseInt(get("minute")), parseInt(get("second"))
  )
}
