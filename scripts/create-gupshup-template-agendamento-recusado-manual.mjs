#!/usr/bin/env node
/**
 * Cria o template kira_agendamento_recusado_manual na Gupshup e o submete para aprovação da Meta.
 * Usado quando a profissional recusa manualmente (pela fila do dashboard ou pela agenda)
 * um agendamento vindo do link público — diferente da recusa automática por prazo (24h),
 * esse texto não menciona "prazo estourado" porque foi uma decisão ativa da profissional.
 *
 * Uso:
 *   GUPSHUP_APP_ID=<app-id> node scripts/create-gupshup-template-agendamento-recusado-manual.mjs
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
  "Olá, {{1}}!",
  "",
  "Infelizmente não será possível atender o agendamento que você solicitou na {{2}} dessa vez. Sentimos muito!",
  "",
  "Você pode tentar agendar um novo horário por aqui: {{3}}",
  "",
  "Esperamos te ver em breve!",
].join("\n")

const example = content
  .replace("{{1}}", "[Ana Paula]")
  .replace("{{2}}", "[Clínica Fialho]")
  .replace("{{3}}", "[https://kiraclinic.com.br/agendar/clinica-fialho]")

const params = new URLSearchParams({
  elementName: "kira_agendamento_recusado_manual",
  languageCode: "pt_BR",
  category: "UTILITY",
  templateType: "TEXT",
  vertical: "Recusa manual de agendamento público pela profissional",
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
      console.log("- Admin → Config WhatsApp → campo \"Agendamento público recusado manualmente\"")
      console.log(`- ou env GUPSHUP_TEMPLATE_KIRA_AGENDAMENTO_RECUSADO_MANUAL_ID=${id}`)
    }
  } catch { /* resposta não-JSON, já logada acima */ }
}
