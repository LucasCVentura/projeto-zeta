import { FinanceiroView } from "@/components/financeiro/financeiro-view"

export default function FinanceiroPage() {
  return (
    <div className="container-page max-w-xl py-6 space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold">Financeiro</h2>
        <p className="text-sm text-muted-foreground mt-1">Receitas e atendimentos concluídos.</p>
      </div>
      <FinanceiroView />
    </div>
  )
}
