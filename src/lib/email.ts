import { resend, FROM_EMAIL, APP_URL } from "./resend"
import { createElement } from "react"
import { WelcomeEmail } from "@/emails/welcome"
import { TrialEndingEmail } from "@/emails/trial-ending"
import { TrialExpiredEmail } from "@/emails/trial-expired"
import { SubscriptionActiveEmail } from "@/emails/subscription-active"
import { ResetPasswordEmail } from "@/emails/reset-password"

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
