import { expect, type Page } from "@playwright/test"

export async function login(page: Page) {
  const email = (process.env.E2E_USER_EMAIL ?? "e2e@kira.local").trim()
  const password = (process.env.E2E_USER_PASSWORD ?? "E2E@123456").trim()

  await page.goto("/login")
  const emailInput = page.getByLabel("E-mail")
  const passwordInput = page.getByLabel("Senha")

  await emailInput.click()
  await emailInput.fill(email)
  await expect(emailInput).toHaveValue(email)

  await passwordInput.click()
  await passwordInput.fill(password)
  await expect(passwordInput).toHaveValue(password)

  await Promise.all([
    page.waitForURL(/\/(dashboard|agenda|clientes|financeiro)(\/|$)/, { timeout: 15_000 }),
    page.getByRole("button", { name: "Entrar" }).click(),
  ])
  expect(page.url()).not.toContain("chrome-error://")
}
