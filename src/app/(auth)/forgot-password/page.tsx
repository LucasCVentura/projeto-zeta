"use client"

import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPasswordResetAction } from "@/actions/auth-reset"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await requestPasswordResetAction(email)
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="font-heading text-2xl font-bold tracking-tight">Verifique seu e-mail</h2>
          <p className="text-muted-foreground text-sm">
            Se existe uma conta com esse e-mail, você receberá um link para redefinir sua senha em instantes.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Não recebeu?{" "}
          <button
            onClick={() => setSent(false)}
            className="text-primary font-medium hover:underline underline-offset-4"
          >
            Tentar novamente
          </button>
        </p>
        <Link href="/login" className="block text-center text-sm text-primary font-medium hover:underline underline-offset-4">
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="font-heading text-2xl font-bold tracking-tight">Esqueceu sua senha?</h2>
        <p className="text-muted-foreground text-sm">
          Digite seu e-mail e enviaremos um link para você redefinir sua senha.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="voce@exemplo.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Enviando..." : "Enviar link de redefinição"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}
