const TZ = "America/Sao_Paulo"

/** Returns today's date as YYYY-MM-DD in America/Sao_Paulo timezone */
export function todayBRT(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: TZ })
}

/** Returns current Date object adjusted to America/Sao_Paulo */
export function nowBRT(): Date {
  const str = new Date().toLocaleString("en-CA", { timeZone: TZ, hour12: false })
  return new Date(str)
}
