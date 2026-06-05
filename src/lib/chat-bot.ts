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

async function sendWelcome(phone: string, senderName?: string | null) {
  const body = "Oi! 👋 Bem-vindo ao Kira. Como posso te ajudar hoje?"

  await sendWhatsAppQuickReply(phone, body, [BTN_SUPPORT, BTN_COMMERCIAL])
  await saveMessage(phone, "outbound", body)
  await upsertSession(phone, { state: "awaiting_selection", queue: null, userName: senderName ?? null, orgName: null })
}

async function sendOutOfHours(phone: string) {
  const text = "Oi! 🌙 Nosso atendimento é das 9h às 24h. Já anotamos sua mensagem e te respondemos assim que estivermos disponíveis!"
  await sendWhatsApp(phone, text)
  await saveMessage(phone, "outbound", text)
  // Mantém sessão em awaiting_selection para quando o usuário responder dentro do horário
  await upsertSession(phone, { state: "awaiting_selection", queue: null, userName: null, orgName: null })
}

async function findUserByPhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  const withDdi = digits.startsWith("55") ? digits : `55${digits}`
  const withoutDdi = digits.startsWith("55") ? digits.slice(2) : digits

  const rows = await db
    .select({ userName: users.name, orgName: organizations.name, phone: users.phone, whatsapp: users.whatsapp })
    .from(users)
    .innerJoin(organizationMembers, eq(organizationMembers.userId, users.id))
    .innerJoin(organizations, eq(organizations.id, organizationMembers.organizationId))
    .where(eq(organizationMembers.role, "owner"))

  return rows.find(r => {
    const p = (r.phone ?? "").replace(/\D/g, "")
    const w = (r.whatsapp ?? "").replace(/\D/g, "")
    return p === withDdi || p === withoutDdi || w === withDdi || w === withoutDdi
  }) ?? null
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

export async function handleInboundMessage(phone: string, text: string, senderName?: string | null) {
  await saveMessage(phone, "inbound", text)

  const session = await getOrCreateSession(phone)

  // Sem sessão ou sessão expirada → nova conversa
  if (!session) {
    if (isOutOfHours()) {
      await sendOutOfHours(phone)
    } else {
      await sendWelcome(phone, senderName)
    }
    return
  }

  // Atualiza nome do contato se ainda não tiver
  if (senderName && !session.userName) {
    await upsertSession(phone, { userName: senderName })
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
      // Tenta identificar pelo próprio número de telefone
      const foundByPhone = await findUserByPhone(phone)
      if (foundByPhone) {
        await routeToSupport(phone, foundByPhone.userName, foundByPhone.orgName)
        return
      }
      const reply = "Claro! Para localizar sua conta, me informa o CPF cadastrado no Kira:"
      await sendWhatsApp(phone, reply)
      await saveMessage(phone, "outbound", reply, "support")
      await upsertSession(phone, { state: "awaiting_cpf", queue: "support" })
      return
    }

    if (isCommercial) {
      const reply = "Perfeito! 😊 Em instantes um de nossos atendentes vai falar com você. Aguarda um pouquinho!"
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
