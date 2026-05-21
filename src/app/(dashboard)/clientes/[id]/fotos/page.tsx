import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getClientAction } from "@/actions/clients"
import { getClientPhotosAction } from "@/actions/photos"
import { PhotoTimeline } from "@/components/photos/photo-timeline"

type Props = { params: Promise<{ id: string }> }

export default async function ClienteFotosPage({ params }: Props) {
  const { id } = await params
  const [data, photos] = await Promise.all([
    getClientAction(id),
    getClientPhotosAction(id),
  ])

  if (!data) notFound()

  return (
    <div className="container-page max-w-2xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/clientes/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={14} /> {data.client.name}
        </Link>
      </div>

      <div>
        <h2 className="font-heading text-xl font-semibold">Evolução fotográfica</h2>
        <p className="text-sm text-muted-foreground mt-1">Timeline de fotos e comparações antes/depois.</p>
      </div>

      <PhotoTimeline clientId={id} initialPhotos={photos} />
    </div>
  )
}
