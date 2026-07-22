#!/usr/bin/env node
/**
 * Verifica se a versão atual do package.json tem uma entrada em changelog_entries
 * no banco. O changelog migrou do array estático em src/lib/changelog.ts (removido)
 * para a tabela changelog_entries, gerenciada em /admin → Changelog.
 * Lê DATABASE_URL do .env.local; se não conseguir conectar, pula silenciosamente
 * (mesmo padrão de scripts/check-prod-db.mjs).
 */

import { readFileSync } from "fs"
import { resolve, dirname, join } from "path"
import { fileURLToPath } from "url"
import postgres from "postgres"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")

function readEnvLocal(key) {
  try {
    const content = readFileSync(join(root, ".env.local"), "utf-8")
    for (const line of content.split("\n")) {
      const match = line.match(new RegExp(`^${key}\\s*=\\s*["']?([^"'\\n]+)["']?`))
      if (match) return match[1].trim()
    }
  } catch { /* arquivo não existe */ }
  return null
}

const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"))
const version = pkg.version

const dbUrl = process.env.DATABASE_URL || readEnvLocal("DATABASE_URL")

if (!dbUrl) {
  console.log("⚠ DATABASE_URL não definida — pulando verificação do changelog.")
  process.exit(0)
}

let sqlClient
try {
  sqlClient = postgres(dbUrl, { connect_timeout: 8, max: 1 })

  const rows = await sqlClient`
    SELECT version FROM changelog_entries WHERE version = ${version} LIMIT 1
  `

  if (rows.length === 0) {
    console.error(`\n❌  Versão ${version} não tem entrada no changelog!`)
    console.error(`   Adicione uma entrada em /admin → Changelog antes de commitar.\n`)
    process.exit(1)
  }

  console.log(`✓ Changelog contém entrada para v${version}`)
  process.exit(0)
} catch (err) {
  console.warn(`⚠ Não foi possível conectar ao banco (${err.message}) — pulando verificação do changelog.`)
  process.exit(0)
} finally {
  await sqlClient?.end()
}
