import { requireSession } from "@/lib/session"
import { getTeamAction } from "@/actions/team"
import { TeamManager } from "@/components/settings/team-manager"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default async function EquipePage() {
  const { userId, role } = await requireSession()

  if (role !== "owner") redirect("/configuracoes")

  const { members, pendingInvites } = await getTeamAction()

  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/configuracoes" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="font-heading text-xl font-semibold">Equipe</h2>
          <p className="text-sm text-muted-foreground">Gerencie quem tem acesso à sua clínica</p>
        </div>
      </div>

      <TeamManager
        members={members}
        pendingInvites={pendingInvites}
        currentUserId={userId}
      />
    </div>
  )
}
