"use client"

import { useState, useEffect, useRef } from "react"
import { getMySupportMessagesAction, sendSupportMessageAction } from "@/actions/support"
import type { SupportThread, SupportMessage } from "@/db/schema"
import { mediaUrl } from "@/lib/media-url"
import { Send, MessagesSquare, ImagePlus, X, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

function formatTime(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
}

export function SupportChat() {
  const [thread, setThread] = useState<SupportThread | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [text, setText] = useState("")
  const [image, setImage] = useState<{ file: File; preview: string } | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getMySupportMessagesAction().then(({ thread, messages }) => { setThread(thread); setMessages(messages) })

    const interval = setInterval(async () => {
      const { thread, messages } = await getMySupportMessagesAction()
      setThread(thread)
      setMessages(messages)
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handlePickImage(file: File | undefined) {
    if (!file) return
    if (!file.type.startsWith("image/")) { setError("Formato inválido."); return }
    if (file.size > 10 * 1024 * 1024) { setError("Imagem muito grande. Máximo 10MB."); return }
    setError(null)
    setImage({ file, preview: URL.createObjectURL(file) })
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if ((!text.trim() && !image) || sending) return
    setSending(true)
    setError(null)

    const formData = new FormData()
    if (text.trim()) formData.set("content", text.trim())
    if (image) formData.set("image", image.file)

    const result = await sendSupportMessageAction(formData)
    if (!result.success) {
      setError(result.error ?? "Não foi possível enviar.")
      setSending(false)
      return
    }

    setText("")
    setImage(null)
    const updated = await getMySupportMessagesAction()
    setThread(updated.thread)
    setMessages(updated.messages)
    setSending(false)
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden h-full flex flex-col">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border shrink-0">
        <MessagesSquare size={16} className="text-primary" />
        <h2 className="font-semibold text-sm flex-1">Chamado</h2>
        {thread?.status === "resolved" && (
          <span className="flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[11px] font-medium">
            <CheckCircle2 size={11} /> Resolvido
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1.5 bg-muted/30">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-10">
              Manda uma mensagem — texto ou print de qualquer problema. A gente responde por aqui.
            </p>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.senderType === "org"
            const prevSame = i > 0 && messages[i - 1].senderType === msg.senderType
            return (
              <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start", prevSame ? "mt-0.5" : "mt-2")}>
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm",
                  isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-card text-foreground rounded-bl-sm"
                )}>
                  {msg.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(msg.imageUrl)} alt="" className="rounded-lg max-w-full mb-1.5" />
                  )}
                  {msg.content && <p className="text-sm whitespace-pre-wrap leading-snug">{msg.content}</p>}
                  <p className="text-[10px] opacity-50 mt-1 text-right">{formatTime(msg.createdAt)}</p>
                </div>
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="px-3 pt-2 shrink-0">
            <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs text-destructive">{error}</p>
          </div>
        )}

        {image && (
          <div className="px-3 pt-2 shrink-0">
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.preview} alt="" className="h-16 w-16 rounded-lg object-cover" />
              <button
                onClick={() => setImage(null)}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white"
              >
                <X size={11} />
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2.5 border-t border-border bg-background shrink-0">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handlePickImage(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-colors"
          >
            <ImagePlus size={17} />
          </button>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite uma mensagem..."
            className="flex-1 h-9 text-sm rounded-full"
            disabled={sending}
          />
          <Button type="submit" size="sm" disabled={(!text.trim() && !image) || sending} className="h-9 w-9 p-0 rounded-full shrink-0">
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </Button>
        </form>
      </div>
    </div>
  )
}
