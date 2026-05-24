import { describe, it, expect } from "vitest"
import {
  makeAppointmentToken,
  verifyAppointmentToken,
  makeBatchConfirmToken,
  verifyBatchConfirmToken,
} from "../appointment-tokens"

const ID = "appt-abc-123"

describe("makeAppointmentToken / verifyAppointmentToken", () => {
  it("gera token verificável para confirm", () => {
    const token = makeAppointmentToken(ID, "confirm")
    const result = verifyAppointmentToken(token)
    expect(result).toEqual({ appointmentId: ID, action: "confirm" })
  })

  it("gera token verificável para cancel", () => {
    const token = makeAppointmentToken(ID, "cancel")
    const result = verifyAppointmentToken(token)
    expect(result).toEqual({ appointmentId: ID, action: "cancel" })
  })

  it("tokens de confirm e cancel são diferentes", () => {
    expect(makeAppointmentToken(ID, "confirm")).not.toBe(makeAppointmentToken(ID, "cancel"))
  })

  it("tokens de IDs diferentes são diferentes", () => {
    expect(makeAppointmentToken("id-1", "confirm")).not.toBe(makeAppointmentToken("id-2", "confirm"))
  })

  it("retorna null para token adulterado", () => {
    const token = makeAppointmentToken(ID, "confirm")
    const tampered = token.slice(0, -4) + "xxxx"
    expect(verifyAppointmentToken(tampered)).toBeNull()
  })

  it("retorna null para token inválido", () => {
    expect(verifyAppointmentToken("nao-e-um-token")).toBeNull()
  })

  it("retorna null para string vazia", () => {
    expect(verifyAppointmentToken("")).toBeNull()
  })

  it("retorna null para ação desconhecida no payload", () => {
    const payload = Buffer.from(`${ID}:delete:fakesig`).toString("base64url")
    expect(verifyAppointmentToken(payload)).toBeNull()
  })
})

describe("makeBatchConfirmToken / verifyBatchConfirmToken", () => {
  const IDS = ["appt-1", "appt-2", "appt-3"]

  it("gera token verificável para batch", () => {
    const token = makeBatchConfirmToken(IDS)
    const result = verifyBatchConfirmToken(token)
    expect(result).toEqual({ appointmentIds: IDS })
  })

  it("tokens gerados com IDs em ordens diferentes são equivalentes", () => {
    // signBatch usa ids.sort() — garante que a mesma assinatura vale para qualquer ordem
    const t1 = makeBatchConfirmToken(["appt-1", "appt-2", "appt-3"])
    const t2 = makeBatchConfirmToken(["appt-3", "appt-1", "appt-2"])
    // ambos devem verificar com sucesso
    expect(verifyBatchConfirmToken(t1)).not.toBeNull()
    expect(verifyBatchConfirmToken(t2)).not.toBeNull()
  })

  it("retorna null para token adulterado", () => {
    const token = makeBatchConfirmToken(IDS)
    const tampered = token.slice(0, -4) + "ZZZZ"
    expect(verifyBatchConfirmToken(tampered)).toBeNull()
  })

  it("retorna null para token inválido", () => {
    expect(verifyBatchConfirmToken("invalido")).toBeNull()
  })

  it("retorna null para lista de IDs vazia no payload", () => {
    const payload = Buffer.from(JSON.stringify({ ids: [], sig: "abc" })).toString("base64url")
    expect(verifyBatchConfirmToken(payload)).toBeNull()
  })
})
