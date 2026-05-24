import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"

export function PixInvoiceEmail({ name, amount, expiresAt, appUrl }: {
  name: string
  amount: string
  expiresAt: string
  appUrl: string
}) {
  return (
    <EmailBase previewText="Seu QR code Pix do Kira está disponível">
      <EmailHeading>QR code Pix disponível 📲</EmailHeading>

      <EmailText>
        Oi, {name.split(" ")[0]}! O QR code para pagar sua mensalidade do <strong>Kira Pro</strong> já está pronto.
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
                <td style={{ fontSize: 13, color: "#a0948e", paddingTop: 8 }}>Válido até</td>
                <td align="right" style={{ fontSize: 13, color: "#4a3f3a", paddingTop: 8 }}>{expiresAt}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <EmailButton href={`${appUrl}/configuracoes/assinatura`}>
        Ver QR code e pagar
      </EmailButton>

      <EmailText muted>
        Acesse <a href={`${appUrl}/configuracoes/assinatura`} style={{ color: "#b06070" }}>Configurações → Assinatura</a> para visualizar o QR code e o código Pix para copiar e colar. O QR code expira na data indicada acima.
      </EmailText>

      <EmailDivider />

      <EmailText muted>
        Se não pagar dentro do prazo, sua assinatura será suspensa. Para evitar interrupções, considere adicionar um cartão de crédito como forma de pagamento principal.
      </EmailText>
    </EmailBase>
  )
}
