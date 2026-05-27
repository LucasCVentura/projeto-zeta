import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("abre módulo de ajuda", async ({ page }) => {
  await login(page)
  await page.goto("/ajuda")
  await expect(page).toHaveURL(/\/ajuda$/)
  await expect(page.getByText(/Ajuda|suporte|dúvida/i).first()).toBeVisible()
})

test("abre módulo de estoque", async ({ page }) => {
  await login(page)
  await page.goto("/estoque")
  await expect(page).toHaveURL(/\/estoque$/)
  await expect(page.getByText(/Estoque|insumo|produto/i).first()).toBeVisible()
})

