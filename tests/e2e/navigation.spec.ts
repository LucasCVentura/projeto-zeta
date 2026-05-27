import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("navega pelas páginas principais autenticadas", async ({ page }) => {
  await login(page)

  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/dashboard$/)

  await page.goto("/agenda")
  await expect(page.getByRole("heading", { name: /Agenda/i })).toBeVisible()

  await page.goto("/clientes")
  await expect(page).toHaveURL(/\/clientes$/)

  await page.goto("/financeiro")
  await expect(page.getByRole("heading", { name: /Financeiro/i })).toBeVisible()

  await page.goto("/configuracoes")
  await expect(page.getByRole("heading", { name: /Configurações/i })).toBeVisible()
})

