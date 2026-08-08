import { describe, it, expect, vi, beforeEach } from "vitest"

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}))

vi.mock("groq-sdk", () => ({
  default: class {
    chat = { completions: { create: createMock } }
  },
}))

import { answerPatientNotice, buildPatientNoticeFallback } from "../patient-notice-bot"

const originalKey = process.env.GROQ_API_KEY

describe("answerPatientNotice", () => {
  beforeEach(() => {
    createMock.mockReset()
    process.env.GROQ_API_KEY = "test-key"
  })

  it("sem GROQ_API_KEY, devolve o fallback fixo sem chamar a IA", async () => {
    delete process.env.GROQ_API_KEY
    const result = await answerPatientNotice("cheguei", "Studio Camila", "(11) 3847-5520")
    expect(result).toBe(buildPatientNoticeFallback("Studio Camila", "(11) 3847-5520"))
    expect(createMock).not.toHaveBeenCalled()
    process.env.GROQ_API_KEY = originalKey
  })

  it("resposta da IA: devolve o texto gerado", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: "Que bom que você chegou! Fala direto com a clínica pelo (11) 3847-5520." } }],
    })
    const result = await answerPatientNotice("cheguei", "Studio Camila", "(11) 3847-5520")
    expect(result).toBe("Que bom que você chegou! Fala direto com a clínica pelo (11) 3847-5520.")
  })

  it("resposta vazia da IA: cai no fallback", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: "" } }] })
    const result = await answerPatientNotice("cheguei", "Studio Camila", "(11) 3847-5520")
    expect(result).toBe(buildPatientNoticeFallback("Studio Camila", "(11) 3847-5520"))
  })

  it("erro na chamada da API: cai no fallback", async () => {
    createMock.mockRejectedValue(new Error("network error"))
    const result = await answerPatientNotice("cheguei", "Studio Camila", "(11) 3847-5520")
    expect(result).toBe(buildPatientNoticeFallback("Studio Camila", "(11) 3847-5520"))
  })
})

describe("buildPatientNoticeFallback", () => {
  it("com telefone da clínica: inclui o número", () => {
    const result = buildPatientNoticeFallback("Studio Camila", "(11) 3847-5520")
    expect(result).toContain("Studio Camila")
    expect(result).toContain("(11) 3847-5520")
  })

  it("sem telefone da clínica: orienta pelo canal já usado, sem inventar número", () => {
    const result = buildPatientNoticeFallback("Studio Camila", null)
    expect(result).toContain("Studio Camila")
    expect(result).toContain("canal que você já usa")
  })
})
