import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"

export function TrialEndingEmail({ name, daysLeft, appUrl }: { name: string; daysLeft: number; appUrl: string }) {
  return (
    <EmailBase previewText={`Seu trial expira em ${daysLeft} dia${daysLeft > 1 ? "s" : ""} — continue usando o Kira`}>
      <EmailHeading>
        {daysLeft === 1 ? "Último dia de trial! ⏰" : `Seu trial expira em ${daysLeft} dias`}
      </EmailHeading>

      <EmailText>
        Oi, {name.split(" ")[0]}! Seu período de teste gratuito no Kira termina em{" "}
        <strong>{daysLeft === 1 ? "hoje" : `${daysLeft} dias`}</strong>.
      </EmailText>

      <EmailText>
        Para continuar com sua agenda, clientes e prontuários sem interrupção, assine o plano Kira Pro por apenas <strong>R$49,90/mês</strong>.
      </EmailText>

      <EmailButton href={`${appUrl}/assinar`}>
        Assinar Kira Pro — R$49,90/mês
      </EmailButton>

      <EmailDivider />

      <EmailText muted>
        Cancele quando quiser, sem fidelidade. Seus dados ficam salvos.
      </EmailText>
    </EmailBase>
  )
}
