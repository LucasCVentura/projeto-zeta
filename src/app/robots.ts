import type { MetadataRoute } from "next"

const baseUrl = "https://kiraclinic.com.br"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/agenda", "/clientes", "/financeiro", "/estoque", "/configuracoes", "/perfil", "/admin"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
