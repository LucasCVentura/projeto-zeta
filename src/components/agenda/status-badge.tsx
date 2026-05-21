import { cn } from "@/lib/utils"
import type { AppointmentStatus } from "@/db/schema"

const config: Record<AppointmentStatus, { label: string; className: string }> = {
  waiting:   { label: "Aguardando",  className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  confirmed: { label: "Confirmado",  className: "bg-blue-100 text-blue-700 border-blue-200" },
  completed: { label: "Concluído",   className: "bg-green-100 text-green-700 border-green-200" },
  missed:    { label: "Faltou",      className: "bg-red-100 text-red-700 border-red-200" },
  cancelled: { label: "Cancelado",   className: "bg-gray-100 text-gray-500 border-gray-200" },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { label, className } = config[status]
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  )
}
