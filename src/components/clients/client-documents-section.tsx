"use client"

import { useState, useRef } from "react"
import { FileText, Trash2, Upload, Download, File, X } from "lucide-react"
import { uploadClientDocumentAction, deleteClientDocumentAction } from "@/actions/documents"
import { mediaUrl } from "@/lib/media-url"
import type { ClientDocument } from "@/db/schema"

type Props = {
  clientId: string
  documents: ClientDocument[]
}

function fileIcon(fileType: string) {
  if (fileType === "application/pdf") return <FileText size={16} className="text-red-500" />
  if (fileType.startsWith("image/")) return <File size={16} className="text-blue-500" />
  return <File size={16} className="text-muted-foreground" />
}

function formatSize(bytes: string) {
  const n = parseInt(bytes, 10)
  if (isNaN(n)) return ""
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function ClientDocumentsSection({ clientId, documents: initialDocs }: Props) {
  const [docs, setDocs] = useState(initialDocs)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setError(null)

    const fd = new FormData()
    fd.append("document", file)
    fd.append("name", name || file.name)

    const result = await uploadClientDocumentAction(clientId, fd)

    if (result.success && result.document) {
      setDocs((prev) => [
        {
          id: result.document!.id,
          organizationId: "",
          clientId,
          name: result.document!.name,
          url: result.document!.url,
          fileType: file.type,
          fileSize: String(file.size),
          createdAt: new Date(),
        },
        ...prev,
      ])
      setName("")
      setFile(null)
      if (inputRef.current) inputRef.current.value = ""
      setShowForm(false)
    } else {
      setError(!result.success ? result.error : "Erro ao enviar arquivo.")
    }
    setUploading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este documento?")) return
    await deleteClientDocumentAction(id, clientId)
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  return (
    <div className="surface space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Documentos</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4"
        >
          <Upload size={13} />
          Anexar
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Arquivo</label>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-accent"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Nome (opcional)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={file?.name ?? "Ex: Termo de consentimento"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null); setFile(null); setName("") }}
              className="flex-1 rounded-lg border border-border py-2 text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {uploading ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </form>
      )}

      {docs.length === 0 && !showForm ? (
        <p className="text-xs text-muted-foreground py-2">Nenhum documento anexado ainda.</p>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
              <div className="shrink-0">{fileIcon(doc.fileType)}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(doc.fileSize)} · {new Date(doc.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={mediaUrl(doc.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                  title="Abrir"
                >
                  <Download size={14} />
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Remover"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
