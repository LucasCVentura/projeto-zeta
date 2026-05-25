"use client"

import { useEffect, useState } from "react"
import { Smartphone, CheckCircle2, X } from "lucide-react"

type InstallState = "loading" | "installable" | "ios" | "installed" | "unsupported"

export function InstallAppButton() {
  const [state, setState] = useState<InstallState>("loading")
  const [deferredPrompt, setDeferredPrompt] = useState<Event & { prompt: () => Promise<void> } | null>(null)
  const [showIosModal, setShowIosModal] = useState(false)

  useEffect(() => {
    // Já está rodando como PWA instalada
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setState("installed")
      return
    }

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as Record<string, unknown>).MSStream
    if (isIOS) {
      setState("ios")
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as Event & { prompt: () => Promise<void> })
      setState("installable")
    }

    window.addEventListener("beforeinstallprompt", handler)
    // Se o evento não disparar em 1s, assume unsupported (desktop Chrome já instalado, Firefox, etc.)
    const t = setTimeout(() => setState((s) => s === "loading" ? "unsupported" : s), 1000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
      clearTimeout(t)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    setState("installed")
    setDeferredPrompt(null)
  }

  if (state === "loading" || state === "unsupported") return null

  if (state === "installed") {
    return (
      <div className="surface flex items-center gap-4 opacity-60">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <CheckCircle2 size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">App instalado</p>
          <p className="text-xs text-muted-foreground">O Kira já está na tela inicial do seu dispositivo</p>
        </div>
      </div>
    )
  }

  if (state === "ios") {
    return (
      <>
        <button
          onClick={() => setShowIosModal(true)}
          className="surface flex items-center gap-4 w-full text-left hover:border-primary/30 hover:bg-primary/5 transition-colors"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Smartphone size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">Instalar como app</p>
            <p className="text-xs text-muted-foreground">Adicione o Kira à tela inicial do iPhone</p>
          </div>
        </button>

        {showIosModal && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowIosModal(false)}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone size={16} className="text-primary" />
                  <span className="font-semibold text-sm">Instalar no iPhone</span>
                </div>
                <button
                  onClick={() => setShowIosModal(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
                >
                  <X size={15} />
                </button>
              </div>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">1</span>
                  Toque no botão <strong className="text-foreground">Compartilhar</strong> <span className="inline-block rotate-0">⬆</span> na barra do Safari
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">2</span>
                  Role para baixo e toque em <strong className="text-foreground">"Adicionar à Tela de Início"</strong>
                </li>
                <li className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">3</span>
                  Toque em <strong className="text-foreground">Adicionar</strong> no canto superior direito
                </li>
              </ol>
            </div>
          </div>
        )}
      </>
    )
  }

  // installable (Android / Chrome desktop)
  return (
    <button
      onClick={handleInstall}
      className="surface flex items-center gap-4 w-full text-left hover:border-primary/30 hover:bg-primary/5 transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Smartphone size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">Instalar como app</p>
        <p className="text-xs text-muted-foreground">Acesse o Kira direto da tela inicial, sem abrir o navegador</p>
      </div>
    </button>
  )
}
