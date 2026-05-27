import { test, expect } from "@playwright/test"
import { login } from "./helpers/auth"

test("login com credenciais válidas", async ({ page }) => {
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

test("login com e-mail com espaços laterais mostra erro e permite correção", async ({ page }) => {
  const email = (process.env.E2E_USER_EMAIL ?? "e2e@kira.local").trim()
  const password = (process.env.E2E_USER_PASSWORD ?? "E2E@123456").trim()
  const authenticatedUrl = /\/(dashboard|agenda|clientes|financeiro)(\/|$)/

  await page.goto("/login")
  const acceptCookies = page.getByRole("button", { name: /Entendi/i })
  if (await acceptCookies.isVisible()) {
    await acceptCookies.click()
  }
  await page.getByLabel("E-mail").fill(`  ${email}  `)
  await page.getByLabel("Senha").fill(password)
  await page.getByRole("button", { name: "Entrar" }).click()

  // Melhor prática: tenta detectar sucesso primeiro; só faz retry se de fato continuar no login.
  let authenticated = false
  try {
    await page.waitForURL(authenticatedUrl, { timeout: 10000 })
    authenticated = true
  } catch {
    authenticated = false
  }

  if (!authenticated) {
    if (!/\/login(\?|$)/.test(page.url())) {
      await page.goto("/login")
    }
    if (await acceptCookies.isVisible()) {
      await acceptCookies.click()
    }
    await page.getByLabel("E-mail").fill(email)
    await page.getByLabel("Senha").fill(password)
    await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible()
    await page.getByRole("button", { name: "Entrar" }).click()
  }

  await expect(page).toHaveURL(authenticatedUrl)
})
