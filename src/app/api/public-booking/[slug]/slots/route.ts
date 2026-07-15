import { NextRequest, NextResponse } from "next/server"
import { getOrganizationBySlug, getBookableProfessionals, getPublicWeekSlots } from "@/lib/public-booking"

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { searchParams } = new URL(req.url)
  const professionalId = searchParams.get("professionalId")
  const datesParam = searchParams.get("dates")

  if (!professionalId || !datesParam) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 })
  }

  const org = await getOrganizationBySlug(slug)
  if (!org) return NextResponse.json({ error: "Link inválido." }, { status: 404 })

  const bookable = await getBookableProfessionals(org.id)
  if (!bookable.some((p) => p.id === professionalId)) {
    return NextResponse.json({ error: "Profissional inválida." }, { status: 400 })
  }

  const dates = datesParam.split(",").filter(Boolean)
  const slots = await getPublicWeekSlots(org.id, professionalId, dates)
  return NextResponse.json({ slots })
}
