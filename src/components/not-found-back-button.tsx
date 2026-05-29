"use client"

import Link from "next/link"

const APP_PATH_PREFIXES = ["/dashboard", "/agenda", "/clientes", "/admin", "/configuracoes", "/financeiro", "/estoque", "/ajuda", "/assinatura"]

function isAppReferrer(referrer: string): boolean {
  try {
    const path = new URL(referrer).pathname
    return APP_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
  } catch {
    return false
  }
}

export function NotFoundBackButton() {
  const href =
    typeof document !== "undefined" && isAppReferrer(document.referrer)
      ? "/dashboard"
      : "/"

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
    >
      Voltar ao início
    </Link>
  )
}
