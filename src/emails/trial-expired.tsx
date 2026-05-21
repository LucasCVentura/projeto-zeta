import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"

export function TrialExpiredEmail({ name, appUrl }: { name: string; appUrl: string }) {
  return (
    <EmailBase previewText="Seu trial expirou — seus dados estão salvos, assine para continuar">
      <EmailHeading>Seu período de teste terminou 🌿</EmailHeading>

      <EmailText>
        Oi, {name.split(" ")[0]}! Esperamos que tenha curtido o Kira esses últimos 7 dias.
      </EmailText>

      <EmailText>
        Seu acesso foi pausado, mas <strong>todos os seus dados estão salvos</strong> — clientes, agenda, prontuários e fotos continuam lá, esperando por você.
      </EmailText>

      <EmailText>
        Assine agora para retomar de onde parou:
      </EmailText>

      <EmailButton href={`${appUrl}/assinar`}>
        Reativar minha conta — R$49,90/mês
      </EmailButton>

      <EmailDivider />

      <EmailText muted>
        Cancele quando quiser, sem fidelidade. Dúvidas? Responda este e-mail.
      </EmailText>
    </EmailBase>
  )
}
