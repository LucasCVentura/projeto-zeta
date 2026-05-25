"use client"

import { useState, useTransition } from "react"
import { UserPlus, Trash2, X, Clock } from "lucide-react"
import { inviteMemberAction, removeMemberAction, cancelInviteAction } from "@/actions/team"
import type { OrgRole } from "@/db/schema"

const roleLabels: Record<OrgRole, string> = {
  owner: "Proprietário",
  professional: "Profissional",
  receptionist: "Recepcionista",
  financial: "Financeiro",
}

const roleColors: Record<OrgRole, string> = {
  owner: "bg-primary/10 text-primary",
  professional: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  receptionist: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
  financial: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
}

type Member = {
  userId: string
  role: OrgRole
  joinedAt: Date | null
  name: string
  email: string
}

type Invite = {
  id: string
  email: string
  role: OrgRole
  expiresAt: Date
}

export function TeamManager({
  members,
  pendingInvites,
  currentUserId,
}: {
  members: Member[]
  pendingInvites: Invite[]
  currentUserId: string
}) {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<OrgRole>("professional")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    startTransition(async () => {
      const result = await inviteMemberAction(email, name, role)
      if (result.success) {
        setEmail("")
        setName("")
        setSuccess("Convite enviado com sucesso!")
        setTimeout(() => setSuccess(null), 4000)
      } else {
        setError(result.error)
      }
    })
  }

  function handleRemove(userId: string, name: string) {
    if (!confirm(`Remover ${name} da equipe?`)) return
    startTransition(async () => {
      const result = await removeMemberAction(userId)
      if (!result.success) setError(result.error)
    })
  }

  function handleCancelInvite(inviteId: string) {
    startTransition(async () => {
      await cancelInviteAction(inviteId)
    })
  }

  return (
    <div className="space-y-6">
      {/* Membros atuais */}
      <div className="surface space-y-4">
        <h3 className="text-sm font-semibold">Membros da equipe</h3>
        <div className="space-y-2">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {m.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{m.name}</p>
                <p className="text-xs text-muted-foreground truncate">{m.email}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[m.role]}`}>
                {roleLabels[m.role]}
              </span>
              {m.userId !== currentUserId && m.role !== "owner" && (
                <button
                  onClick={() => handleRemove(m.userId, m.name)}
                  disabled={isPending}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                  title="Remover membro"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Convites pendentes */}
      {pendingInvites.length > 0 && (
        <div className="surface space-y-4">
          <h3 className="text-sm font-semibold">Convites pendentes</h3>
          <div className="space-y-2">
            {pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <Clock size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Expira em {new Date(inv.expiresAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[inv.role]}`}>
                  {roleLabels[inv.role]}
                </span>
                <button
                  onClick={() => handleCancelInvite(inv.id)}
                  disabled={isPending}
                  className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors disabled:opacity-50"
                  title="Cancelar convite"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulário de convite */}
      <div className="surface space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus size={16} className="text-primary" />
          <h3 className="text-sm font-semibold">Convidar membro</h3>
        </div>

        <form onSubmit={handleInvite} className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nome</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Função</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OrgRole)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="professional">Profissional — atende clientes, agenda, prontuários</option>
              <option value="receptionist">Recepcionista — agenda e clientes, sem financeiro</option>
              <option value="financial">Financeiro — só financeiro e relatórios</option>
            </select>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && <p className="text-xs text-green-600 dark:text-green-400">{success}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isPending ? "Enviando..." : "Enviar convite"}
          </button>
        </form>
      </div>
    </div>
  )
}
