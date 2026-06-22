import * as React from "react"
import { EmailBase, EmailHeading, EmailText, EmailButton, EmailDivider } from "./base"

export function WelcomeEmail({ name, appUrl }: { name: string; appUrl: string }) {
  return (
    <EmailBase previewText={`Bem-vindo(a) ao Kira, ${name}! Seu trial de 7 dias começa agora.`}>
      <EmailHeading>Bem-vindo(a) ao Kira, {name.split(" ")[0]}! 🌿</EmailHeading>

      <EmailText>
        Sua conta foi criada com sucesso. Você tem <strong>7 dias grátis</strong> para explorar tudo que o Kira oferece — sem cartão de crédito.
      </EmailText>

      <EmailButton href={`${appUrl}/dashboard`}>
        Acessar minha conta
      </EmailButton>

      <EmailDivider />

      <EmailText muted>O que você pode fazer agora:</EmailText>

      {[
        "📅  Configure sua agenda e horários de atendimento",
        "👤  Cadastre seus primeiros clientes",
        "📋  Registre procedimentos e crie prontuários",
        "📸  Tire fotos e analise a evolução com IA",
        "💰  Acompanhe seu financeiro em tempo real",
      ].map((item) => (
        <p key={item} style={{ fontSize: 14, color: "#4a3f3a", margin: "0 0 8px 0", lineHeight: 1.5 }}>
          {item}
        </p>
      ))}

      <EmailDivider />

      <EmailText muted>
        Dúvidas? Responda este e-mail que a gente te ajuda.
      </EmailText>
    </EmailBase>
  )
}
