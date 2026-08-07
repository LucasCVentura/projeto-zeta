"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react"
import QRCode from "qrcode"

type Slide = {
  label: string
  caption: string
  render: () => React.ReactNode
}

function Bubble({ children, time }: { children: React.ReactNode; time: string }) {
  return (
    <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-primary-foreground shadow-sm">
      <p className="text-[13px] leading-snug">{children}</p>
      <p className="mt-1 text-right text-[10px] opacity-70">{time} ✓✓</p>
    </div>
  )
}

// QR code de verdade (gerado no navegador com o mesmo pacote usado pra gerar
// a imagem real do cupom em src/app/api/coupons/recipient/[id]/image) — só
// que aqui codifica um link de exemplo, não um token de cupom de verdade.
function RealQrCode({ size = 64 }: { size?: number }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    QRCode.toDataURL("https://kiraclinic.com.br", { margin: 0, width: size * 3 }).then((url) => {
      if (!cancelled) setSrc(url)
    })
    return () => { cancelled = true }
  }, [size])

  return (
    <div className="flex items-center justify-center rounded-md bg-white p-1" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" width={size - 8} height={size - 8} />
      ) : (
        <div className="h-full w-full animate-pulse rounded bg-neutral-200" />
      )}
    </div>
  )
}

// Mesmo layout da imagem real enviada no WhatsApp (ver
// src/app/api/coupons/recipient/[recipientId]/image/route.tsx), só que numa
// versão compacta pra caber na bolha do mockup.
function CouponCard({
  kind, headline, sub, org, procedure, expires,
}: {
  kind: "discount" | "gift"
  headline: string
  sub: string
  org: string
  procedure: string
  expires: string
}) {
  const isGift = kind === "gift"
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl p-3.5"
      style={{
        background: isGift
          ? "linear-gradient(160deg, #F2BCD4 0%, #D984AD 55%, #8A3B60 100%)"
          : "linear-gradient(160deg, #12080E 0%, #2A1520 100%)",
      }}
    >
      <div className="min-w-0 flex-1" style={{ color: isGift ? "#3A1526" : "#FFF6EC" }}>
        <p className="truncate text-[10px] font-semibold opacity-80">{org}</p>
        <p className="text-[9px] font-bold tracking-wide" style={{ color: isGift ? "#7A2E4E" : "#D984AD" }}>
          {isGift ? "VALE-PRESENTE" : "CUPOM DE DESCONTO"}
        </p>
        <p className="mt-1 text-lg font-extrabold leading-none">{headline}</p>
        <p className="mt-1 truncate text-[11px] font-semibold">{procedure}</p>
        <p className="mt-0.5 text-[9px] opacity-75">{sub} · {expires}</p>
      </div>
      <RealQrCode size={56} />
    </div>
  )
}

