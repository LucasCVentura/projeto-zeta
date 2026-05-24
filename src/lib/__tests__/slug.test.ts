import { describe, it, expect } from "vitest"
import { generateSlug, uniqueSlug } from "../slug"

describe("generateSlug", () => {
  it("converte para minúsculas", () => {
    expect(generateSlug("Clínica Kira")).toContain("kira")
  })

  it("remove acentos", () => {
    expect(generateSlug("Estética e Saúde")).toBe("estetica-e-saude")
  })

  it("substitui espaços por hífens", () => {
    expect(generateSlug("minha clinica")).toBe("minha-clinica")
  })

  it("remove caracteres especiais", () => {
    expect(generateSlug("Clínica & Spa!")).toBe("clinica-spa")
  })

  it("colapsa múltiplos espaços", () => {
    expect(generateSlug("a   b")).toBe("a-b")
  })

  it("limita a 48 caracteres", () => {
    const longa = "a".repeat(100)
    expect(generateSlug(longa).length).toBeLessThanOrEqual(48)
  })

  it("retorna string vazia para input vazio", () => {
    expect(generateSlug("")).toBe("")
  })

  it("trata cedilha corretamente", () => {
    expect(generateSlug("Açaí")).toBe("acai")
  })
})

describe("uniqueSlug", () => {
  it("retorna o slug base quando não há conflito", async () => {
    const slug = await uniqueSlug("Clínica Kira", async () => false)
    expect(slug).toBe("clinica-kira")
  })

  it("adiciona sufixo numérico quando slug já existe", async () => {
    let calls = 0
    // Primeiro existe, segundo não
    const slug = await uniqueSlug("Clinica", async () => calls++ < 1)
    expect(slug).toBe("clinica-1")
  })

  it("incrementa sufixo até encontrar slug livre", async () => {
    let calls = 0
    // Dois primeiros existem, terceiro não
    const slug = await uniqueSlug("Clinica", async () => calls++ < 2)
    expect(slug).toBe("clinica-2")
  })
})
