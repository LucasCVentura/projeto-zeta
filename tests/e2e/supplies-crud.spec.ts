import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("CRUD de insumo no estoque", async ({ page }) => {
  const unique = Date.now()
  const supplyName = `Insumo E2E ${unique}`
  const supplyNameUpdated = `${supplyName} Editado`

  await login(page)
  await page.goto("/estoque")

  const acceptCookies = page.getByRole("button", { name: "Entendi", exact: true })
  if (await acceptCookies.isVisible()) await acceptCookies.click()

  await page.getByRole("button", { name: /Novo insumo/i }).click()
  const supplyForm = page.locator(".surface", {
    has: page.getByRole("heading", { name: "Novo insumo", exact: true }),
  })
  await expect(supplyForm.getByRole("heading", { name: "Novo insumo", exact: true })).toBeVisible()

  await supplyForm.getByPlaceholder("Ex: Ácido hialurônico").fill(supplyName)
  await supplyForm.getByPlaceholder("0,00").fill("45,90")
  await supplyForm.getByPlaceholder("0").first().fill("20")
  await supplyForm.getByPlaceholder("0").nth(1).fill("5")
  await supplyForm.getByRole("button", { name: /^Salvar$/i }).click()

  await expect(page.getByText(supplyName)).toBeVisible()

  const row = page.locator("tr", { hasText: supplyName }).first()
  await row.locator("button").nth(0).click()

  const editForm = page.locator(".surface", {
    has: page.getByRole("heading", { name: "Editar insumo", exact: true }),
  })
  await expect(editForm.getByRole("heading", { name: "Editar insumo", exact: true })).toBeVisible()
  await editForm.getByPlaceholder("Ex: Ácido hialurônico").fill(supplyNameUpdated)
  await editForm.getByRole("button", { name: /^Salvar$/i }).click()

  await expect(page.getByText(supplyNameUpdated)).toBeVisible()

  const updatedRow = page.locator("tr", { hasText: supplyNameUpdated }).first()
  await updatedRow.locator("button").nth(1).click()
  await expect(page.getByRole("heading", { name: /Remover insumo/i })).toBeVisible()
  await page.getByRole("button", { name: /^Remover$/i }).click()

  await expect(page.getByText(supplyNameUpdated)).toHaveCount(0)
})
