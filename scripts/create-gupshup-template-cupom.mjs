#!/usr/bin/env node
/**
 * Cria o template kira_cupom na Gupshup e o submete para aprovação da Meta.
 * Header de imagem (o QR code do cupom) + corpo com desconto/procedimento/validade.
 *
 * Categoria UTILITY porque essa conta Gupshup não tem MARKETING habilitado
 * (testado: MARKETING retorna "Template Not Supported On Gupshup Platform"
 * mesmo pra um template TEXT simples, sem nada de errado no conteúdo).
 *
 * Uso:
 *   GUPSHUP_APP_ID=<app-id> node scripts/create-gupshup-template-cupom.mjs
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

const content = "Ola {{1}}! A {{2}} tem um cupom pra voce: {{3}} em {{4}}. Valido ate {{5}}. Mostre o QR code acima na hora do seu atendimento!"

const example = content
  .replace("{{1}}", "[Camila]")
  .replace("{{2}}", "[Studio da Ana]")
  .replace("{{3}}", "[20% de desconto]")
  .replace("{{4}}", "[Limpeza de pele]")
  .replace("{{5}}", "[30/08]")

const params = new URLSearchParams({
  elementName: "kira_cupom",
  languageCode: "pt_BR",
  category: "UTILITY",
  templateType: "IMAGE",
  vertical: "Cupom de desconto pra cliente",
  content,
  example,
  // www: sem o www a URL faz redirect 307 (canônico do Vercel) e o fetcher da
  // Gupshup não segue redirect — a Meta rejeitava o template dizendo que o
  // exemplo de imagem não foi fornecido.
  exampleMedia: "https://www.kiraclinic.com.br/brand/kira-bonsai-512.png",
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
      console.log("- Admin → Config WhatsApp → campo \"Cupom de desconto\"")
      console.log(`- ou env GUPSHUP_TEMPLATE_KIRA_CUPOM_ID=${id}`)
    }
  } catch { /* resposta não-JSON, já logada acima */ }
}
