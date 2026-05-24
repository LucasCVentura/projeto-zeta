import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"

export function PixReminderEmail({ name, daysLeft, amount, appUrl }: {
  name: string
  daysLeft: number
  amount: string
  appUrl: string
}) {
  return (
    <EmailBase previewText={`Seu pagamento do Kira vence em ${daysLeft} dias`}>
      <EmailHeading>Seu pagamento se aproxima 🔔</EmailHeading>

      <EmailText>
        Oi, {name.split(" ")[0]}! Seu plano <strong>Kira Pro</strong> renova em{" "}
        <strong>{daysLeft} {daysLeft === 1 ? "dia" : "dias"}</strong> no valor de <strong>{amount}</strong>.
      </EmailText>

      <EmailText>
        Como você paga via <strong>Pix</strong>, o QR code de pagamento ficará disponível automaticamente na data de vencimento — tanto aqui no email quanto diretamente na sua conta.
      </EmailText>

      <EmailButton href={`${appUrl}/configuracoes/assinatura`}>
        Ver minha assinatura
      </EmailButton>

      <EmailDivider />

      <EmailText muted>
        Se preferir trocar para pagamento com cartão, acesse{" "}
        <a href={`${appUrl}/configuracoes/assinatura`} style={{ color: "#b06070" }}>
          Configurações → Assinatura
        </a>
        .
      </EmailText>
    </EmailBase>
  )
}
