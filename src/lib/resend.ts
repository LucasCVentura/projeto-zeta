import { Resend } from "resend"

export const resend = new Resend(process.env.RESEND_API_KEY)

export const FROM_EMAIL = process.env.EMAIL_FROM ?? "Kira <onboarding@resend.dev>"
export const APP_URL = process.env.AUTH_URL ?? "https://projeto-zeta-aeut.vercel.app"
