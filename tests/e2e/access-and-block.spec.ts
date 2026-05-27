import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

function nextBusinessDate(daysAhead = 1) {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function nextBusinessDates(startAhead = 1, total = 40) {
  const dates: string[] = []
  let cursor = startAhead
  while (dates.length < total) {
    dates.push(nextBusinessDate(cursor))
    cursor += 1
  }
  return dates
}

test("usuário comum não acessa /admin", async ({ page }) => {
  await login(page)
  await page.goto("/admin")
  await expect(page).toHaveURL(/\/dashboard$/)
})

test("bloqueia horário na agenda", async ({ page }) => {
  let blocked = false
  const reason = `Bloqueio E2E ${Date.now()}`

  await login(page)
  for (const date of nextBusinessDates(30, 40)) {
    await page.goto(`/agenda?data=${date}`)

    const acceptCookies = page.getByRole("button", { name: /Entendi/i })
    if (await acceptCookies.isVisible()) await acceptCookies.click()

    const freeSlot = page.getByRole("button", { name: /\+ Agendar/i }).first()
    if ((await freeSlot.count()) === 0) continue

    const slotLabel = (await freeSlot.innerText()).trim()
    const slotMatch = slotLabel.match(/\d{2}:\d{2}/)
    if (!slotMatch) continue

    const start = slotMatch[0]
    const [h, m] = start.split(":").map(Number)
    const end = `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`

    await page.getByRole("button", { name: "Bloquear" }).click()
    await expect(page.getByRole("heading", { name: /Bloquear horário/i })).toBeVisible()

    await page.locator('input[type="time"]').first().fill(start)
    await page.locator('input[type="time"]').nth(1).fill(end)
    await page.getByPlaceholder(/Almoço, Reunião/i).fill(reason)
    await page.getByRole("button", { name: /^Bloquear$/i }).click()
    await expect(page.getByText(reason)).toBeVisible()
    blocked = true
    break
  }

  expect(blocked).toBeTruthy()
})
