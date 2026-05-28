import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"

export const runtime = "edge"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const title = searchParams.get("title") ?? "Sistema para Clínica de Estética"
  const sub = searchParams.get("sub") ?? "Organize agenda, prontuários, fotos e financeiro."

  const logoUrl = new URL("/brand/kira-bonsai-mark.png", req.nextUrl.origin).toString()

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #1c0d12 0%, #2a0f1a 60%, #1c0d12 100%)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(192,64,96,0.18) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(192,64,96,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "56px 72px",
            height: "100%",
            position: "relative",
          }}
        >
          {/* Header: logo + brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} width={52} height={52} alt="" style={{ borderRadius: 12, opacity: 0.95 }} />
            <span style={{ color: "#f9f0f3", fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Kira
            </span>
          </div>

          {/* Title block */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
            <div
              style={{
                display: "flex",
                background: "rgba(192,64,96,0.15)",
                border: "1px solid rgba(192,64,96,0.3)",
                borderRadius: 40,
                padding: "8px 20px",
                width: "fit-content",
              }}
            >
              <span style={{ color: "#e8809a", fontSize: 16, fontWeight: 600 }}>kiraclinic.com.br</span>
            </div>
            <span
              style={{
                color: "#f9f0f3",
                fontSize: 56,
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: "-1.5px",
              }}
            >
              {title}
            </span>
            <span style={{ color: "#b07888", fontSize: 24, lineHeight: 1.4, fontWeight: 400 }}>
              {sub}
            </span>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#7a4858", fontSize: 16 }}>Teste grátis por 7 dias · Sem cartão</span>
            <div
              style={{
                display: "flex",
                background: "#c04060",
                borderRadius: 40,
                padding: "12px 28px",
              }}
            >
              <span style={{ color: "#fff", fontSize: 18, fontWeight: 700 }}>Começar grátis →</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
