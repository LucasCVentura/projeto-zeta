"use server"

import { sendWhatsApp } from "@/lib/whatsapp-client"
import { makeAppointmentToken, makeBatchConfirmToken } from "@/lib/appointment-tokens"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL ?? "https://app.kirasaas.com.br"

export async function sendAppointmentConfirmation(params: {
  appointmentId: string
  clientPhone: string
  clientName: string
  date: string       // "2026-05-23"
  startTime: string  // "14:30"
  procedure?: string
  orgName: string
  orgAddress?: string | null
}) {
  const { appointmentId, clientPhone, clientName, date, startTime, procedure, orgName, orgAddress } = params
  const [year, month, day] = date.split("-")
  const formattedDate = `${day}/${month}/${year}`
  const proc = procedure ? `\n🩺 Procedimento: ${procedure}` : ""
  const addr = orgAddress ? `\n📍 Endereço: ${orgAddress}` : ""

  const confirmToken = makeAppointmentToken(appointmentId, "confirm")
  const cancelToken = makeAppointmentToken(appointmentId, "cancel")

  const body =
    `Olá, ${clientName}! 👋\n\n` +
    `Seu agendamento na *${orgName}* foi registrado. Por favor, confirme sua presença:\n\n` +
    `📅 Data: ${formattedDate}\n` +
    `⏰ Horário: ${startTime}${proc}${addr}\n\n` +
    `✅ *Confirmar presença:*\n${APP_URL}/confirmar/${confirmToken}\n\n` +
    `❌ *Não poderei comparecer:*\n${APP_URL}/recusar/${cancelToken}`

  await sendWhatsApp(clientPhone, body)
}

export async function sendAppointmentReminder(params: {
  clientPhone: string
  clientName: string
  date: string
  startTime: string
  procedure?: string
  orgName: string
  orgAddress?: string | null
}) {
  const { clientPhone, clientName, date, startTime, procedure, orgName, orgAddress } = params
  const [year, month, day] = date.split("-")
  const formattedDate = `${day}/${month}/${year}`
  const proc = procedure ? `\n🩺 Procedimento: ${procedure}` : ""
  const addr = orgAddress ? `\n📍 Endereço: ${orgAddress}` : ""

  const body =
    `Olá, ${clientName}! 🔔\n\n` +
    `Lembrete: você tem um agendamento *amanhã* na *${orgName}*.\n\n` +
    `📅 Data: ${formattedDate}\n` +
    `⏰ Horário: ${startTime}${proc}${addr}\n\n` +
    `Te esperamos! 😊`

  await sendWhatsApp(clientPhone, body)
}

export async function sendPackageScheduleConfirmation(params: {
  appointmentIds: string[]
  clientPhone: string
  clientName: string
  packageName: string
  procedureName: string
  orgName: string
  orgAddress?: string | null
  sessions: { date: string; startTime: string }[]
}) {
  const { appointmentIds, clientPhone, clientName, packageName, procedureName, orgName, orgAddress, sessions } = params

  const sessionList = sessions
    .map((s, i) => {
      const [year, month, day] = s.date.split("-")
      return `  ${i + 1}. ${day}/${month}/${year} às ${s.startTime}`
    })
    .join("\n")

  const addr = orgAddress ? `\n📍 ${orgAddress}` : ""
  const confirmToken = makeBatchConfirmToken(appointmentIds)

  const body =
    `Olá, ${clientName}! 📅\n\n` +
    `Suas sessões de *${procedureName}* (${packageName}) foram agendadas na *${orgName}*:\n\n` +
    `${sessionList}${addr}\n\n` +
    `Por favor, confirme todas as sessões:\n` +
    `✅ ${APP_URL}/confirmar-sessoes/${confirmToken}`

  await sendWhatsApp(clientPhone, body)
}

export async function sendPostConsultationMessage(params: {
  clientPhone: string
  clientName: string
  orgName: string
  googleReviewUrl?: string | null
}) {
  const { clientPhone, clientName, orgName, googleReviewUrl } = params

  const review = googleReviewUrl
    ? `\n\n⭐ Sua opinião é muito importante! Deixe sua avaliação:\n${googleReviewUrl}`
    : ""

  const body =
    `Olá, ${clientName}! 💜\n\n` +
    `Obrigado por nos visitar hoje na *${orgName}*.\n\n` +
    `Esperamos que tenha gostado do atendimento. Qualquer dúvida sobre o procedimento realizado, estamos à disposição.` +
    `${review}\n\n` +
    `Até a próxima! ✨`

  await sendWhatsApp(clientPhone, body)
}
