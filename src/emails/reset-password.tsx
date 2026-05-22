import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"

export function ResetPasswordEmail({ name, resetUrl }: { name: string; resetUrl: string }) {
  return (
    <EmailBase previewText="Redefinição de senha — Kira">
      <EmailHeading>Redefinir sua senha</EmailHeading>

      <EmailText>
        Olá, {name.split(" ")[0]}. Recebemos uma solicitação para redefinir a senha da sua conta no Kira.
      </EmailText>

      <EmailText>
        Clique no botão abaixo para criar uma nova senha. O link é válido por <strong>1 hora</strong>.
      </EmailText>

      <EmailButton href={resetUrl}>Redefinir senha</EmailButton>

      <EmailDivider />

      <EmailText muted>
        Se você não solicitou a redefinição, ignore este e-mail. Sua senha permanece a mesma.
      </EmailText>
    </EmailBase>
  )
}
