import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("agenda permite navegar para próxima semana e voltar para hoje", async ({ page }) => {
  await login(page)
  await page.goto("/agenda")

  const dayBefore = await page.locator("main p").first().innerText()
  await page.locator("main > div button").nth(1).click()
  const dayAfter = await page.locator("main p").first().innerText()

  expect(dayAfter).not.toEqual(dayBefore)
  await page.getByRole("button", { name: "Hoje" }).click()
  await expect(page.getByRole("heading", { name: /Agenda/i })).toBeVisible()
})

test("configurações navega para páginas internas e volta", async ({ page }) => {
  await login(page)
  await page.goto("/configuracoes")

  const acceptCookies = page.getByRole("button", { name: "Entendi", exact: true })
  if (await acceptCookies.isVisible()) await acceptCookies.click()

  const agendaLink = page.getByRole("main").locator('a[href="/configuracoes/agenda"]')
  await agendaLink.click()
  await expect(page).toHaveURL(/\/configuracoes\/agenda$/)
  await page.goto("/configuracoes")
  await expect(page).toHaveURL(/\/configuracoes$/)

  const clinicaLink = page.getByRole("main").locator('a[href="/configuracoes/clinica"]')
  await clinicaLink.click()
  await expect(page).toHaveURL(/\/configuracoes\/clinica$/)
  await page.goto("/configuracoes")
  await expect(page).toHaveURL(/\/configuracoes$/)
})

test("clientes mostra estado vazio para busca inexistente", async ({ page }) => {
  await login(page)
  await page.goto("/clientes")

  await page.getByRole("main").getByPlaceholder("Buscar por nome ou telefone...").first().fill("ZZZ_CLIENTE_INEXISTENTE_E2E")
  await expect(page.getByText(/Nenhum cliente encontrado/i)).toBeVisible()
})
