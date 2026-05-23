"use server"

import Groq from "groq-sdk"
import { db } from "@/db"
import { appointments, clientPhotos } from "@/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { requireSession } from "@/lib/session"
import { todayBRT } from "@/lib/date"
async function photoToBase64(url: string): Promise<string | null> {
  try {
    if (url.startsWith("gcs://")) {
      // Lê direto do GCS sem passar pela signed URL
      const { downloadFromGCS, gcsUrlToObjectName } = await import("@/lib/gcs")
      const buffer = await downloadFromGCS(gcsUrlToObjectName(url))
      return buffer?.toString("base64") ?? null
    }
    if (url.startsWith("http")) {
      const res = await fetch(url)
      if (!res.ok) return null
      return Buffer.from(await res.arrayBuffer()).toString("base64")
    }
    // fallback local (desenvolvimento)
    const { readFile } = await import("fs/promises")
    const { join } = await import("path")
    const buffer = await readFile(join(process.cwd(), "public", url.split("?")[0]))
    return buffer.toString("base64")
  } catch {
    return null
  }
}

function imageMediaType(url: string): string {
  return url.toLowerCase().includes(".png") ? "image/png" : "image/jpeg"
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
  const { organizationId } = await requireSession()

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
      const b64 = await photoToBase64(photo.url)
      if (!b64) return null
      return {
        type: "image_url" as const,
        image_url: { url: `data:${imageMediaType(photo.url)};base64,${b64}` },
      }
    })
  )

  const validImages = imageContents.filter(Boolean)
  if (validImages.length < 2) return { success: false, error: "Não foi possível carregar as imagens." }

  const labels = selected.map((p, i) => {
    const d = new Date(p.takenAt + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
    return `Foto ${i + 1}: ${d}${p.procedure ? ` — ${p.procedure}` : ""}`
  }).join("\n")

  const groq = new Groq({ apiKey })

  const chat = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Você é um especialista em estética e dermatologia. Analise as fotos abaixo e descreva a evolução observada.\n\n${labels}\n\nDescreva em português, de forma objetiva e profissional: mudanças na textura da pele, tom, manchas, hidratação, firmeza ou qualquer evolução visível. Máximo 4 frases.`,
          },
          ...validImages,
        ],
      },
    ],
    temperature: 0.4,
    max_tokens: 300,
  })

  const analysis = chat.choices[0]?.message?.content?.trim()
  if (!analysis) return { success: false, error: "Não foi possível gerar análise." }

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
      const b64 = await photoToBase64(photo.url)
      if (!b64) return null
      return {
        type: "image_url" as const,
        image_url: { url: `data:${imageMediaType(photo.url)};base64,${b64}` },
      }
    })
  )

  const validImages = imageContents.filter(Boolean)
  if (validImages.length < 2) return { success: false, error: "Não foi possível carregar as imagens." }

  const timeline = sampled.map((p, i) => {
    const d = new Date(p.takenAt + "T12:00:00").toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" })
    return `Foto ${i + 1}: ${d}${p.procedure ? ` (${p.procedure})` : ""}`
  }).join(" | ")

  const groq = new Groq({ apiKey })

  const chat = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
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
