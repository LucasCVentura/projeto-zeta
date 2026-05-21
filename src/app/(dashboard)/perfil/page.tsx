import { getCurrentUserAction } from "@/actions/user"
import { ProfileForm } from "@/components/profile/profile-form"
import { redirect } from "next/navigation"

export default async function PerfilPage() {
  const user = await getCurrentUserAction()
  if (!user) redirect("/login")

  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Meu perfil</h2>
        <p className="text-sm text-muted-foreground mt-1">Informações pessoais e profissionais.</p>
      </div>
      <ProfileForm user={user} />
    </div>
  )
}
