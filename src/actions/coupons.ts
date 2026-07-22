"use server"

import { db } from "@/db"
import {
  coupons,
  couponRecipients,
  procedures,
  appointments,
  appointmentProcedures,
  type CouponKind,
} from "@/db/schema"
import { eq, and, inArray, desc, sql, ne } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { can } from "@/lib/permissions"
import { isFeatureEnabled } from "@/lib/feature-flags"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "./auth"

// ── Flag de rollout ────────────────────────────────────────────────────────────
// Feature liberada org por org antes de virar padrão (ver /admin → Novas Features).
// Checada aqui — não só escondida na UI — porque as actions são a superfície real
// de segurança; esconder o menu não impede alguém de chamar a action direto.

export async function isCouponsEnabledAction(): Promise<boolean> {
  const { organizationId } = await requireSession()
  return isFeatureEnabled(organizationId, "coupons")
}

// ── Criar cupom/vale-presente ─────────────────────────────────────────────────
// "quantity" reserva instâncias no ENVIO, não no resgate — cada linha inserida em
// coupon_recipients já é exclusiva daquele cliente, então não existe corrida por
// um pool compartilhado na hora de finalizar o atendimento.

export async function createCouponAction(data: {
  kind: CouponKind
  procedureId: string
  discountPct: number // ignorado (forçado a 100) quando kind === "gift"
  quantity: number // ignorado (forçado a 1) quando kind === "gift"
  expiresAt: string
  clientIds: string[] // lista final de destinatários; para "gift" deve ter exatamente 1
}): Promise<ActionResult & { queued?: number }> {
  const { userId, organizationId, role } = await requireSession()
  if (!can(role, "financial:write")) return { success: false, error: "Sem permissão." }
  if (!(await isFeatureEnabled(organizationId, "coupons"))) return { success: false, error: "Feature não disponível." }

  if (data.clientIds.length === 0) {
    return { success: false, error: "Selecione ao menos uma cliente." }
  }
  if (data.kind === "gift" && data.clientIds.length !== 1) {
    return { success: false, error: "Vale-presente é enviado pra uma única cliente por vez." }
  }

  const [procedure] = await db
    .select({ id: procedures.id })
    .from(procedures)
    .where(and(eq(procedures.id, data.procedureId), eq(procedures.organizationId, organizationId)))
  if (!procedure) return { success: false, error: "Procedimento não encontrado." }

  const isGift = data.kind === "gift"
  const discountPct = isGift ? 100 : Math.min(100, Math.max(1, Math.round(data.discountPct)))
  const quantity = isGift ? 1 : Math.max(1, Math.round(data.quantity))

  // Corta a lista de destinatários no limite da campanha — a quantidade define
  // quem RECEBE, não um teto verificado depois no resgate.
  const recipientClientIds = data.clientIds.slice(0, quantity)

  const [coupon] = await db
    .insert(coupons)
    .values({
      organizationId,
      kind: data.kind,
      procedureId: data.procedureId,
      discountPct,
      quantity,
      expiresAt: data.expiresAt,
      createdById: userId,
    })
    .returning({ id: coupons.id })

  const rows = recipientClientIds.map((clientId) => ({
    couponId: coupon.id,
    organizationId,
    clientId,
    token: crypto.randomUUID(),
  }))

  const inserted = await db
    .insert(couponRecipients)
    .values(rows)
    .onConflictDoNothing({ target: [couponRecipients.couponId, couponRecipients.clientId] })
    .returning({ id: couponRecipients.id })

  revalidatePath("/cupons")
  return { success: true, queued: inserted.length }
}

// ── Listar cupons da organização (com contagem de status dos destinatários) ───

export async function getCouponsAction() {
  const { organizationId } = await requireSession()
  if (!(await isFeatureEnabled(organizationId, "coupons"))) return []

  const rows = await db
    .select({
      id: coupons.id,
      kind: coupons.kind,
      discountPct: coupons.discountPct,
      quantity: coupons.quantity,
      expiresAt: coupons.expiresAt,
      createdAt: coupons.createdAt,
      procedureName: procedures.name,
      pending: sql<number>`count(*) filter (where ${couponRecipients.status} in ('pending','sent'))`,
      redeemed: sql<number>`count(*) filter (where ${couponRecipients.status} = 'redeemed')`,
      failed: sql<number>`count(*) filter (where ${couponRecipients.status} = 'failed')`,
      total: sql<number>`count(${couponRecipients.id})`,
    })
    .from(coupons)
    .innerJoin(procedures, eq(procedures.id, coupons.procedureId))
    .leftJoin(couponRecipients, eq(couponRecipients.couponId, coupons.id))
    .where(eq(coupons.organizationId, organizationId))
    .groupBy(coupons.id, procedures.name)
    .orderBy(desc(coupons.createdAt))

  return rows
}

