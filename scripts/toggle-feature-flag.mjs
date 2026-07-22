#!/usr/bin/env node
/**
 * Liga/desliga uma feature (launch control genérico — ver src/lib/feature-flags.ts,
 * FEATURE_REGISTRY, e src/db/schema.ts: feature_flags / feature_flag_orgs) pra uma
 * organização, ou pra todas de uma vez (rollout final). O mesmo controle já existe
 * no /admin → Novas Features; esse script é útil pra automação/CI ou acesso via SSH.
 *
 * Uso:
 *   node scripts/toggle-feature-flag.mjs --feature coupons --email dona@clinica.com --on
 *   node scripts/toggle-feature-flag.mjs --feature coupons --email dona@clinica.com --off
 *   node scripts/toggle-feature-flag.mjs --feature coupons --all --on     (rollout final)
 *   node scripts/toggle-feature-flag.mjs --feature coupons --email dona@clinica.com --on --prod
 *
 * Lê DATABASE_URL (local) do .env.local por padrão; com --prod usa PROD_DATABASE_URL.
 * A feature precisa já existir em feature_flags (criada automaticamente na primeira
 * vez que alguém abre /admin → Novas Features, ou insira manualmente se preferir).
 */
import { readFileSync } from "fs"
import { resolve, join } from "path"
import postgres from "postgres"

const ROOT = resolve(process.cwd())
const args = process.argv.slice(2)

const featureFlag = args.indexOf("--feature")
const featureKey = featureFlag >= 0 ? args[featureFlag + 1] : null
const emailFlag = args.indexOf("--email")
const email = emailFlag >= 0 ? args[emailFlag + 1] : null
const all = args.includes("--all")
const turnOn = args.includes("--on")
const turnOff = args.includes("--off")
const useProd = args.includes("--prod")

if (!featureKey) {
  console.error("Especifique --feature <key> (ex: --feature coupons)")
  process.exit(1)
}
if (!email && !all) {
  console.error("Uso: node scripts/toggle-feature-flag.mjs --feature <key> --email <email> --on|--off  (ou --all --on)")
  process.exit(1)
}
if (turnOn === turnOff) {
  console.error("Especifique exatamente uma flag: --on ou --off")
  process.exit(1)
}

function readEnvLocal(varName) {
  try {
    const content = readFileSync(join(ROOT, ".env.local"), "utf-8")
    const match = content.match(new RegExp(`^${varName}\\s*=\\s*["']?([^"'\\n]+)["']?`, "m"))
    return match?.[1]?.trim() ?? null
  } catch {
    return null
  }
}

const dbUrl = process.env[useProd ? "PROD_DATABASE_URL" : "DATABASE_URL"] ?? readEnvLocal(useProd ? "PROD_DATABASE_URL" : "DATABASE_URL")
if (!dbUrl) {
  console.error(`${useProd ? "PROD_DATABASE_URL" : "DATABASE_URL"} não encontrada.`)
  process.exit(1)
}

const sql = postgres(dbUrl, { max: 1, prepare: false })
const enabled = turnOn

const [feature] = await sql`select id, label from feature_flags where key = ${featureKey}`
if (!feature) {
  console.error(`Feature "${featureKey}" não encontrada em feature_flags — abra /admin → Novas Features uma vez pra sincronizar o registro, ou confira o key em src/lib/feature-flags.ts.`)
  await sql.end()
  process.exit(1)
}

if (all) {
  await sql`update feature_flags set enabled_for_all = ${enabled}, updated_at = now() where id = ${feature.id}`
  console.log(`[${useProd ? "PROD" : "local"}] "${feature.label}" ${enabled ? "LIGADA" : "desligada"} pra TODAS as organizações.`)
} else {
  const [user] = await sql`select id, name from users where email = ${email}`
  if (!user) {
    console.error(`Nenhum usuário encontrado com o e-mail ${email}`)
    await sql.end()
    process.exit(1)
  }
  const orgs = await sql`
    select o.id, o.name from organizations o
    join organization_members om on om.organization_id = o.id
    where om.user_id = ${user.id}
  `
  if (orgs.length === 0) {
    console.error(`Usuário ${email} (${user.name}) não pertence a nenhuma organização.`)
    await sql.end()
    process.exit(1)
  }
  for (const org of orgs) {
    if (enabled) {
      await sql`insert into feature_flag_orgs (feature_flag_id, organization_id) values (${feature.id}, ${org.id}) on conflict do nothing`
    } else {
      await sql`delete from feature_flag_orgs where feature_flag_id = ${feature.id} and organization_id = ${org.id}`
    }
    console.log(`[${useProd ? "PROD" : "local"}] "${feature.label}" ${enabled ? "LIGADA" : "desligada"} pra "${org.name}" (${org.id}) — dono: ${user.name} <${email}>`)
  }
}

await sql.end()
