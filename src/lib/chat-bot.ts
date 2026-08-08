import { db } from "@/db"
import { chatSessions, adminChatMessages, users, organizationMembers, organizations, clients, appointments } from "@/db/schema"
import { eq, and, or, inArray, desc } from "drizzle-orm"
import { sendWhatsApp, sendWhatsAppQuickReply } from "@/lib/whatsapp-client"
import { sendAdminPush } from "@/actions/push"
import { toLocalDigits, phoneMatchCandidates, onlyDigits } from "@/lib/phone"
import { answerFaqQuestion } from "@/lib/faq-bot"
import { answerPatientNotice, buildPatientNoticeFallback } from "@/lib/patient-notice-bot"
import { isRateLimited, recordFailure } from "@/lib/rate-limit"

const SESSION_TTL_MS = 2 * 60 * 60 * 1000  // 2 horas
const ROUTED_TTL_MS = 7 * 24 * 60 * 60 * 1000  // 7 dias — depois disso, volta a perguntar o menu
const PATIENT_NOTICE_TTL_MS = 6 * 60 * 60 * 1000  // 6 horas — janela de silêncio depois do aviso pra paciente

const BTN_SUPPORT    = "🛠 Suporte"
const BTN_COMMERCIAL = "💬 Comercial"

function formatPhoneForPush(phone: string): string {
  const local = toLocalDigits(phone)
  if (!local) return phone
  return `(${local.slice(0, 2)}) ${local.slice(2)}`
}

async function saveMessage(phone: string, direction: "inbound" | "outbound", content: string, queue?: string | null, senderName?: string | null, answeredBy?: string | null) {
  await db.insert(adminChatMessages).values({ phone, direction, content, queue: queue ?? null, senderName: senderName ?? null, answeredBy: answeredBy ?? null })
}

async function getOrCreateSession(phone: string) {
  const [existing] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.phone, phone))
    .limit(1)

  if (!existing) return null

  const elapsed = Date.now() - new Date(existing.lastActivityAt).getTime()

  // Sessões roteadas (admin conversando diretamente) ficam assim por mais tempo,
  // pra não interromper uma conversa em andamento com o menu do bot — mas depois
  // de uma semana sem nenhuma mensagem, trata como conversa nova de novo.
  if (existing.state === "routed") {
    if (elapsed > ROUTED_TTL_MS) {
      await db.delete(chatSessions).where(eq(chatSessions.phone, phone))
      return null
    }
    return existing
  }

  // Aviso de "isso aqui não é a clínica" já mandado — fica em silêncio por um
  // tempo, sem repetir o aviso a cada mensagem nova da mesma visita.
  if (existing.state === "patient_notice_sent") {
    if (elapsed > PATIENT_NOTICE_TTL_MS) {
      await db.delete(chatSessions).where(eq(chatSessions.phone, phone))
      return null
    }
    return existing
  }

  // Demais estados expiram após 2h de inatividade → trata como nova sessão
  if (elapsed > SESSION_TTL_MS) {
    await db.delete(chatSessions).where(eq(chatSessions.phone, phone))
    return null
  }

  return existing
}

async function upsertSession(phone: string, patch: Partial<typeof chatSessions.$inferInsert>) {
  const [existing] = await db.select({ id: chatSessions.id }).from(chatSessions).where(eq(chatSessions.phone, phone)).limit(1)
  if (existing) {
    await db.update(chatSessions).set({ ...patch, lastActivityAt: new Date() }).where(eq(chatSessions.phone, phone))
  } else {
    await db.insert(chatSessions).values({ phone, lastActivityAt: new Date(), ...patch })
  }
}

async function sendWelcome(phone: string, senderName?: string | null) {
  const body = "Olá! 👋 Sou o assistente virtual do Kira. Como posso te ajudar?"

  await sendWhatsAppQuickReply(phone, body, [BTN_SUPPORT, BTN_COMMERCIAL])
  await saveMessage(phone, "outbound", body)
  await upsertSession(phone, { state: "awaiting_selection", queue: null, userName: senderName ?? null, orgName: null })
}

// Tenta responder com a base de FAQ (ver src/lib/faq-bot.ts). Atrás de flag: só
// roda de verdade quando AI_FAQ_ENABLED=true. Devolve null se não respondeu
// (flag desligada, rate limit, ou pergunta fora da base).
async function tryAiAnswer(phone: string, text: string): Promise<string | null> {
  if (process.env.AI_FAQ_ENABLED !== "true") return null
  if (await isRateLimited("ai_faq", phone)) return null
  const { answered, reply } = await answerFaqQuestion(text)
  await recordFailure("ai_faq", phone)
  return answered && reply ? reply : null
}

