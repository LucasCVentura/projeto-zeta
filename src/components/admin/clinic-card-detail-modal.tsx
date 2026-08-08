"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getClinicCardDetailAction, type ClinicCard, type CardDetailResult } from "@/actions/admin"
import { Loader2 } from "lucide-react"

const CARD_LABELS: Record<ClinicCard, string> = {
  clients: "Clientes",
  appointments: "Atendimentos",
  photos: "Fotos",
  revenue: "Receita",
  team: "Equipe",
  procedures: "Procedimentos",
  packages: "Pacotes",
  anamnesis: "Anamneses",
}

type Props = {
  card: ClinicCard
  orgId: string
  onClose: () => void
}

export function ClinicCardDetailModal({ card, orgId, onClose }: Props) {
  const [data, setData] = useState<CardDetailResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setData(null)
    setLoading(true)
    getClinicCardDetailAction(orgId, card)
      .then(setData)
      .finally(() => setLoading(false))
  }, [card, orgId])

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">{CARD_LABELS[card]}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
          </div>
        ) : !data || data.rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nada por aqui ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  {data.columns.map(c => (
                    <th key={c.key} className="px-2 py-2 font-medium">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-0">
                    {data.columns.map(c => (
                      <td key={c.key} className="px-2 py-2">{row[c.key]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {data.rows.length === 200 && (
              <p className="pt-3 text-center text-xs text-muted-foreground">Mostrando os 200 mais recentes.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
