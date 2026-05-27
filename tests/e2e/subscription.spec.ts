import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("owner acessa página de assinatura", async ({ page }) => {
  await login(page)
  await page.goto("/configuracoes/assinatura")

  const acceptCookies = page.getByRole("button", { name: /Entendi/i })
  if (await acceptCookies.isVisible()) await acceptCookies.click()

  await expect(page).toHaveURL(/\/configuracoes\/assinatura$/)
  await expect(page.getByText(/Assinatura|plano|cobrança/i).first()).toBeVisible()
})

