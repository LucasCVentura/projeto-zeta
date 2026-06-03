"use server"

import { db } from "@/db"
import { clients } from "@/db/schema"
import { eq, and, or } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { can } from "@/lib/permissions"
import { revalidateTag, revalidatePath } from "next/cache"

export type ClientRow = {
  name: string
  whatsapp?: string
  email?: string
  cpf?: string
  birthDate?: string  // YYYY-MM-DD
  notes?: string
}

export type ImportResult = {
  success: boolean
  imported: number
  skipped: number   // duplicatas detectadas
  errors: number
  errorDetails: string[]
}

function normalizePhone(p: string | undefined) {
  if (!p) return null
  return p.replace(/\D/g, "") || null
}

function normalizeName(n: string) {
  return n.trim().toLowerCase()
}

export async function importClientsAction(rows: ClientRow[]): Promise<ImportResult> {
  const { organizationId, role } = await requireSession()

  if (!can(role, "clients:create")) {
    return { success: false, imported: 0, skipped: 0, errors: 1, errorDetails: ["Sem permissão."] }
  }

  if (rows.length === 0) {
    return { success: true, imported: 0, skipped: 0, errors: 0, errorDetails: [] }
  }

  // Busca clientes existentes da org (nome + telefone) para detecção de duplicata
  const existing = await db
    .select({ name: clients.name, whatsapp: clients.whatsapp, phone: clients.phone })
    .from(clients)
    .where(eq(clients.organizationId, organizationId))

  const existingSet = new Set(existing.map((c) => normalizeName(c.name)))
  const existingPhones = new Set(
    existing
      .flatMap((c) => [normalizePhone(c.whatsapp ?? undefined), normalizePhone(c.phone ?? undefined)])
      .filter(Boolean)
  )

  let imported = 0
  let skipped = 0
  let errors = 0
  const errorDetails: string[] = []

  // Processa em batches de 200 para não estourar limites de query
  const BATCH = 200
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const toInsert: typeof clients.$inferInsert[] = []

    for (const row of batch) {
      if (!row.name?.trim()) { errors++; errorDetails.push(`Linha sem nome`); continue }

      const phone = normalizePhone(row.whatsapp)
      const nameKey = normalizeName(row.name)

      // Duplicata: mesmo nome OU mesmo telefone
      if (existingSet.has(nameKey) || (phone && existingPhones.has(phone))) {
        skipped++
        continue
      }

      // Valida data de nascimento
      let birthDate: string | null = null
      if (row.birthDate) {
        const d = new Date(row.birthDate)
        birthDate = isNaN(d.getTime()) ? null : row.birthDate
      }

      toInsert.push({
        organizationId,
        name: row.name.trim(),
        whatsapp: phone,
        phone: phone,
        email: row.email?.trim() || null,
        cpf: row.cpf?.replace(/\D/g, "") || null,
        birthDate: birthDate,
        notes: row.notes?.trim() || null,
      })

      // Adiciona ao set para evitar duplicatas dentro do mesmo arquivo
      existingSet.add(nameKey)
      if (phone) existingPhones.add(phone)
    }

    if (toInsert.length > 0) {
      try {
        await db.insert(clients).values(toInsert)
        imported += toInsert.length
      } catch (err) {
        errors += toInsert.length
        errorDetails.push(`Erro ao inserir lote: ${err instanceof Error ? err.message : "desconhecido"}`)
      }
    }
  }

  revalidateTag(`clients-${organizationId}`)
  revalidatePath("/clientes")

  return { success: true, imported, skipped, errors, errorDetails }
}
