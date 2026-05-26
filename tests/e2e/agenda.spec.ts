import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

const hasE2ECreds = !!process.env.E2E_USER_EMAIL && !!process.env.E2E_USER_PASSWORD

test("abre agenda e modal de novo agendamento", async ({ page }) => {
  test.skip(!hasE2ECreds, "Defina E2E_USER_EMAIL e E2E_USER_PASSWORD em .env.e2e")
  await login(page)
  await page.goto("/agenda")
  await expect(page.getByRole("heading", { name: /Agenda/i })).toBeVisible()

  const addButtons = page.getByText("+ Agendar")
  await expect(addButtons.first()).toBeVisible()
  await addButtons.first().click()

  await expect(page.getByRole("heading", { name: /Novo agendamento/i })).toBeVisible()
  await page.getByRole("button", { name: /Cancelar/i }).click()
  await expect(page.getByRole("heading", { name: /Novo agendamento/i })).toBeHidden()
})
