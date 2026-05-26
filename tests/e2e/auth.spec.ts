import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

const hasE2ECreds = !!process.env.E2E_USER_EMAIL && !!process.env.E2E_USER_PASSWORD

test("login com credenciais válidas", async ({ page }) => {
  test.skip(!hasE2ECreds, "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD em .env.e2e")
  await login(page)
  await expect(page.getByText(/Dashboard|Agenda|Clientes|Financeiro/i).first()).toBeVisible()
})

test("erro com credenciais inválidas", async ({ page }) => {
  await page.goto("/login")
  await page.getByLabel("E-mail").fill("invalido@kira.local")
  await page.getByLabel("Senha").fill("senha-errada")
  await page.getByRole("button", { name: "Entrar" }).click()
  await expect(page).toHaveURL(/\/login(\?.*)?$/)
  await expect(page.getByRole("heading", { name: /Bem-vindo\(a\) de volta/i })).toBeVisible()
})
