import { test, expect } from "@playwright/test"

test("rota autenticada redireciona para login sem sessão", async ({ page }) => {
  await page.context().clearCookies()
  await page.goto("/dashboard")
  await expect(page).toHaveURL(/\/login(\?.*)?$/)
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible()
})

