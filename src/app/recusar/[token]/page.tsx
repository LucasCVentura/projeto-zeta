import { db } from "@/db"
import { appointments, organizations, clients, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { verifyAppointmentToken } from "@/lib/appointment-tokens"
import { notifyOrganizationProfessionals } from "@/actions/notifications"
import { sendWhatsApp } from "@/lib/whatsapp-client"
import { XCircle, Phone } from "lucide-react"
import { KiraMark } from "@/components/ui/kira-mark"

export const metadata = { title: "Recusar agendamento — Kira" }

export default async function RecusarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const parsed = verifyAppointmentToken(token)

  if (!parsed || parsed.action !== "cancel") {
    return <ResultPage orgPhone={null} orgName={null} error="Link inválido ou expirado." />
  }

  const [appt] = await db
    .select({
      id: appointments.id,
      status: appointments.status,
      date: appointments.date,
      startTime: appointments.startTime,
      procedure: appointments.procedure,
      organizationId: appointments.organizationId,
      professionalId: appointments.professionalId,
      clientId: appointments.clientId,
    })
    .from(appointments)
    .where(eq(appointments.id, parsed.appointmentId))
    .limit(1)

  if (!appt) {
    return <ResultPage orgPhone={null} orgName={null} error="Agendamento não encontrado." />
  }

  const [org] = await db
    .select({ name: organizations.name, phone: organizations.phone })
    .from(organizations)
    .where(eq(organizations.id, appt.organizationId))
    .limit(1)

  if (appt.status === "cancelled") {
    return <ResultPage orgPhone={org?.phone ?? null} orgName={org?.name ?? null} error="Este agendamento já foi cancelado." />
  }

  if (appt.status === "completed" || appt.status === "missed") {
    return <ResultPage orgPhone={org?.phone ?? null} orgName={org?.name ?? null} error="Este agendamento não pode mais ser cancelado." />
  }

  await db
    .update(appointments)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(appointments.id, appt.id))

  // Busca nome do cliente
  const [clientData] = await db
    .select({ name: clients.name })
    .from(clients)
    .where(eq(clients.id, appt.clientId))
    .limit(1)

  const [year, month, day] = appt.date.split("-")
  const formattedDate = `${day}/${month}/${year}`
  const clientName = clientData?.name ?? "Cliente"
  const proc = appt.procedure ? ` — ${appt.procedure}` : ""
  const title = `${clientName} recusou o agendamento`
  const body = `${clientName} não poderá comparecer em ${formattedDate} às ${appt.startTime}${proc}. O horário foi liberado.`

  // Notificação no sininho
  try {
    await notifyOrganizationProfessionals({
      organizationId: appt.organizationId,
      type: "appointment_cancelled",
      title,
      body,
      href: "/agenda",
    })
  } catch { /* silencioso */ }

  // WhatsApp para o profissional
  try {
    const [professional] = await db
      .select({ phone: users.phone, whatsapp: users.whatsapp })
      .from(users)
      .where(eq(users.id, appt.professionalId))
      .limit(1)

    const profPhone = professional?.whatsapp ?? professional?.phone
    if (profPhone) {
      await sendWhatsApp(profPhone, `⚠️ *${title}*\n\n${body}`)
    }
  } catch { /* silencioso */ }

  return <ResultPage orgPhone={org?.phone ?? null} orgName={org?.name ?? null} error={null} />
}

function ResultPage({ orgPhone, orgName, error }: { orgPhone: string | null; orgName: string | null; error: string | null }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
      <div className="flex flex-col items-center gap-5 max-w-sm text-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-primary/10">
          <KiraMark size={23} />
        </div>
        <XCircle size={48} className="text-destructive" />
        {error ? (
          <p className="text-base font-medium">{error}</p>
        ) : (
          <>
            <p className="text-base font-medium">Agendamento cancelado.</p>
            <p className="text-sm text-muted-foreground">
              Sentimos muito que não poderá comparecer.
              {orgName && ` Para remarcar, entre em contato com ${orgName}.`}
            </p>
            {orgPhone && (
              <a
                href={`https://wa.me/55${orgPhone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-3 text-sm font-medium text-white"
              >
                <Phone size={15} /> Falar com a clínica
              </a>
            )}
          </>
        )}
      </div>
    </div>
  )
}
