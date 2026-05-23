import { db } from "@/db"
import { appointments, organizations } from "@/db/schema"
import { eq, inArray } from "drizzle-orm"
import { verifyBatchConfirmToken } from "@/lib/appointment-tokens"
import { CheckCircle2, XCircle } from "lucide-react"
import { BonsaiIcon } from "@/components/ui/bonsai-icon"

export const metadata = { title: "Confirmar sessões — Kira" }

export default async function ConfirmarSessoesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const parsed = verifyBatchConfirmToken(token)

  if (!parsed) {
    return <ResultPage ok={false} sessions={[]} message="Link inválido ou expirado." />
  }

  const appts = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      date: appointments.date,
      startTime: appointments.startTime,
      organizationId: appointments.organizationId,
    })
    .from(appointments)
    .where(inArray(appointments.id, parsed.appointmentIds))

  if (appts.length === 0) {
    return <ResultPage ok={false} sessions={[]} message="Agendamentos não encontrados." />
  }

  const alreadyConfirmed = appts.every((a) => a.status === "confirmed")
  if (alreadyConfirmed) {
    return (
      <ResultPage
        ok={true}
        sessions={appts}
        message="Suas sessões já estavam confirmadas. Até lá! 😊"
      />
    )
  }

  const confirmable = appts.filter((a) => a.status === "waiting")
  if (confirmable.length > 0) {
    await db
      .update(appointments)
      .set({ status: "confirmed", updatedAt: new Date() })
      .where(inArray(appointments.id, confirmable.map((a) => a.id)))
  }

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, appts[0].organizationId))
    .limit(1)

  return (
    <ResultPage
      ok={true}
      sessions={appts}
      message={`Presença confirmada em todas as sessões! Te esperamos na ${org?.name ?? "clínica"} 💜`}
    />
  )
}

type Session = { date: string; startTime: string }

function ResultPage({ ok, sessions, message }: { ok: boolean; sessions: Session[]; message: string }) {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date))

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="flex flex-col items-center gap-5 max-w-sm w-full text-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <BonsaiIcon size={16} className="text-primary-foreground" />
        </div>
        {ok
          ? <CheckCircle2 size={48} className="text-green-500" />
          : <XCircle size={48} className="text-destructive" />
        }
        <p className="text-base font-medium">{message}</p>
        {ok && sorted.length > 0 && (
          <div className="w-full rounded-xl border border-border bg-muted/30 divide-y divide-border text-left">
            {sorted.map((s, i) => {
              const [year, month, day] = s.date.split("-")
              return (
                <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="text-muted-foreground">Sessão {i + 1}</span>
                  <span className="font-medium">{day}/{month}/{year} às {s.startTime}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