// ── Cancelar cupom (expira o que ainda não foi resgatado) ────────────────────

export async function cancelCouponAction(couponId: string): Promise<ActionResult> {
  const { organizationId, role } = await requireSession()
  if (!can(role, "financial:write")) return { success: false, error: "Sem permissão." }
  if (!(await isFeatureEnabled(organizationId, "coupons"))) return { success: false, error: "Feature não disponível." }

  const [coupon] = await db
    .select({ id: coupons.id })
    .from(coupons)
    .where(and(eq(coupons.id, couponId), eq(coupons.organizationId, organizationId)))
  if (!coupon) return { success: false, error: "Cupom não encontrado." }

  await db
    .update(couponRecipients)
    .set({ status: "expired" })
    .where(
      and(
        eq(couponRecipients.couponId, couponId),
        ne(couponRecipients.status, "redeemed")
      )
    )

  revalidatePath("/cupons")
  return { success: true }
}

// ── Validar um QR escaneado na finalização do atendimento ────────────────────
// Só valida e devolve o preview do desconto — o resgate de fato (mudar status
// pra "redeemed") só acontece quando o atendimento é efetivamente concluído,
// em completeAppointmentWithRevenueAction, pra não marcar como usado um cupom
// cujo atendimento acabou não sendo salvo.

export async function redeemCouponAction(
  token: string,
  appointmentId: string
): Promise<
  | {
      success: true
      couponRecipientId: string
      kind: CouponKind
      procedureId: string
      procedureName: string
      discountPct: number
    }
  | { success: false; error: string }
> {
  const { organizationId, role } = await requireSession()
  if (!can(role, "schedule:update")) return { success: false, error: "Sem permissão." }
  if (!(await isFeatureEnabled(organizationId, "coupons"))) return { success: false, error: "Feature não disponível." }

  const [recipient] = await db
    .select({
      id: couponRecipients.id,
      status: couponRecipients.status,
      couponId: couponRecipients.couponId,
      kind: coupons.kind,
      discountPct: coupons.discountPct,
      procedureId: coupons.procedureId,
      procedureName: procedures.name,
      expiresAt: coupons.expiresAt,
    })
    .from(couponRecipients)
    .innerJoin(coupons, eq(coupons.id, couponRecipients.couponId))
    .innerJoin(procedures, eq(procedures.id, coupons.procedureId))
    .where(and(eq(couponRecipients.token, token), eq(couponRecipients.organizationId, organizationId)))

  if (!recipient) return { success: false, error: "Cupom não encontrado." }
  if (recipient.status === "redeemed") return { success: false, error: "Esse cupom já foi resgatado." }
  if (recipient.status === "expired" || recipient.status === "failed") {
    return { success: false, error: "Esse cupom não está mais válido." }
  }
  if (recipient.expiresAt < new Date().toISOString().slice(0, 10)) {
    return { success: false, error: "Esse cupom expirou." }
  }

  const [appt] = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.id, appointmentId), eq(appointments.organizationId, organizationId)))
  if (!appt) return { success: false, error: "Atendimento não encontrado." }

  const apptProcedureIds = await db
    .select({ procedureId: appointmentProcedures.procedureId })
    .from(appointmentProcedures)
    .where(eq(appointmentProcedures.appointmentId, appointmentId))

  const matches = apptProcedureIds.some((p) => p.procedureId === recipient.procedureId)
  if (!matches) {
    return { success: false, error: `Esse cupom é só pra "${recipient.procedureName}", que não está nesse atendimento.` }
  }

  return {
    success: true,
    couponRecipientId: recipient.id,
    kind: recipient.kind,
    procedureId: recipient.procedureId,
    procedureName: recipient.procedureName,
    discountPct: recipient.discountPct,
  }
}
