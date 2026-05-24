import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"

export function BoletoPaymentConfirmedEmail({ name, appUrl }: { name: string; appUrl: string }) {
  return (
    <EmailBase previewText="Pagamento via boleto confirmado — seu acesso ao Kira está liberado!">
      <EmailHeading>Pagamento confirmado! 🎉</EmailHeading>

      <EmailText>
        Oi, {name.split(" ")[0]}! Seu pagamento via boleto foi <strong>aprovado e compensado</strong>. Sua assinatura do <strong>Kira Pro</strong> está ativa.
      </EmailText>

      <EmailText>
        A partir de agora você tem acesso completo e ilimitado a todos os recursos da plataforma.
      </EmailText>

      <EmailButton href={`${appUrl}/dashboard`}>
        Acessar minha conta
      </EmailButton>

      <EmailDivider />

      <EmailText muted>
        Você pode gerenciar sua assinatura, trocar a forma de pagamento ou cancelar a qualquer momento em{" "}
        <a href={`${appUrl}/configuracoes/assinatura`} style={{ color: "#b06070" }}>
          Configurações → Assinatura
        </a>
        .
      </EmailText>
    </EmailBase>
  )
}
