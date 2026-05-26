import { expect, type Page } from "@playwright/test"

export async function login(page: Page) {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD

  if (!email || !password) {
    throw new Error("Defina E2E_USER_EMAIL e E2E_USER_PASSWORD para rodar os testes E2E.")
  }

  await page.goto("/login")
  await page.getByLabel("E-mail").fill(email)
  await page.getByLabel("Senha").fill(password)
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page).toHaveURL(/\/dashboard|\/agenda|\/clientes|\/financeiro/)
}
