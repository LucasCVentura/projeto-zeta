"use server"

import { sendWhatsApp } from "@/lib/twilio"

export async function sendAppointmentConfirmation(params: {
  clientPhone: string
  clientName: string
  date: string       // "2026-05-23"
  startTime: string  // "14:30"
  procedure?: string
  orgName: string
}) {
  const { clientPhone, clientName, date, startTime, procedure, orgName } = params
  const [year, month, day] = date.split("-")
  const formattedDate = `${day}/${month}/${year}`
  const proc = procedure ? ` — ${procedure}` : ""

  const body =
    `Olá, ${clientName}! ✅\n\n` +
    `Seu agendamento na *${orgName}* foi confirmado.\n\n` +
    `📅 Data: ${formattedDate}\n` +
    `⏰ Horário: ${startTime}${proc}\n\n` +
    `Em caso de dúvidas ou necessidade de reagendar, entre em contato conosco.`

  await sendWhatsApp(clientPhone, body)
}

export async function sendAppointmentReminder(params: {
  clientPhone: string
  clientName: string
  date: string
  startTime: string
  procedure?: string
  orgName: string
}) {
  const { clientPhone, clientName, date, startTime, procedure, orgName } = params
  const [year, month, day] = date.split("-")
  const formattedDate = `${day}/${month}/${year}`
  const proc = procedure ? ` — ${procedure}` : ""

  const body =
    `Olá, ${clientName}! 🔔\n\n` +
    `Lembrete: você tem um agendamento *amanhã* na *${orgName}*.\n\n` +
    `📅 Data: ${formattedDate}\n` +
    `⏰ Horário: ${startTime}${proc}\n\n` +
    `Até amanhã! 😊`

  await sendWhatsApp(clientPhone, body)
}

export async function sendPostConsultationMessage(params: {
  clientPhone: string
  clientName: string
  orgName: string
}) {
  const { clientPhone, clientName, orgName } = params

  const body =
    `Olá, ${clientName}! 💜\n\n` +
    `Obrigado por nos visitar hoje na *${orgName}*.\n\n` +
    `Esperamos que tenha gostado do atendimento. Qualquer dúvida sobre o procedimento realizado, estamos à disposição.\n\n` +
    `Até a próxima! ✨`

  await sendWhatsApp(clientPhone, body)
}
