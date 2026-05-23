import { getDaySlots, getProceduresForBookingAction } from "@/actions/schedule"
import { AgendaView } from "@/components/agenda/agenda-view"
import { requireSession } from "@/lib/session"
import { db } from "@/db"
import { scheduleConfig } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import Link from "next/link"
import { todayBRT } from "@/lib/date"

type Props = { searchParams: Promise<{ data?: string }> }

export default async function AgendaPage({ searchParams }: Props) {
  const params = await searchParams
  const today = todayBRT()
  const date = params.data ?? today

  const { userId, organizationId } = await requireSession()

  const [config] = await db
    .select()
    .from(scheduleConfig)
    .where(
      and(
        eq(scheduleConfig.organizationId, organizationId),
        eq(scheduleConfig.userId, userId)
      )
    )
    .limit(1)

  const [{ slots, hasConfig }, procedures] = await Promise.all([
    getDaySlots(date),
    getProceduresForBookingAction(),
  ])

  return (
    <div className="container-page py-6 space-y-6">
      {!hasConfig && (
        <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-5 text-center space-y-2">
          <p className="font-medium text-sm">Sua agenda ainda não está configurada</p>
          <p className="text-xs text-muted-foreground">
            Configure seus horários de trabalho para começar a receber agendamentos.
          </p>
          <Link
            href="/configuracoes/agenda"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Configurar agenda
          </Link>
        </div>
      )}

      <AgendaView
        initialDate={date}
        slots={slots}
        hasConfig={hasConfig}
        slotDuration={config?.slotDuration ?? 60}
        procedures={procedures}
      />
    </div>
  )
}
