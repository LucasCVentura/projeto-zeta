"use client"

import { useState } from "react"
import { submitFeedbackAction } from "@/actions/feedback"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquarePlus, CheckCircle2, Loader2 } from "lucide-react"

export function HelpPage() {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim() || loading) return
    setLoading(true)
    await submitFeedbackAction(content.trim())
    setContent("")
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-10 space-y-10">
      {/* Contato */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-primary" />
          <h2 className="font-semibold text-sm">Fale conosco</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Tem alguma dúvida, problema ou precisa de ajuda? Entre em contato diretamente pelo e-mail abaixo — respondemos em até 24 horas úteis.
        </p>
        <a
          href="mailto:suporte@kiraclinic.com.br"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Mail size={14} />
          suporte@kiraclinic.com.br
        </a>
      </div>

      {/* Sugestões */}
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquarePlus size={16} className="text-primary" />
          <h2 className="font-semibold text-sm">Sugestões e melhorias</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Tem uma ideia que tornaria o Kira melhor para você? Conta pra gente — toda sugestão é lida e considerada pela equipe.
        </p>

        {sent ? (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 size={16} />
            Obrigado! Sua sugestão foi enviada com sucesso.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ex: Seria ótimo ter um relatório mensal automático por e-mail..."
              className="min-h-[120px] text-sm resize-none"
              disabled={loading}
            />
            <Button type="submit" size="sm" disabled={loading || !content.trim()}>
              {loading ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
              Enviar sugestão
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
