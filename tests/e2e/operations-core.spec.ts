import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"
import type { Page } from "@playwright/test"

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
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(toDateStringSP(d))
    d.setDate(d.getDate() + 1)
  }

  return out
}

async function recoverFrom500(page: Page) {
  const is500 = async () => page.getByRole("heading", { name: "500" }).isVisible().catch(() => false)

  for (let i = 0; i < 3; i++) {
    if (!(await is500())) return
    const retryBtn = page.getByRole("button", { name: /Tentar novamente/i })
    if (await retryBtn.isVisible().catch(() => false)) {
      await retryBtn.click()
    } else {
      await page.reload()
    }
    await page.waitForTimeout(800)
  }
}

async function ensureClientPageReady(page: Page, clientName: string, clientUrl: string) {
  await recoverFrom500(page)
  if (!(await page.getByRole("heading", { name: "500" }).isVisible().catch(() => false))) return

  // Fallback: reabre a ficha pela URL e, se necessário, pela lista de clientes.
  await page.goto(clientUrl)
  await recoverFrom500(page)
  if (!(await page.getByRole("heading", { name: "500" }).isVisible().catch(() => false))) return

  await page.goto("/clientes")
  const acceptCookies = page.getByRole("button", { name: "Entendi", exact: true })
  if (await acceptCookies.isVisible()) await acceptCookies.click()
  await page.getByPlaceholder("Buscar por nome ou telefone...").first().fill(clientName)
  await page.getByRole("link", { name: new RegExp(clientName, "i") }).first().click()
  await recoverFrom500(page)
}

test("fluxo de atendimento: confirmar na agenda e salvar anotação na consulta", async ({ page }) => {
  const clientName = process.env.E2E_CLIENT_NAME ?? "Cliente E2E"
  const noteText = `Nota E2E ${Date.now()}`

  await login(page)

  let scheduledDate: string | null = null
  let appointmentCard = page.locator("main button", { hasText: clientName }).first()

  for (const date of nextBusinessDates(40)) {
    await page.goto(`/agenda?data=${date}`)

    const acceptCookies = page.getByRole("button", { name: "Entendi", exact: true })
    if (await acceptCookies.isVisible()) await acceptCookies.click()

    appointmentCard = page.locator("main button", { hasText: clientName }).first()
    if (await appointmentCard.count()) {
      scheduledDate = date
      break
    }

    const freeSlot = page.getByRole("button", { name: /\+ Agendar/i }).first()
    if ((await freeSlot.count()) > 0) {
      await freeSlot.click()
      await expect(page.getByRole("heading", { name: /Novo agendamento/i })).toBeVisible()

      await page.getByRole("button", { name: /Selecionar cliente/i }).click()
      await page.getByRole("button", { name: new RegExp(clientName, "i") }).first().click()
      await page.getByRole("button", { name: /^Agendar$/i }).click()
      await expect(page.getByRole("heading", { name: /Novo agendamento/i })).toBeHidden()

      appointmentCard = page.locator("main button", { hasText: clientName }).first()
      await expect(appointmentCard).toBeVisible()
      scheduledDate = date
      break
    }
  }

  expect(scheduledDate).toBeTruthy()

  await appointmentCard.click()

  const confirmButton = page.getByRole("button", { name: /^Confirmar$/i })
  if (await confirmButton.count()) {
    await confirmButton.click()
  }

  let started = false
  const clientCards = page.locator("main button", { hasText: new RegExp(clientName, "i") })
  const clientCardsCount = await clientCards.count()
  expect(clientCardsCount).toBeGreaterThan(0)

  for (let i = 0; i < clientCardsCount; i++) {
    const card = clientCards.nth(i)
    for (let attempt = 0; attempt < 3; attempt++) {
      await card.click()
      const startAttendance = page.getByRole("link", { name: /Iniciar atendimento/i }).first()
      const appeared = await startAttendance
        .waitFor({ state: "visible", timeout: 3000 })
        .then(() => true)
        .catch(() => false)

      if (appeared) {
        await startAttendance.click()
        started = true
        break
      }
    }

    if (started) {
      break
    }
  }

  expect(started).toBeTruthy()

  await expect(page).toHaveURL(/\/consulta\//)

  const notesField = page.getByPlaceholder(/Evolução, observações/i)
  await notesField.fill(noteText)
  await page.getByRole("button", { name: /^Salvar$/i }).click()
  await expect(page.getByText(/Salvo!/i)).toBeVisible()
})

test("consulta: controles de foto disponíveis", async ({ page }) => {
  const clientName = process.env.E2E_CLIENT_NAME ?? "Cliente E2E"
  await login(page)

  let openedConsulta = false
  for (const date of nextBusinessDates(40)) {
    await page.goto(`/agenda?data=${date}`)

    const acceptCookies = page.getByRole("button", { name: "Entendi", exact: true })
    if (await acceptCookies.isVisible()) await acceptCookies.click()

    const confirmedCards = page.locator("main button", {
      hasText: new RegExp(`${clientName}.*Confirmado`, "i"),
    })
    const count = await confirmedCards.count()
    if (count === 0) continue

    for (let i = 0; i < count; i++) {
      await confirmedCards.nth(i).click()
      const startAttendance = page.getByRole("link", { name: /Iniciar atendimento/i }).first()
      const appeared = await startAttendance
        .waitFor({ state: "visible", timeout: 2500 })
        .then(() => true)
        .catch(() => false)

      if (appeared) {
        await startAttendance.click()
        openedConsulta = true
        break
      }
    }

    if (openedConsulta) break
  }

  expect(openedConsulta).toBeTruthy()
  await expect(page).toHaveURL(/\/consulta\//)

  const attachBtn = page.getByRole("button", { name: /^Anexar$/i })
  const captureBtn = page.getByRole("button", { name: /Tirar foto|Salvando\.{3}/i })

  await expect(attachBtn).toBeVisible()
  await expect(captureBtn).toBeVisible()
  await expect(page.getByText(/Fotos desta consulta/i)).toBeVisible()
})