async function findUserByPhone(phone: string) {
  // O telefone do dono é salvo local no perfil, mas chega com DDI pelo webhook.
  const candidates = new Set(phoneMatchCandidates(phone))

  const rows = await db
    .select({ userName: users.name, orgName: organizations.name, phone: users.phone, whatsapp: users.whatsapp })
    .from(users)
    .innerJoin(organizationMembers, eq(organizationMembers.userId, users.id))
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.role, "owner"))

  return rows.find(r =>
    candidates.has(onlyDigits(r.phone ?? "")) || candidates.has(onlyDigits(r.whatsapp ?? ""))
  ) ?? null
}

// Pacientes de clínicas costumam responder o número do Kira achando que é o
// WhatsApp da própria clínica (ele manda confirmação/lembrete/agradecimento).
// Se o telefone bate com uma cliente cadastrada (não dona de conta), prioriza
// o agendamento mais recente pra escolher a clínica quando houver mais de uma.
async function findClientByPhone(phone: string) {
  const candidates = phoneMatchCandidates(phone)
  if (candidates.length === 0) return null

  const [row] = await db
    .select({ orgName: organizations.name, orgPhone: organizations.phone })
    .from(clients)
    .innerJoin(organizations, eq(organizations.id, clients.organizationId))
    .leftJoin(appointments, eq(appointments.clientId, clients.id))
    .where(or(inArray(clients.phone, candidates), inArray(clients.whatsapp, candidates)))
    .orderBy(desc(appointments.date))
    .limit(1)

  return row ?? null
}

async function handleAwaitingCpf(phone: string, text: string) {
  const cpf = text.replace(/\D/g, "")
  if (cpf.length < 11) {
    const reply = "Hmm, não consegui identificar o CPF. Pode mandar só os números? (ex: 12345678901)"
    await sendWhatsApp(phone, reply)
    await saveMessage(phone, "outbound", reply, "support")
    return
  }

  const [found] = await db
    .select({ userName: users.name, orgName: organizations.name })
    .from(users)
    .innerJoin(organizationMembers, eq(organizationMembers.userId, users.id))
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(and(eq(users.cpf, cpf), eq(organizationMembers.role, "owner")))
    .limit(1)

  if (!found) {
    const reply = "Não encontrei nenhuma conta com esse CPF. 🤔 Pode conferir e tentar de novo? Se quiser outra ajuda, é só mandar uma mensagem."
    await sendWhatsApp(phone, reply)
    await saveMessage(phone, "outbound", reply, "support")
    return
  }

  await routeToSupport(phone, found.userName, found.orgName)
}

async function routeToSupport(phone: string, userName: string, orgName: string) {
  const firstName = userName.split(" ")[0]
  const reply = `Tudo certo, ${firstName}! 😊 Já encaminhei seu contato para o nosso time. Em breve alguém fala com você!`
  await sendWhatsApp(phone, reply)
  await saveMessage(phone, "outbound", reply, "support")
  await upsertSession(phone, { state: "routed", queue: "support", userName, orgName })
}

