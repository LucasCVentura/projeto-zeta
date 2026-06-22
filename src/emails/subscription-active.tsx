import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"

export function SubscriptionActiveEmail({ name, appUrl }: { name: string; appUrl: string }) {
  return (
    <EmailBase previewText="Assinatura confirmada! Bem-vindo(a) ao Kira Pro 🎉">
      <EmailHeading>Assinatura confirmada! 🎉</EmailHeading>

      <EmailText>
        Oi, {name.split(" ")[0]}! Sua assinatura do <strong>Kira Pro</strong> está ativa. Obrigado por confiar no Kira para gerenciar sua clínica.
      </EmailText>

      <EmailText>
        A partir de agora você tem acesso completo e ilimitado a todos os recursos da plataforma.
      </EmailText>

      <EmailButton href={`${appUrl}/dashboard`}>
        Acessar minha conta
      </EmailButton>

      <EmailDivider />

      <EmailText muted>
        Você pode gerenciar sua assinatura, trocar o cartão ou cancelar a qualquer momento em{" "}
        <a href={`${appUrl}/configuracoes/assinatura`} style={{ color: "#b06070" }}>
          Configurações → Assinatura
        </a>
        .
      </EmailText>
    </EmailBase>
  )
}
