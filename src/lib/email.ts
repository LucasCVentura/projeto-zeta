import { resend, FROM_EMAIL, APP_URL } from "./resend"
import { createElement } from "react"
import { WelcomeEmail } from "@/emails/welcome"
import { TrialEndingEmail } from "@/emails/trial-ending"
import { TrialExpiredEmail } from "@/emails/trial-expired"
import { SubscriptionActiveEmail } from "@/emails/subscription-active"
import { ResetPasswordEmail } from "@/emails/reset-password"
import { PixReminderEmail } from "@/emails/pix-reminder"
import { PixInvoiceEmail } from "@/emails/pix-invoice"
import { BoletoInvoiceEmail } from "@/emails/boleto-invoice"
import { BoletoWelcomeEmail } from "@/emails/boleto-welcome"
import { BoletoPaymentConfirmedEmail } from "@/emails/boleto-payment-confirmed"
import { BoletoExpiredEmail } from "@/emails/boleto-expired"
import { InviteEmail } from "@/emails/invite"
import type { OrgRole } from "@/db/schema"

export async function sendWelcomeEmail(to: string, name: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Bem-vinda ao Kira! 🌿",
    react: createElement(WelcomeEmail, { name, appUrl: APP_URL }),
  })
}

export async function sendTrialEndingEmail(to: string, name: string, daysLeft: number) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: daysLeft === 1
      ? "⏰ Último dia do seu trial no Kira"
      : `Seu trial no Kira expira em ${daysLeft} dias`,
    react: createElement(TrialEndingEmail, { name, daysLeft, appUrl: APP_URL }),
  })
}

export async function sendTrialExpiredEmail(to: string, name: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Seu período de teste terminou — seus dados estão salvos",
    react: createElement(TrialExpiredEmail, { name, appUrl: APP_URL }),
  })
}

export async function sendResetPasswordEmail(to: string, name: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  const result = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Redefinição de senha — Kira",
    react: createElement(ResetPasswordEmail, { name, resetUrl }),
  })
  console.log("[sendResetPasswordEmail] from:", FROM_EMAIL, "to:", to, "result:", JSON.stringify(result))
  if (result.error) throw new Error(result.error.message)
  return result
}

export async function sendSubscriptionActiveEmail(to: string, name: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Assinatura confirmada! Bem-vinda ao Kira Pro 🎉",
    react: createElement(SubscriptionActiveEmail, { name, appUrl: APP_URL }),
  })
}

export async function sendPixReminderEmail(to: string, name: string, daysLeft: number, amount: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Seu pagamento do Kira vence em ${daysLeft} ${daysLeft === 1 ? "dia" : "dias"}`,
    react: createElement(PixReminderEmail, { name, daysLeft, amount, appUrl: APP_URL }),
  })
}

export async function sendPixInvoiceEmail(to: string, name: string, amount: string, expiresAt: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Seu QR code Pix do Kira está disponível 📲",
    react: createElement(PixInvoiceEmail, { name, amount, expiresAt, appUrl: APP_URL }),
  })
}

export async function sendBoletoWelcomeEmail(
  to: string,
  name: string,
  amount: string,
  expiresAt: string,
  voucherUrl: string,
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Seu boleto do Kira foi gerado — aguardando compensação 🧾",
    react: createElement(BoletoWelcomeEmail, { name, amount, expiresAt, voucherUrl, appUrl: APP_URL }),
  })
}

export async function sendBoletoPaymentConfirmedEmail(to: string, name: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Pagamento via boleto confirmado — acesso ao Kira liberado! 🎉",
    react: createElement(BoletoPaymentConfirmedEmail, { name, appUrl: APP_URL }),
  })
}

export async function sendBoletoInvoiceEmail(
  to: string,
  name: string,
  amount: string,
  expiresAt: string,
  boletoNumber: string,
  voucherUrl: string,
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Seu boleto do Kira está disponível 🧾",
    react: createElement(BoletoInvoiceEmail, { name, amount, expiresAt, boletoNumber, voucherUrl, appUrl: APP_URL }),
  })
}

export async function sendBoletoExpiredEmail(to: string, name: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Seu boleto venceu — renove sua assinatura do Kira",
    react: createElement(BoletoExpiredEmail, { name, appUrl: APP_URL }),
  })
}

export async function sendInviteEmail(to: string, orgName: string, token: string, role: OrgRole) {
  const inviteUrl = `${APP_URL}/convite/${token}`
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Você foi convidada para a equipe ${orgName} no Kira`,
    react: createElement(InviteEmail, { orgName, role, inviteUrl }),
  })
}
