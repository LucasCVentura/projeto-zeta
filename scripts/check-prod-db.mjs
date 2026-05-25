#!/usr/bin/env node
/**
 * Verifica se todas as tabelas do schema.ts existem no banco de produção.
 * Lê PROD_DATABASE_URL do .env.local. Se a variável não existir, pula silenciosamente.
 */

import { readFileSync, readdirSync } from "fs"
import { resolve, join } from "path"
import postgres from "postgres"

const ROOT = resolve(process.cwd())

// ── Lê .env.local para pegar PROD_DATABASE_URL ────────────────────────────────

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

// ── Consulta tabelas existentes no banco de produção ─────────────────────────

let sql
try {
  sql = postgres(prodUrl, { connect_timeout: 8, max: 1 })
  const rows = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `
  const prodTables = new Set(rows.map((r) => r.table_name))

  const missing = [...schemaTables].filter((t) => !prodTables.has(t))

  if (missing.length === 0) {
    console.log("✓ Todas as tabelas do schema estão criadas em produção.")
    process.exit(0)
  } else {
    console.error("✗ Tabelas do schema.ts ausentes no banco de produção:")
    for (const t of missing) console.error(`  - ${t}`)
    console.error("\nRode o SQL de migration no Supabase antes de commitar.")
    process.exit(1)
  }
} catch (err) {
  console.warn(`⚠ Não foi possível conectar ao banco de produção (${err.message}) — pulando verificação.`)
  process.exit(0)
} finally {
  await sql?.end()
}
