"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { deleteClientAction } from "@/actions/clients"

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleConfirm() {
    setLoading(true)
    const result = await deleteClientAction(clientId)
    setLoading(false)
    if (result.success) {
      router.push("/clientes")
    }
  }

  return (
    <>
      <ConfirmDialog
        open={open}
        title="Excluir cliente"
        description={`Tem certeza que deseja excluir ${clientName}? Todos os dados serão removidos permanentemente: histórico de atendimentos, fotos, anamnese e documentos.`}
        confirmLabel="Excluir"
        loading={loading}
        onCancel={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
      <button
        onClick={() => setOpen(true)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
      >
        <Trash2 size={13} />
      </button>
    </>
  )
}
