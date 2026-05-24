import { describe, it, expect } from "vitest"
import { cn } from "../utils"

describe("cn", () => {
  it("combina classes simples", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("ignora valores falsy", () => {
    expect(cn("a", undefined, null, false, "b")).toBe("a b")
  })

  it("resolve conflitos do Tailwind (última classe vence)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
  })

  it("mantém classes não conflitantes", () => {
    const result = cn("flex", "items-center", "text-sm")
    expect(result).toBe("flex items-center text-sm")
  })

  it("aceita objeto de condicionais", () => {
    expect(cn({ "font-bold": true, "text-red-500": false })).toBe("font-bold")
  })

  it("retorna string vazia sem argumentos", () => {
    expect(cn()).toBe("")
  })
})
