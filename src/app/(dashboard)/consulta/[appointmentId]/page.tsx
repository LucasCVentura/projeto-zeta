import { notFound } from "next/navigation"
import { getAppointmentForConsultaAction } from "@/actions/consulta"
import { getClientPhotosAction } from "@/actions/photos"
import { ConsultaView } from "@/components/consulta/consulta-view"

type Props = { params: Promise<{ appointmentId: string }> }

export default async function ConsultaPage({ params }: Props) {
  const { appointmentId } = await params
  const appt = await getAppointmentForConsultaAction(appointmentId)
  if (!appt) notFound()

  const photos = await getClientPhotosAction(appt.clientId)

  return <ConsultaView appointment={appt} allClientPhotos={photos} />
}
