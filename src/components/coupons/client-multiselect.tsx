"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Check, Search } from "lucide-react"
import { cn } from "@/lib/utils"

type ClientOption = { id: string; name: string }

type Props = {
  clients: ClientOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  singleSelect?: boolean
}

export function ClientMultiselect({ clients, selectedIds, onChange, singleSelect }: Props) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter((c) => c.name.toLowerCase().includes(q))
  }, [clients, search])

  function toggle(id: string) {
    if (singleSelect) {
      onChange(selectedIds.includes(id) ? [] : [id])
      return
    }
    onChange(selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id])
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-xl border border-border divide-y divide-border">
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhuma cliente encontrada.</p>
        )}
        {filtered.map((client) => {
          const active = selectedIds.includes(client.id)
          return (
            <button
              key={client.id}
              type="button"
              onClick={() => toggle(client.id)}
              className={cn(
                "flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors",
                active ? "bg-primary/5 text-primary" : "hover:bg-accent"
              )}
            >
              <span className="truncate">{client.name}</span>
              {active && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check size={12} />
                </span>
              )}
            </button>
          )
        })}
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {selectedIds.length} cliente{selectedIds.length !== 1 ? "s" : ""} selecionada{selectedIds.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
