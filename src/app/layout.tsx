import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { CookieBanner } from "@/components/cookie-banner";
import { PwaAutoUpdate } from "@/components/pwa/auto-update";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Kira",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Sistema de gestão para clínicas de estética, biomédicas estetas e profissionais da beleza organizarem agenda, clientes, prontuários, fotos, financeiro, estoque e pacotes.",
  offers: {
    "@type": "Offer",
    price: "49.90",
    priceCurrency: "BRL",
  },
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.kiraclinic.com.br"),
  title: "Kira — Sistema para Clínica de Estética e Biomédica Esteta",
  description: "Sistema de gestão para clínicas de estética, biomédicas estetas e profissionais da beleza organizarem agenda, clientes, prontuários, fotos, financeiro, estoque e pacotes.",
  keywords: [
    "sistema para clínica de estética",
    "software para clínica de estética",
    "sistema para biomédica esteta",
    "agenda para estética",
    "prontuário estético digital",
    "gestão para estética",
    "controle financeiro clínica estética",
    "sistema para profissionais da beleza",
    "agenda para salão de beleza",
    "sistema para designer de cílios",
  ],
  icons: {
    icon: "/icon.png",
    shortcut: "/favicon.ico",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Kira — Sistema para Clínica de Estética",
    description: "Organize agenda, clientes, prontuários, fotos, financeiro, estoque e pacotes em uma plataforma feita para a rotina da estética e da beleza.",
    type: "website",
    locale: "pt_BR",
    siteName: "Kira",
    images: [
      {
        url: "/og?title=Sistema+para+Cl%C3%ADnica+de+Est%C3%A9tica&sub=Organize+agenda%2C+prontu%C3%A1rios%2C+fotos+e+financeiro.",
        width: 1200,
        height: 630,
        alt: "Kira — Sistema para Clínica de Estética",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kira — Sistema para Clínica de Estética",
    description: "Organize agenda, clientes, prontuários, fotos, financeiro, estoque e pacotes em uma plataforma feita para a rotina da estética e da beleza.",
    images: ["/og?title=Sistema+para+Cl%C3%ADnica+de+Est%C3%A9tica&sub=Organize+agenda%2C+prontu%C3%A1rios%2C+fotos+e+financeiro."],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${jakarta.variable} ${playfair.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#201318" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){var t=localStorage.getItem('theme');var dark=!t||t==='dark';if(dark)document.documentElement.classList.add('dark');})();` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <PwaAutoUpdate />
        {children}
        <CookieBanner />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
