"use server"

import Groq from "groq-sdk"
import OpenAI from "openai"
import { db } from "@/db"
import { appointments, clientPhotos, users } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { todayBRT } from "@/lib/date"

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

async function getUserFirstName(userId: string): Promise<string> {
  const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1)
  return u?.name?.split(" ")[0] ?? "Doutora"
}
// Groq suporta: image/jpeg, image/png, image/gif, image/webp
const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"])

async function photoToBase64(url: string): Promise<{ b64: string; mimeType: string } | null> {
  try {
    let fetchUrl = url
    if (url.startsWith("supabase://")) {
      const { mediaUrl } = await import("@/lib/media-url")
      fetchUrl = mediaUrl(url)
    }

    if (fetchUrl.startsWith("http")) {
      const res = await fetch(fetchUrl)
      if (!res.ok) return null
      const mimeType = (res.headers.get("content-type") ?? "image/jpeg").split(";")[0].trim()
      if (!SUPPORTED_TYPES.has(mimeType)) return null
      const b64 = Buffer.from(await res.arrayBuffer()).toString("base64")
      return { b64, mimeType }
    }

    // fallback local (desenvolvimento)
    const { readFile } = await import("fs/promises")
    const { join } = await import("path")
    const buffer = await readFile(join(process.cwd(), "public", url.split("?")[0]))
    const ext = url.split(".").pop()?.toLowerCase()
    const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg"
    return { b64: buffer.toString("base64"), mimeType }
  } catch {
    return null
  }
}

const DAY_NAMES = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"]

async function getClientHistory(clientId: string, organizationId: string) {
  const history = await db
    .select({
      date: appointments.date,
      startTime: appointments.startTime,
      procedure: appointments.procedure,
      status: appointments.status,
    })
    .from(appointments)
    .where(and(eq(appointments.clientId, clientId), eq(appointments.organizationId, organizationId)))
    .orderBy(desc(appointments.date))
    .limit(20)

  return history.filter((a) => a.status === "completed" || a.status === "confirmed")
}

// Sugestão de recorrência — retorna frequência + contagem + explicação
export async function suggestRecurrenceAction(clientId: string): Promise<{
  success: boolean
  frequency?: "weekly" | "biweekly" | "monthly"
  count?: number
  explanation?: string
  error?: string
}> {
  const { organizationId } = await requireSession()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { success: false, error: "GROQ_API_KEY não configurada." }

  const completed = await getClientHistory(clientId, organizationId)
  if (completed.length < 2) {
    return { success: false, error: "Histórico insuficiente para sugerir recorrência." }
  }

  const historyText = completed
    .map((a) => {
      const d = new Date(a.date + "T12:00:00")
      return `${DAY_NAMES[d.getDay()]}, ${a.date}, ${a.startTime.slice(0, 5)}${a.procedure ? ` (${a.procedure})` : ""}`
    })
    .join("\n")

  const groq = new Groq({ apiKey })

  const chat = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `Você é um assistente de agendamento para clínicas de estética. Analise o histórico e retorne SOMENTE um JSON válido, sem texto extra, com este formato:
{"frequency":"weekly"|"biweekly"|"monthly","count":number,"explanation":"string em português, máx 1 frase"}
- frequency: intervalo observado entre sessões (weekly=~7 dias, biweekly=~14 dias, monthly=~30 dias)
- count: número de sessões a agendar (entre 2 e 8, baseado no padrão do cliente)
- explanation: motivo da sugestão em 1 frase curta`,
      },
      {
        role: "user",
        content: `Histórico de atendimentos:\n${historyText}`,
      },
    ],
    temperature: 0.3,
    max_tokens: 120,
  })

  const raw = chat.choices[0]?.message?.content?.trim()
  if (!raw) return { success: false, error: "Sem resposta da IA." }

  try {
    const parsed = JSON.parse(raw)
    const frequency = ["weekly", "biweekly", "monthly"].includes(parsed.frequency)
      ? parsed.frequency
      : "biweekly"
    const count = Math.min(8, Math.max(2, Number(parsed.count) || 4))
    return { success: true, frequency, count, explanation: parsed.explanation }
  } catch {
    return { success: false, error: "Não foi possível interpretar a sugestão." }
  }
}

