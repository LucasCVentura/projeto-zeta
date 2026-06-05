import { db } from "@/db"
import { chatSessions, adminChatMessages, users, organizationMembers, organizations } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { sendWhatsApp, sendWhatsAppQuickReply } from "@/lib/whatsapp-client"

const SESSION_TTL_MS = 2 * 60 * 60 * 1000  // 2 horas

const BTN_SUPPORT    = "🛠 Suporte"
const BTN_COMMERCIAL = "💬 Comercial"

function isOutOfHours(): boolean {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  const hour = now.getHours()
  return hour < 9  // 00h–08h59 = fora de horário
}

async function saveMessage(phone: string, direction: "inbound" | "outbound", content: string, queue?: string | null) {
  await db.insert(adminChatMessages).values({ phone, direction, content, queue: queue ?? null })
}

async function getOrCreateSession(phone: string) {
  const [existing] = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.phone, phone))
    .limit(1)

  if (!existing) return null

  // Expira após 2h de inatividade → trata como nova sessão
  const elapsed = Date.now() - new Date(existing.lastActivityAt).getTime()
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

async function sendWelcome(phone: string) {
  const text = `Olá! 👋 Como o Kira pode te ajudar hoje?\n\n1️⃣ Suporte\n2️⃣ Comercial / Dúvidas\n\nResponda com o número ou o nome da opção.`

  // Tenta quick_reply (botões nativos) em paralelo com o texto — garante entrega
  // e melhora a UX se os botões funcionarem
  const [, quickReplyResult] = await Promise.allSettled([
    sendWhatsApp(phone, text),
    sendWhatsAppQuickReply(phone, "Como o Kira pode te ajudar hoje?", [BTN_SUPPORT, BTN_COMMERCIAL]),
  ])

  if (quickReplyResult.status === "rejected") {
    console.log("[Chatbot][welcome] quick_reply falhou:", quickReplyResult.reason)
  }

  await saveMessage(phone, "outbound", text)
  await upsertSession(phone, { state: "awaiting_selection", queue: null, userName: null, orgName: null })
}

async function sendOutOfHours(phone: string) {
  const text = "Olá! 👋 Nosso atendimento funciona das 9h às 24h. Recebemos sua mensagem e responderemos assim que estivermos disponíveis! 😊"
  await sendWhatsApp(phone, text)
  await saveMessage(phone, "outbound", text)
  // Mantém sessão em awaiting_selection para quando o usuário responder dentro do horário
  await upsertSession(phone, { state: "awaiting_selection", queue: null, userName: null, orgName: null })
}

async function handleAwaitingCpf(phone: string, text: string) {
  const cpf = text.replace(/\D/g, "")
  if (cpf.length < 11) {
    const reply = "Não consegui identificar o CPF. Por favor, informe apenas os números (ex: 12345678901):"
    await sendWhatsApp(phone, reply)
    await saveMessage(phone, "outbound", reply, "support")
    return
  }

  // Busca usuário pelo CPF
  const [found] = await db
    .select({
      userName: users.name,
      orgName: organizations.name,
    })
    .from(users)
    .innerJoin(organizationMembers, eq(organizationMembers.userId, users.id))
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(and(eq(users.cpf, cpf), eq(organizationMembers.role, "owner")))
    .limit(1)

  if (!found) {
    const reply = "Não encontramos uma conta com esse CPF. 🤔 Pode verificar e tentar novamente? Se precisar de outra ajuda, digite qualquer coisa para voltar ao menu."
    await sendWhatsApp(phone, reply)
    await saveMessage(phone, "outbound", reply, "support")
    return
  }

  const firstName = found.userName.split(" ")[0]
  const reply = `Olá, ${firstName}! 😊 Sua solicitação foi recebida e logo um de nossos colaboradores entrará em contato. Aguarde!`
  await sendWhatsApp(phone, reply)
  await saveMessage(phone, "outbound", reply, "support")
  await upsertSession(phone, { state: "routed", queue: "support", userName: found.userName, orgName: found.orgName })
}

export async function handleInboundMessage(phone: string, text: string) {
  await saveMessage(phone, "inbound", text)

  const session = await getOrCreateSession(phone)

  // Sem sessão ou sessão expirada → nova conversa
  if (!session) {
    if (isOutOfHours()) {
      await sendOutOfHours(phone)
    } else {
      await sendWelcome(phone)
    }
    return
  }

  // Já roteado → mensagem vai direto pro admin (sem bot)
  if (session.state === "routed") {
    await upsertSession(phone, { lastActivityAt: new Date() })
    return
  }

  // Aguardando seleção
  if (session.state === "awaiting_selection") {
    const normalized = text.trim().toLowerCase()
    const isSupport    = normalized.includes("suporte") || normalized === "1"
    const isCommercial = normalized.includes("comercial") || normalized.includes("dúvidas") || normalized.includes("duvidas") || normalized === "2"

    if (isSupport) {
      const reply = "Entendido! 🛠 Para identificarmos sua conta, por favor informe seu CPF cadastrado no Kira:"
      await sendWhatsApp(phone, reply)
      await saveMessage(phone, "outbound", reply, "support")
      await upsertSession(phone, { state: "awaiting_cpf", queue: "support" })
      return
    }

    if (isCommercial) {
      const reply = "Ótimo! 😊 Em breve um de nossos colaboradores entrará em contato. Aguarde!"
      await sendWhatsApp(phone, reply)
      await saveMessage(phone, "outbound", reply, "commercial")
      await upsertSession(phone, { state: "routed", queue: "commercial" })
      return
    }

    // Não reconheceu → repete menu
    if (isOutOfHours()) {
      await sendOutOfHours(phone)
    } else {
      await sendWelcome(phone)
    }
    return
  }

  // Aguardando CPF
  if (session.state === "awaiting_cpf") {
    await handleAwaitingCpf(phone, text)
    return
  }
}
