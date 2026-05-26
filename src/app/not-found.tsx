import Link from "next/link"
import { BonsaiIcon } from "@/components/ui/bonsai-icon"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-6">
        <BonsaiIcon size={22} className="text-primary" />
      </div>
      <h1 className="font-heading text-5xl font-bold text-foreground mb-2">404</h1>
      <p className="text-lg font-medium text-foreground mb-1">Página não encontrada</p>
      <p className="text-sm text-muted-foreground mb-8 max-w-sm">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Voltar ao início
      </Link>
    </div>
  )
}
