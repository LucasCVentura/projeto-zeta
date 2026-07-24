import { notFound } from "next/navigation"
import { getProceduresForBookingAction } from "@/actions/schedule"
import { getClientsListAction } from "@/actions/clients"
import { getCouponsAction, isCouponsEnabledAction } from "@/actions/coupons"
import { CouponsView } from "@/components/coupons/coupons-view"

// createCouponAction dispara o envio real via after() logo após criar o cupom
// (ver src/actions/coupons.ts) — precisa de mais que o timeout default pra dar
// tempo de mandar várias mensagens de WhatsApp em sequência.
export const maxDuration = 45

export default async function CuponsPage() {
  // Feature em rollout gradual, por organização — ver /admin → Novas Features.
  if (!(await isCouponsEnabledAction())) notFound()

  const [procedures, clientsList, coupons] = await Promise.all([
    getProceduresForBookingAction(),
    getClientsListAction(),
    getCouponsAction(),
  ])

  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <div>
        <h1 className="font-heading text-xl font-semibold">Cupons e vale-presentes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Crie promoções e envie por WhatsApp com QR code — cada envio já reserva a instância pra quem recebeu.
        </p>
      </div>

      <CouponsView
        procedures={procedures}
        clients={clientsList.map((c) => ({ id: c.id, name: c.name }))}
        initialCoupons={coupons}
      />
    </div>
  )
}
