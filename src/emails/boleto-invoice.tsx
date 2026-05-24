import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"

export function BoletoInvoiceEmail({ name, amount, expiresAt, boletoNumber, voucherUrl, appUrl }: {
  name: string
  amount: string
  expiresAt: string
  boletoNumber: string
  voucherUrl: string
  appUrl: string
}) {
  return (
    <EmailBase previewText="Seu boleto do Kira está disponível">
      <EmailHeading>Boleto disponível 🧾</EmailHeading>

      <EmailText>
        Oi, {name.split(" ")[0]}! Seu boleto para pagar a mensalidade do <strong>Kira Pro</strong> foi gerado.
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
              {boletoNumber && (
                <tr>
                  <td colSpan={2} style={{ paddingTop: 12 }}>
                    <div style={{ fontSize: 11, color: "#a0948e", marginBottom: 4 }}>Linha digitável</div>
                    <div style={{ fontSize: 12, fontFamily: "monospace", color: "#4a3f3a", wordBreak: "break-all" }}>
                      {boletoNumber}
                    </div>
                  </td>
                </tr>
              )}
            </table>
          </td>
        </tr>
      </table>

      <EmailButton href={voucherUrl}>
        Ver e imprimir boleto
      </EmailButton>

      <EmailText muted>
        Você também pode acessar o boleto em{" "}
        <a href={`${appUrl}/configuracoes/assinatura`} style={{ color: "#b06070" }}>
          Configurações → Assinatura
        </a>
        . Pague até a data de vencimento para evitar interrupção do serviço.
      </EmailText>

      <EmailDivider />

      <EmailText muted>
        Boletos podem levar até 3 dias úteis para compensar. Para pagamento imediato, considere usar cartão de crédito como forma de pagamento.
      </EmailText>
    </EmailBase>
  )
}
