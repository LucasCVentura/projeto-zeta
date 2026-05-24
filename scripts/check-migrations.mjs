#!/usr/bin/env node
/**
 * Validates that every table defined in schema.ts has a corresponding
 * CREATE TABLE statement in at least one migration file.
 *
 * Run: node scripts/check-migrations.mjs
 */

import { readFileSync, readdirSync } from "fs"
import { resolve, join } from "path"

const ROOT = resolve(process.cwd())
const SCHEMA_PATH = join(ROOT, "src/db/schema.ts")
const MIGRATIONS_DIR = join(ROOT, "drizzle")

// ── 1. Extract table names from schema.ts ────────────────────────────────────

const schema = readFileSync(SCHEMA_PATH, "utf-8")
const tableRegex = /pgTable\(\s*["']([^"']+)["']/g
const schemaTables = new Set()
let m
while ((m = tableRegex.exec(schema)) !== null) {
  schemaTables.add(m[1])
}

// ── 2. Extract table names from all .sql migration files ─────────────────────

const sqlFiles = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()

const migratedTables = new Set()
for (const file of sqlFiles) {
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8")
  // Matches: CREATE TABLE [IF NOT EXISTS] ["public".]"table_name"
  const createRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"public"\.)?\s*"?(\w+)"?/gi
  let r
  while ((r = createRegex.exec(sql)) !== null) {
    migratedTables.add(r[1])
  }
}

// ── 3. Compare ────────────────────────────────────────────────────────────────

const missing = [...schemaTables].filter((t) => !migratedTables.has(t))

if (missing.length === 0) {
  console.log("✓ Todas as tabelas do schema.ts têm migration correspondente.")
  process.exit(0)
} else {
  console.error("✗ Tabelas no schema.ts sem CREATE TABLE em nenhuma migration:")
  for (const t of missing) console.error(`  - ${t}`)
  console.error("\nCrie uma migration com IF NOT EXISTS para cada tabela acima.")
  process.exit(1)
}
