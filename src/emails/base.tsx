import * as React from "react"

export function EmailBase({
  previewText,
  children,
}: {
  previewText: string
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{previewText}</title>
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: "#faf9f8", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        {/* Preview text invisível */}
        <div style={{ display: "none", maxHeight: 0, overflow: "hidden", color: "#faf9f8" }}>
          {previewText}
        </div>

        <table width="100%" cellPadding={0} cellSpacing={0} style={{ backgroundColor: "#faf9f8", padding: "40px 16px" }}>
          <tr>
            <td align="center">
              <table width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: 520 }}>

                {/* Logo */}
                <tr>
                  <td align="center" style={{ paddingBottom: 28 }}>
                    <table cellPadding={0} cellSpacing={0}>
                      <tr>
                        <td>
                          <div style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                          }}>
                            <img
                              src="https://kiraclinic.com.br/brand/kira-bonsai-mark.png"
                              alt="Kira"
                              width={32}
                              height={32}
                              style={{ display: "block" }}
                            />
                            <span style={{ fontSize: 18, fontWeight: 700, color: "#1a1014", letterSpacing: "-0.3px" }}>
                              Kira
                            </span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                {/* Card */}
                <tr>
                  <td style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 16,
                    border: "1px solid #ede8e6",
                    padding: "36px 40px",
                  }}>
                    {children}
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td align="center" style={{ paddingTop: 24 }}>
                    <p style={{ fontSize: 12, color: "#a0948e", margin: 0, lineHeight: "1.6" }}>
                      Kira — Gestão para profissionais da estética
                      <br />
                      Você está recebendo este e-mail pois tem uma conta no Kira.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  )
}

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1014", margin: "0 0 8px 0", lineHeight: 1.3 }}>
      {children}
    </h1>
  )
}

export function EmailText({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <p style={{ fontSize: 15, color: muted ? "#a0948e" : "#4a3f3a", margin: "0 0 16px 0", lineHeight: 1.6 }}>
      {children}
    </p>
  )
}

export function EmailButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <table cellPadding={0} cellSpacing={0} style={{ margin: "24px 0" }}>
      <tr>
        <td>
          <a
            href={href}
            style={{
              display: "inline-block",
              backgroundColor: "#b06070",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 28px",
              borderRadius: 10,
              textDecoration: "none",
              letterSpacing: "-0.1px",
            }}
          >
            {children}
          </a>
        </td>
      </tr>
    </table>
  )
}

export function EmailDivider() {
  return <hr style={{ border: "none", borderTop: "1px solid #ede8e6", margin: "24px 0" }} />
}
