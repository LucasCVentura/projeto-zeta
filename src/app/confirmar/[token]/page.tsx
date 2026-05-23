import { db } from "@/db"
import { appointments, organizations } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { verifyAppointmentToken } from "@/lib/appointment-tokens"
import { CheckCircle2, XCircle } from "lucide-react"
import { BonsaiIcon } from "@/components/ui/bonsai-icon"

export const metadata = { title: "Confirmar agendamento — Kira" }

export default async function ConfirmarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const parsed = verifyAppointmentToken(token)

  if (!parsed || parsed.action !== "confirm") {
    return <ResultPage ok={false} message="Link inválido ou expirado." />
  }

  const [appt] = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      date: appointments.date,
      startTime: appointments.startTime,
      organizationId: appointments.organizationId,
    })
    .from(appointments)
    .where(eq(appointments.id, parsed.appointmentId))
    .limit(1)

  if (!appt) {
    return <ResultPage ok={false} message="Agendamento não encontrado." />
  }

  if (appt.status === "confirmed") {
    return <ResultPage ok={true} message="Seu agendamento já estava confirmado. Até lá! 😊" />
  }

  if (appt.status === "cancelled" || appt.status === "missed" || appt.status === "completed") {
    return <ResultPage ok={false} message="Este agendamento não está mais disponível para confirmação." />
  }

  await db
    .update(appointments)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(and(eq(appointments.id, appt.id)))

  const [org] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, appt.organizationId))
    .limit(1)

  const [year, month, day] = appt.date.split("-")
  const formattedDate = `${day}/${month}/${year}`

  return (
    <ResultPage
      ok={true}
      message={`Presença confirmada para ${formattedDate} às ${appt.startTime}. Te esperamos na ${org?.name ?? "clínica"}! 💜`}
    />
  )
}

function ResultPage({ ok, message }: { ok: boolean; message: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="flex flex-col items-center gap-5 max-w-sm text-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
          <BonsaiIcon size={16} className="text-primary-foreground" />
        </div>
        {ok
          ? <CheckCircle2 size={48} className="text-green-500" />
          : <XCircle size={48} className="text-destructive" />
        }
        <p className="text-base font-medium">{message}</p>
      </div>
    </div>
  )
}
