import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("abre agenda e exibe slots do dia", async ({ page }) => {
  await login(page)
  await page.goto("/agenda")
  await expect(page.getByRole("heading", { name: /Agenda/i })).toBeVisible()

  const acceptCookies = page.getByRole("button", { name: /Entendi/i })
  if (await acceptCookies.isVisible()) {
    await acceptCookies.click()
  }

  await expect(page.getByText(/09:00|10:00|11:00/).first()).toBeVisible()
})
