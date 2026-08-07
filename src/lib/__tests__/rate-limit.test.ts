import { describe, it, expect, vi, beforeEach } from "vitest"

const { selectMock, insertMock, deleteMock } = vi.hoisted(() => ({
  selectMock: vi.fn(),
  insertMock: vi.fn(),
  deleteMock: vi.fn(),
}))

vi.mock("@/db", () => ({
  db: {
    select: selectMock,
    insert: insertMock,
    delete: deleteMock,
  },
}))

function mockCount(count: number) {
  selectMock.mockReturnValue({
    from: () => ({
      where: () => Promise.resolve([{ count }]),
    }),
  })
}

import { isRateLimited, recordFailure } from "../rate-limit"

describe("isRateLimited", () => {
  beforeEach(() => {
    selectMock.mockReset()
  })

  it("login: libera quando ainda não bateu o limite (10)", async () => {
    mockCount(9)
    expect(await isRateLimited("login", "a@b.com")).toBe(false)
  })

  it("login: bloqueia ao bater exatamente o limite (10)", async () => {
    mockCount(10)
    expect(await isRateLimited("login", "a@b.com")).toBe(true)
  })

  it("login: bloqueia acima do limite", async () => {
    mockCount(15)
    expect(await isRateLimited("login", "a@b.com")).toBe(true)
  })

  it("password_reset: bloqueia já na primeira tentativa registrada (limite 1)", async () => {
    mockCount(1)
    expect(await isRateLimited("password_reset", "a@b.com")).toBe(true)
  })

  it("password_reset: libera quando não há tentativa nenhuma", async () => {
    mockCount(0)
    expect(await isRateLimited("password_reset", "a@b.com")).toBe(false)
  })
})

describe("recordFailure", () => {
  beforeEach(() => {
    insertMock.mockReset()
    deleteMock.mockReset()
    insertMock.mockReturnValue({ values: () => Promise.resolve() })
    deleteMock.mockReturnValue({ where: () => Promise.resolve() })
  })

  it("insere uma tentativa", async () => {
    const originalRandom = Math.random
    Math.random = () => 0.5 // acima do gatilho de limpeza (0.02), não deve limpar
    await recordFailure("login", "a@b.com")
    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(deleteMock).not.toHaveBeenCalled()
    Math.random = originalRandom
  })

  it("ocasionalmente também limpa tentativas antigas", async () => {
    const originalRandom = Math.random
    Math.random = () => 0.001 // abaixo do gatilho de limpeza
    await recordFailure("login", "a@b.com")
    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(deleteMock).toHaveBeenCalledTimes(1)
    Math.random = originalRandom
  })
})
