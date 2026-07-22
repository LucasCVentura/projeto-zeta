"use client"

import { useEffect, useRef, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { X, Loader2 } from "lucide-react"

const SCANNER_ELEMENT_ID = "coupon-qr-scanner"

type Props = {
  open: boolean
  onClose: () => void
  onDecoded: (text: string) => void
}

export function QrScannerModal({ open, onClose, onDecoded }: Props) {
  const [error, setError] = useState<string | null>(null)
  const scannerRef = useRef<import("html5-qrcode").Html5Qrcode | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function start() {
      const { Html5Qrcode } = await import("html5-qrcode")
      if (cancelled) return
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID)
      scannerRef.current = scanner
      try {
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            onDecoded(decodedText)
          },
          () => {} // erros de decode por frame (nenhum QR na imagem) — não é um erro real, ignora
        )
      } catch {
        if (!cancelled) setError("Não foi possível acessar a câmera. Verifique a permissão do navegador.")
      }
    }

    start()

    return () => {
      cancelled = true
      scannerRef.current?.stop().then(() => scannerRef.current?.clear()).catch(() => {})
      scannerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Escanear cupom
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </DialogTitle>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive py-6 text-center">{error}</p>
        ) : (
          <div className="space-y-2">
            <div id={SCANNER_ELEMENT_ID} className="w-full overflow-hidden rounded-xl bg-black" />
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5">
              <Loader2 size={11} className="animate-spin" /> Aponte a câmera pro QR code
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
