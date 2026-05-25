import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kira — Gestão de Clínica",
    short_name: "Kira",
    description: "Sistema de gestão para clínicas de estética e biomédicas estetas",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdfcfc",
    theme_color: "#b8526e",
    icons: [
      {
        src: "/brand/kira-bonsai-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/brand/kira-bonsai-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
