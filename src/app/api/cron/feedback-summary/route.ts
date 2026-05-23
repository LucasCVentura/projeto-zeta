import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { userFeedback, feedbackSummaries } from "@/db/schema"
import { desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const feedbacks = await db
    .select({ content: userFeedback.content })
    .from(userFeedback)
    .orderBy(desc(userFeedback.createdAt))
    .limit(200)

  if (feedbacks.length === 0) {
    return NextResponse.json({ ok: true, message: "Nenhum feedback para resumir." })
  }

  const feedbackList = feedbacks
    .map((f, i) => `${i + 1}. ${f.content}`)
    .join("\n")

  const Groq = (await import("groq-sdk")).default
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `Você é um analista de produto. Analise os feedbacks abaixo de usuários de um SaaS de gestão de clínicas de estética (Kira) e gere um resumo executivo consolidado.

Agrupe temas recorrentes, destaque os pedidos mais frequentes e pontos de dor. Use linguagem direta e acionável, como se estivesse apresentando ao fundador do produto. Formato: parágrafos curtos, sem bullet points excessivos. Máximo de 400 palavras.`,
      },
      {
        role: "user",
        content: `Feedbacks recebidos (${feedbacks.length} no total):\n\n${feedbackList}`,
      },
    ],
    temperature: 0.5,
    max_tokens: 800,
  })

  const summary = completion.choices[0].message.content ?? ""

  await db.insert(feedbackSummaries).values({
    summary,
    feedbackCount: feedbacks.length,
  })

  return NextResponse.json({ ok: true, feedbackCount: feedbacks.length })
}
