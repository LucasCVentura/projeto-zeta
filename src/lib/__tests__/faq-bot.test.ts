import { describe, it, expect, vi, beforeEach } from "vitest"

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}))

vi.mock("groq-sdk", () => ({
  default: class {
    chat = { completions: { create: createMock } }
  },
}))

import { answerFaqQuestion } from "../faq-bot"

const originalKey = process.env.GROQ_API_KEY

describe("answerFaqQuestion", () => {
  beforeEach(() => {
    createMock.mockReset()
    process.env.GROQ_API_KEY = "test-key"
  })

  it("sem GROQ_API_KEY, não tenta chamar a IA", async () => {
    delete process.env.GROQ_API_KEY
    const result = await answerFaqQuestion("quanto custa?")
    expect(result).toEqual({ answered: false })
    expect(createMock).not.toHaveBeenCalled()
    process.env.GROQ_API_KEY = originalKey
  })

  it("resposta coberta pela base: devolve answered true e a resposta", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: '{"answered": true, "reply": "R$49,90/mês, com 7 dias grátis."}' } }],
    })
    const result = await answerFaqQuestion("quanto custa o kira?")
    expect(result).toEqual({ answered: true, reply: "R$49,90/mês, com 7 dias grátis." })
  })

  it("pergunta fora de escopo: devolve answered false", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: '{"answered": false}' } }],
    })
    const result = await answerFaqQuestion("quero cancelar minha assinatura")
    expect(result).toEqual({ answered: false })
  })

  it("resposta em markdown fence: ainda faz o parse certo", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: '```json\n{"answered": true, "reply": "Sim, dá pra instalar como app."}\n```' } }],
    })
    const result = await answerFaqQuestion("tem app?")
    expect(result).toEqual({ answered: true, reply: "Sim, dá pra instalar como app." })
  })

  it("JSON inválido: cai no fallback answered false", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: "isso não é json" } }],
    })
    const result = await answerFaqQuestion("qualquer coisa")
    expect(result).toEqual({ answered: false })
  })

  it("erro na chamada da API: cai no fallback answered false", async () => {
    createMock.mockRejectedValue(new Error("network error"))
    const result = await answerFaqQuestion("qualquer coisa")
    expect(result).toEqual({ answered: false })
  })

  it("answered true mas reply vazio: trata como não respondida", async () => {
    createMock.mockResolvedValue({
      choices: [{ message: { content: '{"answered": true, "reply": "   "}' } }],
    })
    const result = await answerFaqQuestion("qualquer coisa")
    expect(result).toEqual({ answered: false })
  })
})
