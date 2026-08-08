import Groq from "groq-sdk"
import { FAQ_KNOWLEDGE } from "@/lib/faq-knowledge"

// Bot de FAQ do WhatsApp — responde só com base em FAQ_KNOWLEDGE. Qualquer
// coisa fora desse escopo (cancelamento, reclamação, negociação, dúvida que
// não está na base) devolve answered:false, e quem chama cai no fluxo normal
// de rotear pra um humano. Nunca deixa a IA "inventar" resposta.
export async function answerFaqQuestion(question: string): Promise<{ answered: boolean; reply?: string }> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { answered: false }

  try {
    const groq = new Groq({ apiKey })
    const chat = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Você é a atendente do Kira, um sistema de gestão pra clínicas de estética/biomédicas, respondendo no WhatsApp.

Só responda usando os fatos abaixo. Se a pergunta não estiver coberta por eles, ou for sobre cancelamento, reembolso, reclamação, problema técnico, ou qualquer coisa que precise de uma pessoa da equipe pra resolver, não responda — devolva answered:false.

Fatos sobre o Kira:
${FAQ_KNOWLEDGE}

Pergunta da pessoa: "${question}"

Responda APENAS em JSON válido, sem markdown, neste formato exato:
{"answered": true ou false, "reply": "<resposta curta em pt-BR, tom simpático, só se answered=true>"}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 200,
    })

    const raw = chat.choices[0]?.message?.content?.trim() ?? ""
    const json = JSON.parse(raw.replace(/```json?|```/g, "").trim())
    if (!json.answered || typeof json.reply !== "string" || !json.reply.trim()) {
      return { answered: false }
    }
    return { answered: true, reply: json.reply.trim() }
  } catch {
    return { answered: false }
  }
}