// Sugestão de próximo retorno — texto livre para a página do cliente
export async function suggestNextAppointmentAction(clientId: string): Promise<{
  success: boolean
  suggestion?: string
  error?: string
}> {
  const { organizationId } = await requireSession()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { success: false, error: "GROQ_API_KEY não configurada." }

  const completed = await getClientHistory(clientId, organizationId)
  if (completed.length === 0) {
    return { success: false, error: "Sem atendimentos concluídos no histórico." }
  }

  const historyText = completed
    .map((a) => {
      const d = new Date(a.date + "T12:00:00")
      return `- ${DAY_NAMES[d.getDay()]}, ${a.date}, ${a.startTime.slice(0, 5)}${a.procedure ? ` (${a.procedure})` : ""}`
    })
    .join("\n")

  const today = todayBRT()
  const groq = new Groq({ apiKey })

  const chat = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "Você é um assistente de agendamento para clínicas de estética. Analise o histórico e sugira o próximo agendamento ideal. Responda em português, de forma direta e amigável, em no máximo 2 frases. Mencione o dia da semana preferido, faixa de horário e intervalo entre sessões observado.",
      },
      {
        role: "user",
        content: `Hoje é ${today}. Histórico:\n${historyText}\n\nSugira o próximo agendamento ideal.`,
      },
    ],
    temperature: 0.5,
    max_tokens: 150,
  })

  const suggestion = chat.choices[0]?.message?.content?.trim()
  if (!suggestion) return { success: false, error: "Não foi possível gerar sugestão." }

  return { success: true, suggestion }
}

// Análise comparativa de 2-3 fotos selecionadas
export async function analyzePhotoComparisonAction(photoIds: string[]): Promise<{
  success: boolean
  analysis?: string
  error?: string
}> {
  const { organizationId, userId } = await requireSession()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { success: false, error: "GROQ_API_KEY não configurada." }
  if (photoIds.length < 2) return { success: false, error: "Selecione ao menos 2 fotos." }

  const photos = await db
    .select()
    .from(clientPhotos)
    .where(and(eq(clientPhotos.organizationId, organizationId)))

  const selected = photoIds
    .map((id) => photos.find((p) => p.id === id))
    .filter(Boolean) as typeof photos

  if (selected.length < 2) return { success: false, error: "Fotos não encontradas." }

  const imageContents = await Promise.all(
    selected.map(async (photo) => {
      const result = await photoToBase64(photo.url)
      if (!result) return null
      return {
        type: "image_url" as const,
        image_url: { url: `data:${result.mimeType};base64,${result.b64}` },
      }
    })
  )

  const validImages = imageContents.filter(Boolean)
  if (validImages.length < 2) return { success: false, error: "Não foi possível carregar as imagens." }

  const labels = selected.map((p, i) => {
    const d = new Date(p.takenAt + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    return `Foto ${i + 1}: tirada em ${d}${p.procedure ? ` — procedimento: ${p.procedure}` : ""}`
  }).join("\n")

  const daysBetween = selected.length >= 2
    ? Math.round((new Date(selected[selected.length - 1].takenAt + "T12:00:00").getTime() - new Date(selected[0].takenAt + "T12:00:00").getTime()) / 86400000)
    : 0
  const intervalText = daysBetween > 0 ? `\nIntervalo entre as fotos: ${daysBetween} dia${daysBetween !== 1 ? "s" : ""}.` : ""

  const firstName = await getUserFirstName(userId)
  const salutation = `${greeting()}, ${firstName}!`
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Você é um assistente especializado em estética e dermatologia. Compare as fotos abaixo e descreva objetivamente as diferenças observadas na pele da cliente.\n\n${labels}${intervalText}\n\nIMPORTANTE:\n- Se as datas forem diferentes, as fotos foram tiradas em momentos distintos — avalie a evolução real.\n- Seja honesta: se houver melhora visível, descreva. Se a diferença for pequena ou negativa, diga isso também.\n- Nunca diga que as fotos parecem do mesmo dia se as datas forem diferentes.\n- Descreva em tópicos (use • no início de cada linha): textura, tom, manchas, hidratação, firmeza e qualquer mudança visível.\n- Sem formatação markdown como ** ou ##. Máximo 5 tópicos. Sem saudação — vá direto aos tópicos.`,
          },
          ...validImages,
        ],
      },
    ],
    temperature: 0.3,
    max_tokens: 400,
  })

  const body = chat.choices[0]?.message?.content?.trim()
  if (!body) return { success: false, error: "Não foi possível gerar análise." }

  // Garante a saudação com o nome real, sem depender do modelo
  const analysis = `${salutation}\n\nAnalisando as fotos, posso observar que:\n\n${body}`
  return { success: true, analysis }
}

