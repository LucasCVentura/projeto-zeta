import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { procedures } from "@/db/schema"
import { eq, and, inArray } from "drizzle-orm"
import {
  getOrganizationBySlug,
  getBookableProfessionals,
  listActiveProceduresPublic,
  findOrCreateClientByPhone,
  createPublicAppointment,
  checkPublicBookingRateLimit,
  recordPublicBookingAttempt,
  normalizePhone,
} from "@/lib/public-booking"

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)
  if (!org) return NextResponse.json({ error: "Link inválido." }, { status: 404 })

  const [professionals, procedureList] = await Promise.all([
    getBookableProfessionals(org.id),
    listActiveProceduresPublic(org.id),
  ])

  return NextResponse.json({
    orgId: org.id,
    orgName: org.name,
    orgType: org.type,
    orgPhone: org.phone,
    professionals,
    procedures: procedureList,
  })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ip = getClientIp(req)

  let body: {
    professionalId?: string
    procedureIds?: string[]
    date?: string
    startTime?: string
    clientName?: string
    clientPhone?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 })
  }

  const { professionalId, procedureIds, date, startTime, clientName, clientPhone } = body
  if (!professionalId || !procedureIds?.length || !date || !startTime || !clientName?.trim() || !clientPhone?.trim()) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 })
  }

  const phone = normalizePhone(clientPhone)
  if (phone.length < 10) {
    return NextResponse.json({ error: "Telefone inválido." }, { status: 400 })
  }

  const org = await getOrganizationBySlug(slug)
  if (!org) return NextResponse.json({ error: "Link inválido." }, { status: 404 })

  const limited = await checkPublicBookingRateLimit(ip, phone)
  if (limited) {
    return NextResponse.json(
      { error: "Muitas tentativas em pouco tempo. Aguarde um pouco ou fale direto com a profissional.", orgPhone: org.phone },
      { status: 429 }
    )
  }

  const bookable = await getBookableProfessionals(org.id)
  if (!bookable.some((p) => p.id === professionalId)) {
    await recordPublicBookingAttempt({ organizationId: org.id, ip, phone, success: false })
    return NextResponse.json({ error: "Profissional inválida." }, { status: 400 })
  }

  const validProcedures = await db
    .select({ id: procedures.id })
    .from(procedures)
    .where(and(eq(procedures.organizationId, org.id), inArray(procedures.id, procedureIds)))
  if (validProcedures.length !== procedureIds.length) {
    await recordPublicBookingAttempt({ organizationId: org.id, ip, phone, success: false })
    return NextResponse.json({ error: "Procedimento inválido." }, { status: 400 })
  }

  try {
    const clientId = await findOrCreateClientByPhone(org.id, { name: clientName, phone })

    const result = await createPublicAppointment({
      organizationId: org.id,
      professionalId,
      clientId,
      clientName: clientName.trim(),
      clientPhone: phone,
      date,
      startTime,
      procedureIds,
    })

    await recordPublicBookingAttempt({ organizationId: org.id, ip, phone, success: result.success })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    await recordPublicBookingAttempt({ organizationId: org.id, ip, phone, success: false })
    console.error("[PublicBooking] erro ao criar agendamento:", err)
    return NextResponse.json({ error: "Não foi possível concluir o agendamento. Tente novamente." }, { status: 500 })
  }
}
