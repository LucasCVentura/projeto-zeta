import { db } from "@/db"
import { invites, organizations, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { KiraMark } from "@/components/ui/kira-mark"
import { AcceptInviteButton } from "@/components/settings/accept-invite-button"
import { SetPasswordForm } from "@/components/settings/set-password-form"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import Link from "next/link"
import type { OrgRole } from "@/db/schema"

export const metadata = { title: "Convite — Kira" }

const roleLabels: Record<OrgRole, string> = {
  owner: "Proprietário",
  professional: "Profissional",
  receptionist: "Recepcionista",
  financial: "Financeiro",
}

export default async function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const [invite] = await db
    .select()
    .from(invites)
    .where(eq(invites.token, token))
    .limit(1)

  if (!invite) {
    return <ResultPage icon="error" message="Convite não encontrado ou inválido." />
  }

  if (invite.acceptedAt) {
    return <ResultPage icon="ok" message="Este convite já foi aceito." />
  }

  if (invite.expiresAt < new Date()) {
    return <ResultPage icon="expired" message="Este convite expirou. Peça um novo ao responsável pela clínica." />
  }

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, invite.organizationId))
    .limit(1)

  // Verifica se o usuário convidado já tem senha (conta existente) ou não (criado pelo invite)
  const [invitedUser] = await db
    .select({ password: users.password, name: users.name })
    .from(users)
    .where(eq(users.email, invite.email))
    .limit(1)

  const hasPassword = !!invitedUser?.password
  const inviteeName = invitedUser?.name ?? ""

  const session = await auth()
  const loggedEmail = session?.user?.email ?? null
  const emailMatches = loggedEmail?.toLowerCase() === invite.email.toLowerCase()

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
              <KiraMark size={24} />
            </div>
            <span className="font-semibold text-lg tracking-tight">Kira</span>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5 shadow-sm">
          <div className="space-y-1 text-center">
            <h1 className="font-heading text-xl font-semibold">
              {hasPassword ? "Você foi convidada" : `Olá, ${inviteeName.split(" ")[0]}!`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {hasPassword
                ? <>para entrar na clínica <strong className="text-foreground">{org?.name}</strong></>
                : <>Defina sua senha para acessar a clínica <strong className="text-foreground">{org?.name}</strong></>
              }
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Clínica</span>
              <span className="font-medium">{org?.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Função</span>
              <span className="font-medium">{roleLabels[invite.role]}</span>
            </div>
          </div>

          {/* Usuário sem senha (criado pelo invite) — define senha direto */}
          {!hasPassword && (
            <SetPasswordForm token={token} />
          )}

          {/* Usuário com conta existente + logado com e-mail certo */}
          {hasPassword && session && emailMatches && (
            <AcceptInviteButton token={token} />
          )}

          {/* Usuário com conta existente + logado com e-mail errado */}
          {hasPassword && session && !emailMatches && (
            <div className="space-y-3">
              <p className="text-xs text-center text-muted-foreground">
                Você está logado como <strong>{loggedEmail}</strong>, mas o convite é para <strong>{invite.email}</strong>.
              </p>
              <Link
                href={`/login?next=/convite/${token}`}
                className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Entrar com outra conta
              </Link>
            </div>
          )}

          {/* Usuário com conta existente + não logado */}
          {hasPassword && !session && (
            <Link
              href={`/login?next=/convite/${token}`}
              className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Entrar para aceitar
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultPage({ icon, message }: { icon: "ok" | "error" | "expired"; message: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="flex justify-center">
          {icon === "ok" && <CheckCircle2 size={48} className="text-green-500" />}
          {icon === "error" && <XCircle size={48} className="text-destructive" />}
          {icon === "expired" && <Clock size={48} className="text-amber-500" />}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link href="/dashboard" className="inline-block text-sm text-primary hover:underline">
          Ir para o dashboard
        </Link>
      </div>
    </div>
  )
}