// Resumo de evolução geral do cliente (todas as fotos)
export async function analyzeClientEvolutionAction(clientId: string): Promise<{
  success: boolean
  analysis?: string
  error?: string
}> {
  const { organizationId } = await requireSession()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { success: false, error: "GROQ_API_KEY não configurada." }

  const photos = await db
    .select()
    .from(clientPhotos)
    .where(and(eq(clientPhotos.clientId, clientId), eq(clientPhotos.organizationId, organizationId)))
    .orderBy(clientPhotos.takenAt)

  if (photos.length < 2) return { success: false, error: "São necessárias ao menos 2 fotos para analisar a evolução." }

  // Usa no máximo 6 fotos (primeira, última e distribuídas no meio)
  const sampled = photos.length <= 6
    ? photos
    : [
        photos[0],
        photos[Math.floor(photos.length * 0.2)],
        photos[Math.floor(photos.length * 0.4)],
        photos[Math.floor(photos.length * 0.6)],
        photos[Math.floor(photos.length * 0.8)],
        photos[photos.length - 1],
      ]

  const imageContents = await Promise.all(
    sampled.map(async (photo) => {
      const result = await photoToBase64(photo.url)
      if (!result) return null
      return {
        type: "image_url" as const,
        image_url: { url: `data:${result.mimeType};base64,${result.b64}` },
      }
    })
  )

  const validImages = imageContents.filter(Boolean)
  if (validImages.length < 2) return { success: false, error: "Não foi possível carregar as imagens." }

  const timeline = sampled.map((p, i) => {
    const d = new Date(p.takenAt + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
    return `Foto ${i + 1}: ${d}${p.procedure ? ` (${p.procedure})` : ""}`
  }).join(" | ")

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Você é um especialista em estética. Analise a evolução fotográfica deste cliente ao longo do tempo.\n\nTimeline: ${timeline}\n\nFaça um resumo profissional em português da evolução geral observada: resultados alcançados, áreas de melhora, e sugestões de continuidade do tratamento. Máximo 5 frases.`,
          },
          ...validImages,
        ],
      },
    ],
    temperature: 0.4,
    max_tokens: 400,
  })

  const analysis = chat.choices[0]?.message?.content?.trim()
  if (!analysis) return { success: false, error: "Não foi possível gerar análise." }

  return { success: true, analysis }
}

export async function suggestProceduresFromPhotosAction(photoIds: string[]): Promise<{
  success: boolean
  analysis?: string
  error?: string
}> {
  const { organizationId, userId } = await requireSession()

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { success: false, error: "GROQ_API_KEY não configurada." }
  if (photoIds.length < 1) return { success: false, error: "Selecione ao menos 1 foto." }

  const photos = await db
    .select()
    .from(clientPhotos)
    .where(and(eq(clientPhotos.organizationId, organizationId)))

  const selected = photoIds
    .map((id) => photos.find((p) => p.id === id))
    .filter(Boolean) as typeof photos

  if (selected.length === 0) return { success: false, error: "Fotos não encontradas." }

  const imageContents = await Promise.all(
    selected.map(async (photo) => {
      const result = await photoToBase64(photo.url)
      if (!result) return null
      return {
        type: "image_url" as const,
        image_url: { url: `data:${result.mimeType};base64,${result.b64}` },
      }
    })
  )

  const validImages = imageContents.filter(Boolean)
  if (validImages.length === 0) return { success: false, error: "Não foi possível carregar as imagens." }

  const firstName = await getUserFirstName(userId)
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Você é um assistente especializado em estética e biomedicina estética. Analise as fotos e indique os procedimentos mais adequados para o que é visível nas imagens.\n\nResponda em português, de forma natural e direta, como se estivesse conversando com a profissional. Comece com "${greeting()}, ${firstName}!" e depois liste de 3 a 5 procedimentos em tópicos (use • no início de cada linha), cada um com uma justificativa curta baseada no que você observou na foto. Sem formatação markdown como ** ou ##.`,
          },
          ...validImages,
        ],
      },
    ],
    temperature: 0.4,
    max_tokens: 450,
  })

  const analysis = chat.choices[0]?.message?.content?.trim()
  if (!analysis) return { success: false, error: "Não foi possível gerar indicações." }

  return { success: true, analysis }
}

