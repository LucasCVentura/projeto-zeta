import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("abre fluxo de novo cliente e navega entre etapas", async ({ page }) => {
  await login(page)
  await page.goto("/clientes/novo")

  const unique = Date.now()
  const clientName = `Cliente E2E ${unique}`

  await page.getByLabel("Nome completo *").fill(clientName)
  await page.getByRole("button", { name: "Continuar" }).click()
  await page.getByRole("button", { name: "Continuar" }).click()

  const acceptCookies = page.getByRole("button", { name: /Entendi/i })
  if (await acceptCookies.isVisible()) {
    await acceptCookies.click()
  }

  await expect(page.getByRole("button", { name: "Cadastrar cliente" })).toBeVisible()
  await expect(page.getByText(/Tipo de pele/i)).toBeVisible()
})