const SLIDES: Slide[] = [
  {
    label: "Confirmação",
    caption: "Assim que agenda, a cliente já recebe a confirmação — sem você escrever nada.",
    render: () => (
      <Bubble time="09:12">
        Olá, Maria! Seu horário na Studio Beleza está confirmado: quinta-feira, 14/08 às 14h00, para Limpeza de Pele. 📍 Rua das Flores, 123.
      </Bubble>
    ),
  },
  {
    label: "Lembrete",
    caption: "Dois dias antes, ela recebe um lembrete com botão — clicando em Confirmar, já atualiza sozinho na sua agenda.",
    render: () => (
      <div className="ml-auto max-w-[85%] overflow-hidden rounded-2xl rounded-tr-sm bg-primary text-primary-foreground shadow-sm">
        <div className="px-3.5 py-2.5">
          <p className="text-[13px] leading-snug">
            Oi, Maria! Passando pra lembrar do seu horário amanhã às 14h00 na Studio Beleza. Confirma pra gente?
          </p>
          <p className="mt-1 text-right text-[10px] opacity-70">18:00</p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-primary-foreground/15 border-t border-primary-foreground/15">
          <div className="px-2 py-2 text-center text-[12px] font-medium">✅ Confirmar</div>
          <div className="px-2 py-2 text-center text-[12px] font-medium opacity-80">❌ Cancelar</div>
        </div>
      </div>
    ),
  },
  {
    label: "Cupom",
    caption: "Cupom de desconto: chega com o QR code de verdade — a cliente só mostra na hora do atendimento.",
    render: () => (
      <div className="ml-auto max-w-[85%] overflow-hidden rounded-2xl rounded-tr-sm bg-primary text-primary-foreground shadow-sm">
        <div className="p-2">
          <CouponCard
            kind="discount"
            headline="20% OFF"
            org="Studio Beleza"
            procedure="Limpeza de Pele"
            sub="Pra você, Maria"
            expires="Válido até 20/08"
          />
        </div>
        <div className="px-3.5 pb-2.5">
          <p className="text-[13px] leading-snug">
            Oi, Maria! Você ganhou 20% de desconto em Limpeza de Pele 🎁 É só apresentar esse QR code no dia.
          </p>
          <p className="mt-1 text-right text-[10px] opacity-70">14:03</p>
        </div>
      </div>
    ),
  },
  {
    label: "Vale-presente",
    caption: "Vale-presente segue a mesma ideia, com a cara de presente mesmo — pra cliente comprar pra outra pessoa.",
    render: () => (
      <div className="ml-auto max-w-[85%] overflow-hidden rounded-2xl rounded-tr-sm bg-primary text-primary-foreground shadow-sm">
        <div className="p-2">
          <CouponCard
            kind="gift"
            headline="Um presente"
            org="Studio Beleza"
            procedure="Design de Sobrancelhas"
            sub="Pra você, Ana"
            expires="Válido até 30/09"
          />
        </div>
        <div className="px-3.5 pb-2.5">
          <p className="text-[13px] leading-snug">
            Oi, Ana! Você recebeu um vale-presente de Design de Sobrancelhas 💝 É só apresentar esse QR code no dia.
          </p>
          <p className="mt-1 text-right text-[10px] opacity-70">11:27</p>
        </div>
      </div>
    ),
  },
  {
    label: "Agradecimento",
    caption: "Depois do atendimento, ela recebe um agradecimento com o pedido de avaliação já pronto.",
    render: () => (
      <Bubble time="Sex 16:40">
        Foi um prazer te atender hoje, Maria! 💜 Se puder, deixa sua avaliação: kirac.li/avaliar
      </Bubble>
    ),
  },
]

export function WhatsAppMessageCarousel() {
  const [index, setIndex] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const go = useCallback((i: number) => {
    setIndex((i + SLIDES.length) % SLIDES.length)
  }, [])

  useEffect(() => {
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  function pauseAutoplay() {
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const slide = SLIDES[index]

  return (
    <div className="mx-auto mt-10 max-w-sm" onMouseEnter={pauseAutoplay} onTouchStart={pauseAutoplay}>
      <div className="overflow-hidden rounded-[2rem] border-8 border-neutral-900 bg-neutral-900 shadow-2xl shadow-primary/10">
        <div className="flex items-center gap-3 bg-card px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            SB
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Studio Beleza</p>
            <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageCircle size={10} /> WhatsApp
            </p>
          </div>
        </div>

        <div className="flex min-h-55 items-end bg-muted px-3 py-4">
          {slide.render()}
        </div>
      </div>

      {/* Legenda + navegação */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          onClick={() => go(index - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          aria-label="Anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex gap-1.5">
          {SLIDES.map((s, i) => (
            <button
              key={s.label}
              onClick={() => go(i)}
              aria-label={s.label}
              className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-primary" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>

        <button
          onClick={() => go(index + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          aria-label="Próximo"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <p className="mx-auto mt-3 max-w-xs text-center text-sm text-muted-foreground">{slide.caption}</p>
    </div>
  )
}
