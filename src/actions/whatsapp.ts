"use server"

import { db } from "@/db"
import { whatsappPendingConfirmations, appointments } from "@/db/schema"
import { eq, inArray, sql } from "drizzle-orm"
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

async function getGlobalTemplateIds() {
  try {
    const rows = await db.execute<{
      bookingSummaryTemplateId: string | null
      packageSummaryTemplateId: string | null
      reminderConfirmationTemplateId: string | null
      postVisitTemplateId: string | null
    }>(sql`
      SELECT
        booking_summary_template_id as "bookingSummaryTemplateId",
        package_summary_template_id as "packageSummaryTemplateId",
        reminder_confirmation_template_id as "reminderConfirmationTemplateId",
        post_visit_template_id as "postVisitTemplateId"
      FROM whatsapp_system_template_settings
      WHERE singleton_key = 'default'
      LIMIT 1
    `)
    const one = Array.isArray(rows) ? rows[0] : rows.rows?.[0]
    return {
      bookingSummaryTemplateId: one?.bookingSummaryTemplateId?.trim() || TEMPLATE_BOOKING_SUMMARY_ID,
      packageSummaryTemplateId: one?.packageSummaryTemplateId?.trim() || TEMPLATE_PACKAGE_SUMMARY_ID,
      reminderConfirmationTemplateId: one?.reminderConfirmationTemplateId?.trim() || TEMPLATE_REMINDER_CONFIRMATION_ID,
      postVisitTemplateId: one?.postVisitTemplateId?.trim() || TEMPLATE_POST_VISIT_ID,
    }
  } catch {
    return {
      bookingSummaryTemplateId: TEMPLATE_BOOKING_SUMMARY_ID,
      packageSummaryTemplateId: TEMPLATE_PACKAGE_SUMMARY_ID,
      reminderConfirmationTemplateId: TEMPLATE_REMINDER_CONFIRMATION_ID,
      postVisitTemplateId: TEMPLATE_POST_VISIT_ID,
    }
  }
}

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
  console.log("[WhatsApp][Store] storing pending confirmation", { messageId, appointmentId, clientPackageId })
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + CONFIRMATION_TTL_DAYS)
  await db.insert(whatsappPendingConfirmations).values({
    messageId,
    organizationId,
    appointmentId,
    clientPackageId,
    expiresAt,
  })
  console.log("[WhatsApp][Store] stored OK", { messageId })
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
  const templates = await getGlobalTemplateIds()

  return sendWhatsAppTemplate(clientPhone, templateId || templates.bookingSummaryTemplateId, [
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

  const message = [
    `Olá, ${safeParam(clientName, "Cliente")}!`,
    `Suas sessões de ${safeParam(packageName, "Pacote")} na ${safeParam(orgName, "Clínica")} foram agendadas. ✅`,
    "",
    sessionList || "Sem sessões listadas.",
    "",
    `📍 Endereço: ${safeParam(orgAddress, "Sem endereço")}`,
    "",
    "Te esperamos! 💜",
  ].join("\n")

  await sendWhatsApp(clientPhone, message)
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
  const templates = await getGlobalTemplateIds()

  const result = await sendWhatsAppTemplate(clientPhone, templates.reminderConfirmationTemplateId, [
    safeParam(clientName, "Cliente"),
    safeParam(orgName, "Clinica"),
    formatDate(date),
    startTime.slice(0, 5),
    safeParam(procedure, "Sem procedimento"),
    safeParam(orgAddress, "Sem endereco"),
  ])

  console.log("[WhatsApp][Reminder] sendWhatsAppTemplate result", { messageId: result?.messageId ?? null, appointmentId })
  if (result?.messageId) {
    await storePendingConfirmation(result.messageId, organizationId, appointmentId, clientPackageId ?? null)
  } else {
    console.warn("[WhatsApp][Reminder] messageId ausente, pending confirmation NÃO salvo", { appointmentId })
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
  const templates = await getGlobalTemplateIds()

  await sendWhatsAppTemplate(clientPhone, templates.postVisitTemplateId, [
    safeParam(clientName, "Cliente"),
    safeParam(orgName, "Clinica"),
    safeParam(googleReviewUrl, ""),
  ])
}

// ── Handler do webhook (botão Confirmar / Cancelar) ──────────────────────────

export async function handleWhatsAppButtonReply(messageId: string, buttonTitle: string, fromPhone: string) {
  console.log("[WhatsApp][Handler] lookup messageId:", messageId)
  const [pending] = await db
    .select()
    .from(whatsappPendingConfirmations)
    .where(eq(whatsappPendingConfirmations.messageId, messageId))
    .limit(1)

  console.log("[WhatsApp][Handler] pending found:", pending ?? "NOT FOUND")
  if (!pending) return
  if (pending.expiresAt < new Date()) {
    console.log("[WhatsApp][Handler] expired:", pending.expiresAt)
    return
  }

  const isConfirm = buttonTitle.toLowerCase().includes("confirmar")
  console.log("[WhatsApp][Handler] isConfirm:", isConfirm, "appointmentId:", pending.appointmentId)

  if (pending.clientPackageId) {
    const pkgAppts = await db
      .select({ id: appointments.id })
      .from(appointments)
      .where(eq(appointments.clientPackageId, pending.clientPackageId))

    const ids = pkgAppts.map((a) => a.id)
    console.log("[WhatsApp][Handler] package update: ids=", ids, "status=", isConfirm ? "confirmed" : "cancelled")
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
    const newStatus = isConfirm ? "confirmed" : "cancelled"
    console.log("[WhatsApp][Handler] single appt update:", pending.appointmentId, "→", newStatus)
    const updated = await db
      .update(appointments)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(appointments.id, pending.appointmentId))
      .returning({ id: appointments.id, status: appointments.status })
    console.log("[WhatsApp][Handler] update result:", updated)

    if (!isConfirm) {
      await sendWhatsApp(fromPhone, "Seu agendamento foi cancelado. Entre em contato com a clínica ou profissional para reagendar. 😊")
    }
  }

  console.log("[WhatsApp][Handler] deleting pending", messageId)
  await db
    .delete(whatsappPendingConfirmations)
    .where(eq(whatsappPendingConfirmations.messageId, messageId))
}

// Fallback para clientes que enviam quick reply como texto sem context.id/gsId.
// Nesse caso, tentamos resolver pelo telefone de origem e pelo pending mais recente ainda válido.
export async function handleWhatsAppReplyByPhone(buttonTitle: string, fromPhone: string) {
  const digits = (fromPhone || "").replace(/\D/g, "")
  if (!digits) return

  const rows = await db.execute<{
    messageId: string
  }>(sql`
    SELECT p.message_id as "messageId"
    FROM whatsapp_pending_confirmations p
    JOIN appointments a ON a.id = p.appointment_id
    JOIN clients c ON c.id = a.client_id
    WHERE p.expires_at > now()
      AND regexp_replace(coalesce(c.phone, ''), '[^0-9]', '', 'g') = ${digits}
    ORDER BY p.created_at DESC
    LIMIT 1
  `)

  const pending = Array.isArray(rows) ? rows[0] : rows.rows?.[0]
  if (!pending?.messageId) return

  await handleWhatsAppButtonReply(pending.messageId, buttonTitle, fromPhone)
}
