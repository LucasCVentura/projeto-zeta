import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("edita campo de perfil e mantém ação de salvar disponível", async ({ page }) => {
  await login(page)
  await page.goto("/perfil")

  const instagramValue = `e2e_${Date.now()}`
  const instagramInput = page.getByLabel("Instagram")

  await instagramInput.click({ clickCount: 3 })
  await instagramInput.fill(instagramValue)
  const acceptCookies = page.getByRole("button", { name: /Entendi/i })
  if (await acceptCookies.isVisible()) {
    await acceptCookies.click()
  }
  await page.getByRole("button", { name: /Salvar alterações/i }).click()
  await expect(page.getByRole("button", { name: /Salvar alterações|Salvando...|Salvo!/i })).toBeVisible()
  await expect(instagramInput).toHaveValue(instagramValue)
})

test("acessa configurações e entra na seção de agenda", async ({ page }) => {
  await login(page)
  await page.goto("/configuracoes")

  const acceptCookies = page.getByRole("button", { name: /Entendi/i })
  if (await acceptCookies.isVisible()) {
    await acceptCookies.click()
  }
  await expect(page).toHaveURL(/\/configuracoes$/)
  await page.waitForLoadState("networkidle")
  await page.locator('a[href="/configuracoes/agenda"]').click()
  await expect(page).toHaveURL(/\/configuracoes\/agenda$/)
  await expect(page.getByText(/Dias de trabalho|Horário inicial/i).first()).toBeVisible()
})
