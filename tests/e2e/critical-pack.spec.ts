import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("rotas privadas redirecionam para login sem sessão", async ({ page }) => {
  const privateRoutes = ["/agenda", "/clientes", "/financeiro", "/configuracoes"]

  await page.context().clearCookies()
  for (const route of privateRoutes) {
    await page.goto(route).catch(() => {})
    await expect(page).toHaveURL(/\/login(\?.*)?$/)
  }
})

test("assets críticos do PWA e branding carregam", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest")
  expect(manifest.ok()).toBeTruthy()
  expect(await manifest.text()).toContain('"short_name":"Kira"')

  const sw = await request.get("/sw.js")
  expect(sw.ok()).toBeTruthy()

  const logo = await request.get("/brand/kira-bonsai-mark.png")
  expect(logo.ok()).toBeTruthy()
  const logoType = logo.headers()["content-type"] ?? ""
  expect(logoType).toContain("image/png")
})

test("cria cliente e abre evolução fotográfica", async ({ page }) => {
  const unique = Date.now()
  const clientName = `Cliente Fotos E2E ${unique}`

  await login(page)
  await page.goto("/clientes/novo")
  await page.getByLabel("Nome completo *").fill(clientName)
  await page.getByRole("button", { name: "Continuar" }).click()
  await page.getByRole("button", { name: "Continuar" }).click()

  const acceptCookies = page.getByRole("button", { name: /Entendi/i })
  if (await acceptCookies.isVisible()) await acceptCookies.click()

  await page.getByRole("button", { name: "Cadastrar cliente" }).click()
  await expect(page).toHaveURL(/\/clientes\/[0-9a-f-]{36}$/i)
  const clientUrl = page.url()

  await page.goto(`${clientUrl}/fotos`)
  await expect(page.getByRole("heading", { name: /Evolução fotográfica/i })).toBeVisible()
})
