import { describe, it, expect, vi, beforeEach } from "vitest"
import { logWhatsAppSubmission, logWhatsAppEvent } from "../whatsapp-logs"

const { executeMock } = vi.hoisted(() => ({
  executeMock: vi.fn(),
}))

vi.mock("@/db", () => ({
  db: {
    execute: executeMock,
  },
}))

describe("whatsapp-logs", () => {
  beforeEach(() => {
    executeMock.mockReset()
    executeMock.mockResolvedValue({ rows: [] })
  })

  it("loga submissao com payload", async () => {
    await logWhatsAppSubmission({
      messageId: "msg-1",
      organizationId: "org-1",
      clientId: "client-1",
      destination: "5511999999999",
      templateId: "kira_resumo_agendamento",
      payload: { foo: "bar" },
    })
    expect(executeMock).toHaveBeenCalledTimes(1)
  })

  it("loga submissao sem payload", async () => {
    await logWhatsAppSubmission({
      messageId: "msg-2",
      templateId: "kira_resumo_agendamento",
    })
    expect(executeMock).toHaveBeenCalledTimes(1)
  })

  it("loga evento com erro", async () => {
    await logWhatsAppEvent({
      messageId: "msg-3",
      eventType: "failed",
      error: "1004",
      destination: "5511888888888",
      payload: { reason: "inactive" },
    })
    expect(executeMock).toHaveBeenCalledTimes(1)
  })

  it("loga evento sem erro e sem payload", async () => {
    await logWhatsAppEvent({
      messageId: "msg-4",
      eventType: "delivered",
    })
    expect(executeMock).toHaveBeenCalledTimes(1)
  })
})
