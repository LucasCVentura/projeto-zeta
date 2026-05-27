import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("faz logout e volta para login", async ({ page }) => {
  await login(page)
  await page.goto("/dashboard")

  const acceptCookies = page.getByRole("button", { name: /Entendi/i })
  if (await acceptCookies.isVisible()) {
    await acceptCookies.click()
  }

  await page.locator("button").filter({ hasText: "Minha conta" }).first().click()
  await page.getByRole("button", { name: "Sair" }).click()

  await expect(page).toHaveURL(/\/login(\?.*)?$/)
  await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible()
})