export async function suggestProceduresWithAnnotationsAction(photoId: string): Promise<{
  success: boolean
  analysis?: string
  imageUrl?: string
  areas?: { label: string; x: number; y: number; procedure: string }[]
  error?: string
}> {
  const { organizationId, userId } = await requireSession()

  const photos = await db.select().from(clientPhotos).where(and(eq(clientPhotos.organizationId, organizationId)))
  const photo = photos.find((p) => p.id === photoId)
  if (!photo) return { success: false, error: "Foto não encontrada." }

  const photoResult = await photoToBase64(photo.url)
  if (!photoResult) return { success: false, error: "Não foi possível carregar a imagem." }

  const firstName = await getUserFirstName(userId)
  const salutation = `${greeting()}, ${firstName}!`
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // Zonas faciais fixas — modelo só escolhe a zona, nós mapeamos para coordenadas.
  // Isso elimina o problema de o modelo errar coordenadas x/y livres.
  const ZONES: Record<string, { x: number; y: number }> = {
    testa:              { x: 50, y: 18 },
    sobrancelha_esq:    { x: 35, y: 30 },
    sobrancelha_dir:    { x: 65, y: 30 },
    olho_esq:           { x: 33, y: 38 },
    olho_dir:           { x: 67, y: 38 },
    olheira_esq:        { x: 33, y: 45 },
    olheira_dir:        { x: 67, y: 45 },
    nariz:              { x: 50, y: 52 },
    bochecha_esq:       { x: 27, y: 55 },
    bochecha_dir:       { x: 73, y: 55 },
    labio_superior:     { x: 50, y: 63 },
    labio_inferior:     { x: 50, y: 68 },
    queixo:             { x: 50, y: 76 },
    pescoco:            { x: 50, y: 88 },
    cabelo:             { x: 50, y: 7  },
    orelha_esq:         { x: 10, y: 45 },
    orelha_dir:         { x: 90, y: 45 },
  }

  const zoneList = Object.keys(ZONES).join(", ")

  const chat = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Você é um especialista em estética e biomedicina. Analise esta foto de pele e responda SOMENTE com um JSON válido, sem texto fora do JSON:

{
  "summary": "frase curta descrevendo o estado geral da pele",
  "areas": [
    { "zone": "nome_da_zona", "label": "nome da condição visível", "procedure": "procedimento indicado" }
  ]
}

Zonas disponíveis (use EXATAMENTE um desses nomes no campo "zone"): ${zoneList}

Identifique de 3 a 5 áreas de atenção visíveis na foto. Sem markdown, sem texto fora do JSON.`,
          },
          {
            type: "image_url",
            image_url: { url: `data:${photoResult.mimeType};base64,${photoResult.b64}` },
          },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: 600,
  })

  const raw = chat.choices[0]?.message?.content?.trim() ?? ""

  let parsed: { summary: string; areas: { zone: string; label: string; procedure: string }[] }
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    parsed = JSON.parse(jsonMatch?.[0] ?? raw)
  } catch {
    return { success: false, error: "A IA não retornou um formato válido. Tente novamente." }
  }

  if (!parsed?.areas?.length) return { success: false, error: "Não foi possível identificar áreas na imagem." }

  // Mapeia zona → coordenadas fixas; ignora zonas desconhecidas
  const areas = parsed.areas
    .filter((a) => ZONES[a.zone])
    .map((a) => ({ label: a.label, procedure: a.procedure, ...ZONES[a.zone] }))

  if (!areas.length) return { success: false, error: "Não foi possível mapear as áreas identificadas." }

  const analysis = [
    `${salutation}\n`,
    parsed.summary,
    "",
    ...areas.map((a) => `• ${a.label}: ${a.procedure}`),
  ].join("\n")

  return {
    success: true,
    analysis,
    imageUrl: photo.url,
    areas,
  }
}

export async function suggestReturnDateAction(data: {
  procedureName: string
  returnIntervalDays: number | null
  lastAppointmentDate: string
}): Promise<{ success: true; suggestedDate: string; explanation: string } | { success: false; error: string }> {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const intervalHint = data.returnIntervalDays
      ? `O protocolo padrão sugere retorno em ${data.returnIntervalDays} dias.`
      : "Não há intervalo padrão definido."

    const chat = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Você é especialista em estética e biomedicina. O paciente realizou "${data.procedureName}" em ${data.lastAppointmentDate}. ${intervalHint}

Responda APENAS em JSON válido com este formato exato:
{"days": <número inteiro>, "explanation": "<frase curta em pt-BR explicando o porquê deste intervalo>"}

O campo "days" deve ser um número entre 1 e 365. Sem markdown, sem texto extra.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 120,
    })

    const raw = chat.choices[0]?.message?.content?.trim() ?? ""
    const json = JSON.parse(raw.replace(/```json?|```/g, "").trim())
    const days = parseInt(json.days)
    if (!days || days < 1) throw new Error("invalid days")

    const base = new Date(data.lastAppointmentDate + "T12:00:00")
    base.setDate(base.getDate() + days)
    const suggestedDate = base.toLocaleDateString("en-CA")

    return { success: true, suggestedDate, explanation: json.explanation ?? "" }
  } catch {
    // Fallback: usa o intervalo padrão ou 30 dias
    const days = data.returnIntervalDays ?? 30
    const base = new Date(data.lastAppointmentDate + "T12:00:00")
    base.setDate(base.getDate() + days)
    return {
      success: true,
      suggestedDate: base.toLocaleDateString("en-CA"),
      explanation: `Intervalo padrão de ${days} dias para ${data.procedureName}.`,
    }
  }
}
