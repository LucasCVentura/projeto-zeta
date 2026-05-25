"use client"

import { useEffect, useRef, useState } from "react"
import { Smartphone, CheckCircle2, X } from "lucide-react"

type DeferredPrompt = Event & { prompt: () => Promise<void> }

export function InstallAppButton() {
  const [mounted, setMounted] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const promptRef = useRef<DeferredPrompt | null>(null)

  useEffect(() => {
    setMounted(true)
    setIsInstalled(window.matchMedia("(display-mode: standalone)").matches)

    const handler = (e: Event) => {
      e.preventDefault()
      promptRef.current = e as DeferredPrompt
    }
    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  // Evita hydration mismatch — não renderiza nada no servidor
  if (!mounted) return null

  if (isInstalled) {
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

  async function handleClick() {
    if (promptRef.current) {
      // Android / Chrome desktop com prompt disponível
      await promptRef.current.prompt()
      setIsInstalled(true)
      promptRef.current = null
    } else {
      // iOS ou browser sem prompt automático → mostra instruções
      setShowModal(true)
    }
  }

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  return (
    <>
      <button
        onClick={handleClick}
        className="surface flex items-center gap-4 w-full text-left hover:border-primary/30 hover:bg-primary/5 transition-colors"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Smartphone size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Instalar como app</p>
          <p className="text-xs text-muted-foreground">
            {isIOS
              ? "Adicione o Kira à tela inicial do iPhone"
              : "Acesse o Kira direto da tela inicial, sem abrir o navegador"}
          </p>
        </div>
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-primary" />
                <span className="font-semibold text-sm">
                  {isIOS ? "Instalar no iPhone" : "Instalar como app"}
                </span>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">1</span>
                  Toque no botão <strong className="text-foreground">Compartilhar ⬆</strong> na barra do Safari
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">2</span>
                  Role para baixo e toque em <strong className="text-foreground">"Adicionar à Tela de Início"</strong>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">3</span>
                  Toque em <strong className="text-foreground">Adicionar</strong> no canto superior direito
                </li>
              </ol>
            ) : (
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">1</span>
                  No Chrome, toque no menu <strong className="text-foreground">⋮</strong> no canto superior direito
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">2</span>
                  Toque em <strong className="text-foreground">"Adicionar à tela inicial"</strong> ou <strong className="text-foreground">"Instalar app"</strong>
                </li>
                <li className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">3</span>
                  Confirme tocando em <strong className="text-foreground">Instalar</strong>
                </li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  )
}
