import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

function toDateStringSP(date: Date) {
  return date.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })
}

function nextBusinessDates(days = 40) {
  const now = new Date()
  const base = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  const out: string[] = []
  const d = new Date(base)
  d.setDate(d.getDate() + 1)

  while (out.length < days) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      out.push(toDateStringSP(d))
    }
    d.setDate(d.getDate() + 1)
  }

  return out
}

test("cria agendamento com cliente", async ({ page }) => {
  const clientName = process.env.E2E_CLIENT_NAME ?? "Cliente E2E"

  await login(page)
  let foundSlot = false
  for (const date of nextBusinessDates(40)) {
    await page.goto(`/agenda?data=${date}`)
    await page.waitForLoadState("networkidle")

    const acceptCookies = page.getByRole("button", { name: /Entendi/i })
    if (await acceptCookies.isVisible()) {
      await acceptCookies.click()
    }

    const addButtons = page.getByRole("button", { name: /\+ Agendar/i })
    if ((await addButtons.count()) > 0) {
      await addButtons.first().click()
      foundSlot = true
      break
    }
  }

  expect(foundSlot).toBeTruthy()

  await expect(page.getByRole("heading", { name: /Novo agendamento/i })).toBeVisible()

  await page.getByRole("button", { name: /Selecionar cliente/i }).click()
  await page.getByRole("button", { name: new RegExp(clientName, "i") }).first().click()

  await page.getByRole("button", { name: /^Agendar$/i }).click()

  await expect(page.getByRole("heading", { name: /Novo agendamento/i })).toBeHidden()
  await expect(page.getByText(new RegExp(clientName, "i")).first()).toBeVisible()
})
