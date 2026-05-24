import type { MetadataRoute } from "next"

const baseUrl = "https://www.kiraclinic.com.br"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/agenda-para-estetica"],
      disallow: [
        "/dashboard",
        "/agenda/",
        "/clientes",
        "/financeiro",
        "/estoque",
        "/configuracoes",
        "/perfil",
        "/admin",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
