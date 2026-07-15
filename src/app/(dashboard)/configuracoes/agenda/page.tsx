import { db } from "@/db"
import { organizations } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { ScheduleConfigForm } from "./schedule-config-form"

export default async function ConfiguracaoAgendaPage() {
  const { organizationId } = await requireSession()

  const [org] = await db
    .select({ slug: organizations.slug, type: organizations.type })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://kiraclinic.com.br"
  const bookingUrl = `${baseUrl}/agendar/${org?.slug ?? ""}`

  return <ScheduleConfigForm bookingUrl={bookingUrl} orgType={org?.type ?? "individual"} />
}
