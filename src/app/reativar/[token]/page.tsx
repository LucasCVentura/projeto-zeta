"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { reactivateTrialAction } from "@/actions/admin"
import { Loader2, CheckCircle, XCircle, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type State = "loading" | "success" | "error" | "needs-login"

export default function ReativarPage() {
  const { token } = useParams<{ token: string }>()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [state, setState] = useState<State>("loading")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      setState("needs-login")
      return
    }

    reactivateTrialAction(token).then((result) => {
      if (result.success) {
        setState("success")
        setTimeout(() => router.push("/dashboard"), 3500)
      } else {
        setState("error")
        setErrorMsg(result.error ?? "Não foi possível reativar.")
      }
    })
  }, [status, token, router])

  const firstName = session?.user?.name?.split(" ")[0] ?? ""

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted/30 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm text-center space-y-5">
        {/* Logo */}
        <div className="flex justify-center mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.svg" alt="Kira" className="h-10 w-10" />
        </div>

        {state === "loading" && (
          <>
            <Loader2 size={40} className="mx-auto text-primary animate-spin" />
            <p className="font-semibold text-lg">Reativando sua conta...</p>
            <p className="text-sm text-muted-foreground">Só um segundo! 😊</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle size={44} className="mx-auto text-emerald-500" />
            <p className="font-semibold text-xl">
              {firstName ? `Bem-vindo(a) de volta, ${firstName}! 🎉` : "Bem-vindo(a) de volta! 🎉"}
            </p>
            <p className="text-sm text-muted-foreground">
              Sua conta foi reativada com <strong>7 dias grátis</strong>. Aproveite!
            </p>
            <p className="text-xs text-muted-foreground">Redirecionando para o Kira...</p>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle size={44} className="mx-auto text-destructive" />
            <p className="font-semibold text-lg">Não foi possível reativar</p>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <Link href="/dashboard" className="block w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground text-center hover:bg-primary/90 transition-colors">
              Ir para o Kira
            </Link>
          </>
        )}

        {state === "needs-login" && (
          <>
            <LogIn size={40} className="mx-auto text-primary" />
            <p className="font-semibold text-lg">Entre na sua conta</p>
            <p className="text-sm text-muted-foreground">
              Para ganhar seus <strong>7 dias grátis</strong>, faça login e a reativação acontece automaticamente.
            </p>
            <Link href={`/login?callbackUrl=/reativar/${token}`} className="block w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground text-center hover:bg-primary/90 transition-colors">
              Fazer login
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
