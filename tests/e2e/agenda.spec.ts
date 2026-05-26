import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("abre agenda e modal de novo agendamento", async ({ page }) => {
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
