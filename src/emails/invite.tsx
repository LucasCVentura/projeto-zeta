import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"
import type { OrgRole } from "@/db/schema"

const roleLabels: Record<OrgRole, string> = {
  owner: "Proprietário",
  professional: "Profissional",
  receptionist: "Recepcionista",
  financial: "Financeiro",
}

export function InviteEmail({
  orgName,
  role,
  inviteUrl,
}: {
  orgName: string
  role: OrgRole
  inviteUrl: string
}) {
  return (
    <EmailBase previewText={`Você foi convidada para a equipe ${orgName} no Kira`}>
      <EmailHeading>Convite para a equipe 🌿</EmailHeading>

      <EmailText>
        Você foi convidada para entrar na clínica <strong>{orgName}</strong> no Kira como <strong>{roleLabels[role]}</strong>.
      </EmailText>

      <EmailText>
        Clique no botão abaixo para aceitar o convite. O link é válido por 7 dias.
      </EmailText>

      <EmailButton href={inviteUrl}>
        Aceitar convite
      </EmailButton>

      <EmailDivider />

      <EmailText muted>
        Se você não esperava receber este convite, pode ignorar este e-mail com segurança.
      </EmailText>
    </EmailBase>
  )
}
