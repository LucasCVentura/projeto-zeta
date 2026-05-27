import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("cliente inexistente não entra em loop de redirecionamento", async ({ page }) => {
  await login(page)
  await page.goto(`/clientes/${crypto.randomUUID()}`)

  await expect(page).toHaveURL(/\/clientes\/.+/)
  await expect(
    page.getByText(/404|não encontrada|voltar para o início|tentar novamente/i).first()
  ).toBeVisible()
})

test("perfil carrega com ação de salvar", async ({ page }) => {
  await login(page)
  await page.goto("/perfil")

  await expect(page).toHaveURL(/\/perfil$/)
  await expect(page.getByRole("button", { name: /Salvar alterações/i })).toBeVisible()
})

