import { describe, it, expect } from "vitest"
import { generateAnamnesisToken, verifyAnamnesisToken } from "../anamnesis-token"

const CLIENT_ID = "client-abc-123"
const ORG_ID = "org-xyz-456"

describe("generateAnamnesisToken / verifyAnamnesisToken", () => {
  it("gera token verificável", () => {
    const token = generateAnamnesisToken(CLIENT_ID, ORG_ID)
    const result = verifyAnamnesisToken(token)
    expect(result).toEqual({ clientId: CLIENT_ID, orgId: ORG_ID })
  })

  it("tokens para IDs diferentes são diferentes", () => {
    const t1 = generateAnamnesisToken("client-1", ORG_ID)
    const t2 = generateAnamnesisToken("client-2", ORG_ID)
    expect(t1).not.toBe(t2)
  })

  it("retorna null para token adulterado", () => {
    const token = generateAnamnesisToken(CLIENT_ID, ORG_ID)
    const tampered = token.slice(0, -4) + "xxxx"
    expect(verifyAnamnesisToken(tampered)).toBeNull()
  })

  it("retorna null para token sem ponto separador", () => {
    expect(verifyAnamnesisToken("sempontoseparador")).toBeNull()
  })

  it("retorna null para string vazia", () => {
    expect(verifyAnamnesisToken("")).toBeNull()
  })

  it("retorna null para payload base64 inválido com assinatura válida", () => {
    const token = generateAnamnesisToken(CLIENT_ID, ORG_ID)
    const [, sig] = token.split(".")
    expect(verifyAnamnesisToken(`invalido.${sig}`)).toBeNull()
  })
})
