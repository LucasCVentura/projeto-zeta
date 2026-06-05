"use client"

import { useState, useMemo, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, CalendarDays, User } from "lucide-react"

function formatPhone(p: string): string {
  const d = p.replace(/\D/g, "").replace(/^55/, "")
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`
  return p
}
import { getClientsListAction } from "@/actions/clients"

type Client = {
  id: string
  name: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  createdAt: Date
  totalAppointments: number
  lastAppointment: string | null
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("")

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric", month: "short",
  })
}

export function ClientsList({
  clients: initialClients,
  initialSearch,
  initialLetra,
}: {
  clients: Client[]
  initialSearch?: string
  initialLetra?: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch ?? "")
  const [letra, setLetra] = useState(initialLetra ?? "")
  const [clients, setClients] = useState(initialClients)
  const [isPending, startTransition] = useTransition()

  function handleSearch(value: string) {
    setSearch(value)
    setLetra("")
    startTransition(async () => {
      const result = await getClientsListAction(value || undefined)
      setClients(result as Client[])
    })
  }

  const filtered = useMemo(() => {
    if (!letra) return clients
    return clients.filter((c) => c.name.toUpperCase().startsWith(letra))
  }, [clients, letra])

  // Letras que têm ao menos um cliente
  const activeLetters = useMemo(() => {
    return new Set(clients.map((c) => c.name[0]?.toUpperCase()))
  }, [clients])

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          className="pl-9"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Filtro A-Z */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setLetra("")}
          className={cn(
            "h-7 min-w-[28px] rounded px-1.5 text-xs font-medium transition-colors",
            !letra ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
          )}
        >
          Todos
        </button>
        {LETTERS.map((l) => (
          <button
            key={l}
            onClick={() => setLetra(letra === l ? "" : l)}
            disabled={!activeLetters.has(l)}
            className={cn(
              "h-7 w-7 rounded text-xs font-medium transition-colors",
              letra === l
                ? "bg-primary text-primary-foreground"
                : activeLetters.has(l)
                ? "text-foreground hover:bg-accent"
                : "text-muted-foreground/30 cursor-not-allowed"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="surface flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <User size={20} className="text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium text-sm">Nenhum cliente encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? `Sem resultados para "${search}"` : "Cadastre seu primeiro cliente"}
            </p>
          </div>
          {!search && (
            <Link
              href="/clientes/novo"
              className="text-sm text-primary hover:underline underline-offset-4"
            >
              Cadastrar cliente
            </Link>
          )}
        </div>
      ) : (
        <div className={cn("space-y-2", isPending && "opacity-60 pointer-events-none")}>
          {filtered.map((client) => (
            <Link
              key={client.id}
              href={`/clientes/${client.id}`}
              className="surface flex items-center gap-4 hover:border-primary/30 hover:bg-primary/5 transition-colors no-underline"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(client.name)}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{client.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {client.whatsapp ? formatPhone(client.whatsapp) : client.phone ? formatPhone(client.phone) : client.email ?? "Sem contato"}
                </p>
              </div>

              {/* Stats */}
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarDays size={11} />
                  <span>{client.totalAppointments} atend.</span>
                </div>
                {client.lastAppointment && (
                  <span className="text-xs text-muted-foreground">
                    Último: {formatDate(client.lastAppointment)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
