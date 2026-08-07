import { db } from "@/db"
import { chatSessions, adminChatMessages, users, organizationMembers, organizations } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { sendWhatsApp, sendWhatsAppQuickReply } from "@/lib/whatsapp-client"
import { sendAdminPush } from "@/actions/push"
import { toLocalDigits, phoneMatchCandidates, onlyDigits } from "@/lib/phone"

const SESSION_TTL_MS = 2 * 60 * 60 * 1000  // 2 horas
const ROUTED_TTL_MS = 7 * 24 * 60 * 60 * 1000  // 7 dias — depois disso, volta a perguntar o menu

const BTN_SUPPORT    = "🛠 Suporte"
const BTN_COMMERCIAL = "💬 Comercial"

function formatPhoneForPush(phone: string): string {
  const local = toLocalDigits(phone)
  if (!local) return phone
  return `(${local.slice(0, 2)}) ${local.slice(2)}`
}

function isOutOfHours(): boolean {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }))
  const hour = now.getHours()
  return hour < 9  // 00h–08h59 = fora de horário
}

async function saveMessage(phone: string, direction: "inbound" | "outbound", content: string, queue?: string | null, senderName?: string | null) {
  await db.insert(adminChatMessages).values({ phone, direction, content, queue: queue ?? null, senderName: senderName ?? null })
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
