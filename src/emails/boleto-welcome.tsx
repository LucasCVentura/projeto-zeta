import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"

export function BoletoWelcomeEmail({ name, amount, expiresAt, voucherUrl, appUrl }: {
  name: string
  amount: string
  expiresAt: string
  voucherUrl: string
  appUrl: string
}) {
  return (
    <EmailBase previewText="Seu boleto do Kira foi gerado — aguardando compensação">
      <EmailHeading>Boleto gerado! 🧾</EmailHeading>

      <EmailText>
        Oi, {name.split(" ")[0]}! Recebemos sua solicitação de assinatura do <strong>Kira Pro</strong>. Seu boleto está pronto.
      </EmailText>

      <table cellPadding={0} cellSpacing={0} style={{ width: "100%", margin: "4px 0 20px" }}>
        <tr>
          <td style={{
            backgroundColor: "#faf9f8",
            border: "1px solid #ede8e6",
            borderRadius: 12,
            padding: "16px",
          }}>
            <table cellPadding={0} cellSpacing={0} style={{ width: "100%" }}>
              <tr>
                <td style={{ fontSize: 13, color: "#a0948e" }}>Valor</td>
                <td align="right" style={{ fontSize: 15, fontWeight: 700, color: "#1a1014" }}>{amount}</td>
              </tr>
              <tr>
                <td style={{ fontSize: 13, color: "#a0948e", paddingTop: 8 }}>Vencimento</td>
                <td align="right" style={{ fontSize: 13, color: "#4a3f3a", paddingTop: 8 }}>{expiresAt}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <EmailButton href={voucherUrl}>
        Ver e imprimir boleto
      </EmailButton>

      <EmailText>
        Assim que o pagamento for <strong>compensado pelo banco</strong> (em até 3 dias úteis), seu acesso ao Kira Pro será liberado automaticamente e você receberá um e-mail de confirmação.
      </EmailText>

      <EmailDivider />

      <EmailText muted>
        Você também pode acessar o boleto em{" "}
        <a href={`${appUrl}/configuracoes/assinatura`} style={{ color: "#b06070" }}>
          Configurações → Assinatura
        </a>
        . Boletos vencem na data indicada acima — após o vencimento será necessário gerar um novo.
      </EmailText>
    </EmailBase>
  )
}
