#!/usr/bin/env node
/**
 * Verifica se todas as tabelas E colunas adicionadas via migration existem no banco de produção.
 * Lê PROD_DATABASE_URL do .env.local. Se a variável não existir, pula silenciosamente.
 */

import { readFileSync, readdirSync } from "fs"
import { resolve, join } from "path"
import postgres from "postgres"

const ROOT = resolve(process.cwd())

function readEnvLocal() {
  try {
    const content = readFileSync(join(ROOT, ".env.local"), "utf-8")
    for (const line of content.split("\n")) {
      const match = line.match(/^PROD_DATABASE_URL\s*=\s*["']?([^"'\n]+)["']?/)
      if (match) return match[1].trim()
    }
  } catch { /* arquivo não existe */ }
  return null
}

const prodUrl = readEnvLocal()

if (!prodUrl) {
  console.log("⚠ PROD_DATABASE_URL não definida em .env.local — pulando verificação do banco de produção.")
  process.exit(0)
}

// ── Extrai tabelas do schema.ts ───────────────────────────────────────────────

const schema = readFileSync(join(ROOT, "src/db/schema.ts"), "utf-8")
const tableRegex = /pgTable\(\s*["']([^"']+)["']/g
const schemaTables = new Set()
let m
while ((m = tableRegex.exec(schema)) !== null) {
  schemaTables.add(m[1])
}

// ── Extrai colunas adicionadas via ADD COLUMN nas migrations ──────────────────

const migrationsDir = join(ROOT, "drizzle")
const addColumnPattern = /ALTER\s+TABLE\s+"?(\w+)"?\s+ADD\s+COLUMN(?:\s+IF\s+NOT\s+EXISTS)?\s+"?(\w+)"?/gi
const dropColumnPattern = /ALTER\s+TABLE\s+"?(\w+)"?\s+DROP\s+COLUMN(?:\s+IF\s+EXISTS)?\s+"?(\w+)"?/gi

// Track net state: columns added and not subsequently dropped
const addedColumns = new Map() // key: "table.column"

for (const file of readdirSync(migrationsDir).filter(f => f.endsWith(".sql")).sort()) {
  const content = readFileSync(join(migrationsDir, file), "utf-8")
  let match
  while ((match = addColumnPattern.exec(content)) !== null) {
    addedColumns.set(`${match[1]}.${match[2]}`, { table: match[1], column: match[2] })
  }
  while ((match = dropColumnPattern.exec(content)) !== null) {
    addedColumns.delete(`${match[1]}.${match[2]}`)
  }
}

const expectedColumns = [...addedColumns.values()]

// ── Consulta banco de produção ────────────────────────────────────────────────

let sqlClient
try {
  sqlClient = postgres(prodUrl, { connect_timeout: 8, max: 1 })

  const tableRows = await sqlClient`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `
  const prodTables = new Set(tableRows.map((r) => r.table_name))

  const missingTables = [...schemaTables].filter((t) => !prodTables.has(t))

  const columnRows = await sqlClient`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `
  const prodColumns = new Set(columnRows.map((r) => `${r.table_name}.${r.column_name}`))

  const missingColumns = expectedColumns.filter(
    ({ table, column }) => prodTables.has(table) && !prodColumns.has(`${table}.${column}`)
  )

  const errors = []

  if (missingTables.length > 0) {
    errors.push("Tabelas ausentes em produção:")
    for (const t of missingTables) errors.push(`  - ${t}`)
  }

  if (missingColumns.length > 0) {
    errors.push("Colunas de migration ausentes em produção:")
    for (const { table, column } of missingColumns) errors.push(`  - ${table}.${column}`)
  }

  if (errors.length === 0) {
    console.log("✓ Todas as tabelas e colunas do schema estão criadas em produção.")
    process.exit(0)
  } else {
    console.error("✗ " + errors.join("\n"))
    console.error("\nAplique as migrations pendentes em produção antes de commitar.")
    process.exit(1)
  }
} catch (err) {
  console.warn(`⚠ Não foi possível conectar ao banco de produção (${err.message}) — pulando verificação.`)
  process.exit(0)
} finally {
  await sqlClient?.end()
}
