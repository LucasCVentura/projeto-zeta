import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("CRUD de pacote", async ({ page }) => {
  const unique = Date.now()
  const packageName = `Pacote E2E ${unique}`
  const packageNameUpdated = `${packageName} Editado`

  await login(page)
  await page.goto("/configuracoes/pacotes")

  const acceptCookies = page.getByRole("button", { name: "Entendi", exact: true })
  if (await acceptCookies.isVisible()) await acceptCookies.click()

  const dismissHint = page.getByRole("button", { name: "Entendi, não mostrar novamente", exact: true })
  if (await dismissHint.isVisible()) await dismissHint.click()

  await page.getByRole("button", { name: /Novo pacote/i }).click()
  const packageForm = page.locator(".surface", {
    has: page.getByRole("heading", { name: "Novo pacote", exact: true }),
  })
  await expect(packageForm.getByRole("heading", { name: "Novo pacote", exact: true })).toBeVisible()

  await packageForm.getByPlaceholder("Ex: Pacote Bioestimulador 4 sessões").fill(packageName)
  await packageForm.getByPlaceholder("0,00").first().fill("899,90")
  await packageForm.getByPlaceholder("0,00").nth(1).fill("350,00")

  await packageForm.getByRole("button", { name: /^Salvar$/i }).click()

  await expect(page.getByText(packageName)).toBeVisible()

  const row = page.locator(".surface", { hasText: packageName }).first()
  await row.locator("button").nth(0).click()

  const editForm = page.locator(".surface", {
    has: page.getByRole("heading", { name: "Editar pacote", exact: true }),
  })
  await expect(editForm.getByRole("heading", { name: "Editar pacote", exact: true })).toBeVisible()
  await editForm.getByPlaceholder("Ex: Pacote Bioestimulador 4 sessões").fill(packageNameUpdated)
  await editForm.getByRole("button", { name: /^Salvar$/i }).click()

  await expect(page.getByText(packageNameUpdated)).toBeVisible()

  const updatedRow = page.locator(".surface", { hasText: packageNameUpdated }).first()
  await updatedRow.locator("button").nth(1).click()
  await expect(page.getByRole("heading", { name: /Remover pacote/i })).toBeVisible()
  await page.getByRole("button", { name: /^Remover$/i }).click()

  await expect(page.getByText(packageNameUpdated)).toHaveCount(0)
})
