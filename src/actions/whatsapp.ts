"use server"

import { db } from "@/db"
import { whatsappPendingConfirmations, appointments } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { sendWhatsAppTemplate, sendWhatsApp } from "@/lib/whatsapp-client"

const CONFIRMATION_TTL_DAYS = 3
const TEMPLATE_BOOKING_SUMMARY_ID =
  process.env.GUPSHUP_TEMPLATE_KIRA_RESUMO_AGENDAMENTO_ID || "kira_resumo_agendamento"
const TEMPLATE_PACKAGE_SUMMARY_ID =
  process.env.GUPSHUP_TEMPLATE_KIRA_RESUMO_PACOTE_ID || "kira_resumo_pacote"
const TEMPLATE_REMINDER_CONFIRMATION_ID =
  process.env.GUPSHUP_TEMPLATE_KIRA_LEMBRETE_CONFIRMACAO_ID || "kira_lembrete_confirmacao"
const TEMPLATE_POST_VISIT_ID =
  process.env.GUPSHUP_TEMPLATE_KIRA_AGRADECIMENTO_ID || "kira_agradecimento"

function formatDate(date: string) {
  const [year, month, day] = date.split("-")
  void year
  return `${day}/${month}`
}

function safeParam(value: string | null | undefined, fallback: string) {
  const text = (value ?? "").replace(/\s+/g, " ").trim()
  return text.length > 0 ? text : fallback
}

async function storePendingConfirmation(
  messageId: string,
  organizationId: string,
  appointmentId: string | null,
  clientPackageId: string | null
) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + CONFIRMATION_TTL_DAYS)
  await db.insert(whatsappPendingConfirmations).values({
    messageId,
    organizationId,
    appointmentId,
    clientPackageId,
    expiresAt,
  })
}

// ── Resumo de agendamento (ao criar) ─────────────────────────────────────────

export async function sendBookingSummary(params: {
  clientPhone: string
  clientName: string
  orgName: string
  orgAddress?: string | null
  date: string
  startTime: string
  procedure?: string | null
  templateId?: string
}): Promise<{ messageId: string } | null> {
  const { clientPhone, clientName, orgName, orgAddress, date, startTime, procedure, templateId } = params

  return sendWhatsAppTemplate(clientPhone, templateId || TEMPLATE_BOOKING_SUMMARY_ID, [
    safeParam(clientName, "Cliente"),
    safeParam(orgName, "Clinica"),
    formatDate(date),
    startTime.slice(0, 5),
    safeParam(procedure, "Sem procedimento"),
    safeParam(orgAddress, "Sem endereco"),
  ])
}

// ── Resumo de pacote (ao agendar sessões) ─────────────────────────────────────

export async function sendPackageBookingSummary(params: {
  clientPhone: string
  clientName: string
  orgName: string
  orgAddress?: string | null
  packageName: string
  sessions: { date: string; startTime: string }[]
}) {
  const { clientPhone, clientName, orgName, orgAddress, packageName, sessions } = params

  const sessionList = sessions
    .map((s, i) => `${i + 1}. ${formatDate(s.date)} às ${s.startTime.slice(0, 5)}`)
    .join("\n")

  await sendWhatsAppTemplate(clientPhone, TEMPLATE_PACKAGE_SUMMARY_ID, [
    safeParam(clientName, "Cliente"),
    safeParam(orgName, "Clinica"),
    safeParam(packageName, "Pacote"),
    sessionList,
    safeParam(orgAddress, "Sem endereco"),
  ])
}

// ── Lembrete + confirmação (2 dias antes) ────────────────────────────────────

export async function sendReminderWithConfirmation(params: {
  clientPhone: string
  clientName: string
  orgName: string
  orgAddress?: string | null
  date: string
  startTime: string
  procedure?: string | null
  appointmentId: string
  clientPackageId?: string | null
  organizationId: string
}) {
  const { clientPhone, clientName, orgName, orgAddress, date, startTime, procedure, appointmentId, clientPackageId, organizationId } = params

  const result = await sendWhatsAppTemplate(clientPhone, TEMPLATE_REMINDER_CONFIRMATION_ID, [
    safeParam(clientName, "Cliente"),
    safeParam(orgName, "Clinica"),
    formatDate(date),
    startTime.slice(0, 5),
    safeParam(procedure, "Sem procedimento"),
    safeParam(orgAddress, "Sem endereco"),
  ])

  if (result?.messageId) {
    await storePendingConfirmation(result.messageId, organizationId, appointmentId, clientPackageId ?? null)
  }
}

// ── Agradecimento pós-consulta (1 dia após concluído) ────────────────────────

export async function sendPostVisitThanks(params: {
  clientPhone: string
  clientName: string
  orgName: string
  googleReviewUrl?: string | null
}) {
  const { clientPhone, clientName, orgName, googleReviewUrl } = params

  await sendWhatsAppTemplate(clientPhone, TEMPLATE_POST_VISIT_ID, [
    safeParam(clientName, "Cliente"),
    safeParam(orgName, "Clinica"),
    safeParam(googleReviewUrl, ""),
  ])
}

// ── Handler do webhook (botão Confirmar / Cancelar) ──────────────────────────

export async function handleWhatsAppButtonReply(messageId: string, buttonTitle: string, fromPhone: string) {
  const [pending] = await db
    .select()
    .from(whatsappPendingConfirmations)
    .where(eq(whatsappPendingConfirmations.messageId, messageId))
    .limit(1)

  if (!pending || pending.expiresAt < new Date()) return

  const isConfirm = buttonTitle.toLowerCase().includes("confirmar")

  if (pending.clientPackageId) {
    const pkgAppts = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(eq(appointments.clientPackageId, pending.clientPackageId))

    const ids = pkgAppts.map((a) => a.id)
    if (ids.length > 0) {
      await db
        .update(appointments)
        .set({ status: isConfirm ? "confirmed" : "cancelled", updatedAt: new Date() })
        .where(inArray(appointments.id, ids))
    }

    if (!isConfirm) {
      await sendWhatsApp(fromPhone, "Suas sessões foram canceladas. Entre em contato com a clínica para reagendar. 😊")
    }
  } else if (pending.appointmentId) {
    await db
      .update(appointments)
      .set({ status: isConfirm ? "confirmed" : "cancelled", updatedAt: new Date() })
      .where(eq(appointments.id, pending.appointmentId))

    if (!isConfirm) {
      await sendWhatsApp(fromPhone, "Seu agendamento foi cancelado. Entre em contato com a clínica ou profissional para reagendar. 😊")
    }
  }

  await db
    .delete(whatsappPendingConfirmations)
    .where(eq(whatsappPendingConfirmations.messageId, messageId))
}
