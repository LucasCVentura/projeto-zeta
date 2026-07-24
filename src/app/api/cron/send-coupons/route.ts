import { NextRequest, NextResponse } from "next/server"
import { dispatchPendingCoupons } from "@/lib/coupon-dispatch"

// Rede de segurança, não o caminho principal — o envio de verdade acontece na
// hora, via after() em createCouponAction (ver src/actions/coupons.ts). Esse
// cron só varre o que sobrou: campanhas maiores que o limite de disparo
// imediato, ou envios que falharam por algum erro transiente.
//
// Roda 1x/dia porque é o máximo que o plano Vercel em uso permite — não dá
// pra rodar de poucos em poucos minutos sem upgrade.
const BATCH_SIZE = 200

// Com o delay de 500ms entre envios (ver coupon-dispatch.ts), um lote cheio de
// 200 passa fácil do timeout default de function — sobe pro teto do plano Hobby.
export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await dispatchPendingCoupons(BATCH_SIZE)

  return NextResponse.json({ ok: true, ...result })
}
