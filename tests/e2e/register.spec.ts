import { test, expect } from "@playwright/test"

test("abre tela de cadastro", async ({ page }) => {
  await page.goto("/register")
  await expect(page.getByRole("heading", { name: /Criar conta/i })).toBeVisible()
  await expect(page.getByText(/1 de 3/i)).toBeVisible()
  await expect(page.getByLabel(/Nome completo/i)).toBeVisible()
})

