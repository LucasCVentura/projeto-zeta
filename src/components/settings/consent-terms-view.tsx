"use client"

import { useState } from "react"
import Link from "next/link"
import type { ConsentTerm } from "@/db/schema"
import {
  createConsentTermAction,
  updateConsentTermAction,
  deleteConsentTermAction,
} from "@/actions/consent-terms"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { ArrowLeft, Plus, Trash2, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function ConsentTermsView({ terms: initial }: { terms: ConsentTerm[] }) {
  const [terms, setTerms] = useState(initial)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<ConsentTerm | null>(null)
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<ConsentTerm | null>(null)

  function openNew() {
    setEditing(null)
    setTitle("")
    setBody("")
    setOpen(true)
  }

  function openEdit(term: ConsentTerm) {
    setEditing(term)
    setTitle(term.title)
    setBody(term.body)
    setOpen(true)
  }

  async function handleSave() {
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    if (editing) {
      await updateConsentTermAction(editing.id, { title: title.trim(), body: body.trim() })
      setTerms(prev => prev.map(t => t.id === editing.id ? { ...t, title: title.trim(), body: body.trim() } : t))
    } else {
      await createConsentTermAction({ title: title.trim(), body: body.trim() })
      window.location.reload()
    }
    setSaving(false)
    setOpen(false)
  }

  async function handleDelete() {
    if (!confirmDelete) return
    setDeleting(confirmDelete.id)
    setConfirmDelete(null)
    await deleteConsentTermAction(confirmDelete.id)
    setTerms(prev => prev.filter(t => t.id !== confirmDelete.id))
    setDeleting(null)
  }

  async function toggleActive(term: ConsentTerm) {
    setToggling(term.id)
    await updateConsentTermAction(term.id, { active: !term.active })
    setTerms(prev => prev.map(t => t.id === term.id ? { ...t, active: !t.active } : t))
    setToggling(null)
  }

  return (
    <div className="container-page max-w-2xl py-8 space-y-6">
      <Link href="/configuracoes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft size={14} /> Configurações
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">Termos de consentimento</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Termos ativos são enviados junto com a ficha de anamnese para o cliente responder.
          </p>
        </div>
        <Button onClick={openNew} className="gap-2 shrink-0">
          <Plus size={15} /> Novo termo
        </Button>
      </div>

      <div className="space-y-2">
        {terms.length === 0 && (
          <div className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Nenhum termo criado. Clique em <strong>Novo termo</strong> para começar.
          </div>
        )}
        {terms.map(term => (
          <div
            key={term.id}
            className="rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="flex items-center gap-3">
              {/* Toggle de ativo */}
              <button
                onClick={() => toggleActive(term)}
                disabled={toggling === term.id}
                title={term.active ? "Desativar — não será enviado na ficha" : "Ativar — será enviado na ficha"}
                className={cn(
                  "relative h-5 w-9 shrink-0 rounded-full outline-none transition-colors duration-200 disabled:opacity-50",
                  term.active ? "bg-primary" : "bg-muted"
                )}
              >
                <span
                  className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200"
                  style={{ left: term.active ? "18px" : "2px" }}
                />
              </button>

              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium truncate", !term.active && "text-muted-foreground")}>{term.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{term.body}</p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(term)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={() => setConfirmDelete(term)}
                  disabled={deleting === term.id}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir termo"
        description={`"${confirmDelete?.title}" será excluído permanentemente, incluindo todas as respostas já registradas dos clientes. Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting === confirmDelete?.id}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar termo" : "Novo termo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input
                placeholder="Ex: Autorização de uso de imagem"
                value={title}
                onChange={e => setTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Texto do termo</Label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Descreva o conteúdo do termo que o cliente precisará aceitar ou recusar..."
                rows={5}
                className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary/40 resize-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!title.trim() || !body.trim() || saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