export async function handleInboundMessage(
  phone: string,
  text: string,
  senderName?: string | null,
  opts?: { skipBot?: boolean }
) {
  await saveMessage(phone, "inbound", text, null, senderName)

  // Avisa o admin por push sempre que chega mensagem — independe do bot ter algo a fazer
  sendAdminPush({
    title: `💬 ${senderName ?? formatPhoneForPush(phone)}`,
    body: text.length > 120 ? `${text.slice(0, 117)}...` : text,
    url: `/admin?section=chat&phone=${encodeURIComponent(phone)}`,
  }).catch((err) => console.error("[ChatBot] erro ao enviar push", err))

  // Conversa já "quente" (admin respondeu recentemente, ou cliente usou "responder") —
  // não aciona o menu do bot, só registra a mensagem (já feito acima) e marca atividade.
  if (opts?.skipBot) {
    const [existing] = await db.select({ id: chatSessions.id }).from(chatSessions).where(eq(chatSessions.phone, phone)).limit(1)
    if (existing) await db.update(chatSessions).set({ lastActivityAt: new Date() }).where(eq(chatSessions.phone, phone))
    return
  }

  const session = await getOrCreateSession(phone)

  // Já roteado → mensagem vai direto pro admin (sem bot)
  if (session?.state === "routed") {
    await upsertSession(phone, { lastActivityAt: new Date() })
    return
  }

  // Paciente de alguma clínica respondendo o número do Kira achando que é o
  // WhatsApp da própria clínica (ele manda confirmação/lembrete/agradecimento)
  // — intercepta antes do menu Suporte/Comercial, que não faz sentido pra ela.
  if (!session || session.state === "awaiting_selection") {
    const isOwner = await findUserByPhone(phone)
    if (!isOwner) {
      const patient = await findClientByPhone(phone)
      if (patient) {
        const usedAi = process.env.AI_FAQ_ENABLED === "true"
        const reply = usedAi
          ? await answerPatientNotice(text, patient.orgName, patient.orgPhone)
          : buildPatientNoticeFallback(patient.orgName, patient.orgPhone)
        await sendWhatsApp(phone, reply)
        await saveMessage(phone, "outbound", reply, null, null, usedAi ? "ai" : "bot")
        await upsertSession(phone, { state: "patient_notice_sent", queue: null })
        return
      }
    }
  }

  // Sem sessão ou sessão expirada → nova conversa
  if (!session) {
    await sendWelcome(phone, senderName)
    return
  }

  // Atualiza nome do contato se ainda não tiver
  if (senderName && !session.userName) {
    await upsertSession(phone, { userName: senderName })
  }

  // Aguardando seleção
  if (session.state === "awaiting_selection") {
    const normalized = text.trim().toLowerCase()
    const isSupport    = normalized.includes("suporte") || normalized === "1"
    const isCommercial = normalized.includes("comercial") || normalized.includes("dúvidas") || normalized.includes("duvidas") || normalized === "2"

    if (isSupport || isCommercial) {
      const queue = isSupport ? "support" : "commercial"
      const reply = "Claro! Me conta o que você precisa que eu já te ajudo 😊"
      await sendWhatsApp(phone, reply)
      await saveMessage(phone, "outbound", reply, queue)
      await upsertSession(phone, { state: "awaiting_question", queue })
      return
    }

    // Não bateu com o menu — antes de só repetir, tenta responder com IA
    const aiReply = await tryAiAnswer(phone, text)
    if (aiReply) {
      const faqReply = `${aiReply}\n\nSe quiser falar com alguém da equipe, é só digitar *suporte* ou *comercial*.`
      await sendWhatsApp(phone, faqReply)
      await saveMessage(phone, "outbound", faqReply, null, null, "ai")
      await upsertSession(phone, { lastActivityAt: new Date() })
      return
    }

    // Não reconheceu → repete menu
    await sendWelcome(phone)
    return
  }

  // Aguardando CPF
  if (session.state === "awaiting_cpf") {
    await handleAwaitingCpf(phone, text)
    return
  }

  // Escolheu Suporte ou Comercial e agora mandou a pergunta — tenta responder
  // com IA antes de escalar pra humano (só escala quando a IA realmente não souber).
  if (session.state === "awaiting_question") {
    const queue = session.queue ?? "commercial"

    const aiReply = await tryAiAnswer(phone, text)
    if (aiReply) {
      const faqReply = `${aiReply}\n\nPosso te ajudar com mais alguma coisa, ou prefere falar com alguém da equipe?`
      await sendWhatsApp(phone, faqReply)
      await saveMessage(phone, "outbound", faqReply, queue, null, "ai")
      await upsertSession(phone, { lastActivityAt: new Date() })
      return
    }

    // IA não soube (ou está desligada) → escala pra humano
    const fallback = "Parece que eu ainda não tenho esse conhecimento 🤔 Vou chamar alguém do nosso time pra te responder melhor!"
    await sendWhatsApp(phone, fallback)
    await saveMessage(phone, "outbound", fallback, queue)

    if (queue === "support") {
      const foundByPhone = await findUserByPhone(phone)
      if (foundByPhone) {
        await routeToSupport(phone, foundByPhone.userName, foundByPhone.orgName)
        return
      }
      const cpfReply = "Pra localizar sua conta, me informa o CPF cadastrado no Kira:"
      await sendWhatsApp(phone, cpfReply)
      await saveMessage(phone, "outbound", cpfReply, "support")
      await upsertSession(phone, { state: "awaiting_cpf", queue: "support" })
      return
    }

    await upsertSession(phone, { state: "routed", queue: "commercial" })
    return
  }
}
