import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("CRUD de procedimento", async ({ page }) => {
  const unique = Date.now()
  const procedureName = `Procedimento E2E ${unique}`
  const procedureNameUpdated = `${procedureName} Editado`

  await login(page)
  await page.goto("/configuracoes/procedimentos")

  const acceptCookies = page.getByRole("button", { name: "Entendi", exact: true })
  if (await acceptCookies.isVisible()) await acceptCookies.click()

  await page.getByRole("button", { name: /Adicionar procedimento/i }).click()
  await expect(page.getByText("Novo procedimento")).toBeVisible()

  await page.getByLabel("Nome").fill(procedureName)
  await page.getByLabel(/Valor \(R\$\)/i).fill("15000")
  await page.getByRole("button", { name: /^Salvar$/i }).last().click()

  await expect(page.getByText(procedureName)).toBeVisible()

  const row = page.locator(".surface", { hasText: procedureName }).first()
  await row.locator("button").nth(0).click()

  const editRow = page.locator(".surface", {
    has: page.getByRole("textbox", { name: "Nome", exact: true }),
  }).first()
  await editRow.getByRole("textbox", { name: "Nome", exact: true }).fill(procedureNameUpdated)
  await editRow.locator('input[inputmode="numeric"]').first().fill("18000")
  await editRow.getByRole("button", { name: /^Salvar$/i }).click()

  await expect(page.getByText(procedureNameUpdated)).toBeVisible()

  const updatedRow = page.locator(".surface", { hasText: procedureNameUpdated }).first()
  await updatedRow.locator("button").nth(1).click()

  await expect(page.getByText(procedureNameUpdated)).toHaveCount(0)
})
