import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"

export function BoletoExpiredEmail({ name, appUrl }: { name: string; appUrl: string }) {
  return (
    <EmailBase previewText="Seu boleto venceu — renove sua assinatura para continuar usando o Kira">
      <EmailHeading>Seu boleto venceu</EmailHeading>

      <EmailText>
        Oi, {name.split(" ")[0]}! O boleto da sua assinatura do <strong>Kira Pro</strong> venceu sem pagamento e seu acesso foi suspenso.
      </EmailText>

      <EmailText>
        Para voltar a usar o Kira, gere um novo boleto ou pague com cartão de crédito — leva menos de 1 minuto.
      </EmailText>

      <EmailButton href={`${appUrl}/assinar`}>
        Renovar assinatura
      </EmailButton>

      <EmailDivider />

      <EmailText muted>
        Dúvidas? Responda este e-mail e a gente te ajuda.
      </EmailText>
    </EmailBase>
  )
}
