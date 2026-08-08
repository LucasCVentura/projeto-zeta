import Groq from "groq-sdk"

// Pacientes de clínicas costumam responder o número do Kira (usado pra mandar
// confirmação/lembrete/agradecimento) achando que estão falando direto com a
// clínica — ex: "cheguei", "to aqui". Esse bot gera uma resposta natural,
// reconhecendo o que a pessoa disse, deixando claro que esse número não é
// monitorado pela clínica e orientando a falar direto com a equipe.
export async function answerPatientNotice(message: string, orgName: string, orgPhone: string | null): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  const fallback = buildPatientNoticeFallback(orgName, orgPhone)
  if (!apiKey) return fallback

  try {
    const groq = new Groq({ apiKey })
    const chat = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Você é um assistente automático do Kira, sistema que a clínica "${orgName}" usa pra mandar avisos de agendamento (confirmação, lembrete, agradecimento) pelo WhatsApp. Esse mesmo número às vezes recebe respostas de pacientes que acham que estão falando direto com a clínica.

Uma paciente da "${orgName}" mandou esta mensagem pra esse número: "${message}"

Escreva uma resposta curta (1-2 frases), calorosa e natural em pt-BR, que:
- Reconheça o que ela disse (ex: se ela disse que chegou, comente isso).
- Deixe claro, de forma gentil, que esse número é automático e não é visto pela equipe da clínica em tempo real.
${orgPhone ? `- Oriente a falar direto com a equipe pelo WhatsApp da clínica: ${orgPhone}.` : "- Oriente a falar direto com a equipe pelo canal que ela já usa com a clínica (não invente um número)."}

Não tente resolver o que ela pediu (não é sua função). Responda só com o texto da mensagem, sem aspas, sem markdown.`,
        },
      ],
      temperature: 0.4,
      max_tokens: 150,
    })

    const reply = chat.choices[0]?.message?.content?.trim()
    return reply || fallback
  } catch {
    return fallback
  }
}

export function buildPatientNoticeFallback(orgName: string, orgPhone: string | null): string {
  const contact = orgPhone
    ? `pelo WhatsApp da clínica: ${orgPhone}`
    : "pelo canal que você já usa com a clínica"
  return `Oi! 😊 Esse número é usado pela ${orgName} só pros avisos automáticos (confirmação, lembrete) — não é monitorado por aqui. Pra falar direto com a equipe, entra em contato ${contact}.`
}
