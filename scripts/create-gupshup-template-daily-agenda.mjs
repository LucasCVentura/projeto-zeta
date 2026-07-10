#!/usr/bin/env node
/**
 * Cria o template kira_agenda_do_dia na Gupshup e o submete para aprovação da Meta.
 *
 * Uso:
 *   GUPSHUP_APP_ID=<app-id> node scripts/create-gupshup-template-daily-agenda.mjs
 *
 * O App ID fica no painel da Gupshup: Dashboard → app KiraClinic → Settings → App ID.
 * GUPSHUP_API_KEY é lida do .env.local automaticamente.
 */

import { readFileSync } from "fs"

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf-8")
const apiKey = process.env.GUPSHUP_API_KEY ?? env.match(/GUPSHUP_API_KEY="?([^"\n]+)"?/)?.[1]
const appId = process.env.GUPSHUP_APP_ID ?? env.match(/GUPSHUP_APP_ID="?([^"\n]+)"?/)?.[1]

if (!apiKey) { console.error("GUPSHUP_API_KEY não encontrada"); process.exit(1) }
if (!appId) {
  console.error("Defina GUPSHUP_APP_ID (painel Gupshup → app KiraClinic → Settings → App ID)")
  process.exit(1)
}

const content = [
  "Bom dia, {{1}}! ☀️",
  "",
  "Sua agenda de hoje na {{2}}:",
  "{{3}}",
  "",
  "Total: {{4}} atendimento(s), o primeiro às {{5}}.",
  "",
  "Detalhes completos: https://kiraclinic.com.br/agenda",
].join("\n")

const example = content
  .replace("{{1}}", "[Nathalia]")
  .replace("{{2}}", "[Clínica Fialho]")
  .replace("{{3}}", "[09:00 Ana Paula (Limpeza de pele) · 11:00 Carla (Peeling) · 14:30 Juliana]")
  .replace("{{4}}", "[3]")
  .replace("{{5}}", "[09:00]")

const params = new URLSearchParams({
  elementName: "kira_agenda_do_dia",
  languageCode: "pt_BR",
  category: "UTILITY",
  templateType: "TEXT",
  vertical: "Agenda diária do profissional",
  content,
  example,
  enableSample: "true",
  allowTemplateCategoryChange: "false",
})

const res = await fetch(`https://api.gupshup.io/wa/app/${appId}/template`, {
  method: "POST",
  headers: { apikey: apiKey, "Content-Type": "application/x-www-form-urlencoded" },
  body: params.toString(),
})

const body = await res.text()
console.log("HTTP", res.status)
console.log(body)

if (res.ok) {
  try {
    const data = JSON.parse(body)
    const id = data?.template?.id
    if (id) {
      console.log("\nTemplate criado! Guarde o ID acima e cadastre em:")
      console.log("- Admin → Config WhatsApp → campo \"Agenda do dia (profissional)\"")
      console.log(`- ou env GUPSHUP_TEMPLATE_KIRA_AGENDA_DIA_ID=${id}`)
    }
  } catch { /* resposta não-JSON, já logada acima */ }
}
