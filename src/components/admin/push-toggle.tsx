"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { savePushSubscriptionAction, deletePushSubscriptionAction, getVapidPublicKeyAction } from "@/actions/push"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

type State = "loading" | "unsupported" | "denied" | "subscribed" | "unsubscribed"

export function PushToggle() {
  const [state, setState] = useState<State>("loading")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported")
      return
    }
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      if (existing) { setState("subscribed"); return }
      if (Notification.permission === "denied") { setState("denied"); return }
      setState("unsubscribed")
    })
  }, [])

  async function enable() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== "granted") { setState("denied"); return }
      const publicKey = await getVapidPublicKeyAction()
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      await savePushSubscriptionAction(json)
      setState("subscribed")
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await deletePushSubscriptionAction(sub.endpoint)
      }
      setState("unsubscribed")
    } finally {
      setBusy(false)
    }
  }

  if (state === "loading" || state === "unsupported") return null

  if (state === "denied") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <BellOff size={13} />
        Notificações bloqueadas no browser
      </div>
    )
  }

  if (state === "subscribed") {
    return (
      <button
        onClick={disable}
        disabled={busy}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} className="text-primary" />}
        {busy ? "Desativando..." : "Notificações ativas"}
      </button>
    )
  }

  return (
    <button
      onClick={enable}
      disabled={busy}
      className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors"
    >
      {busy ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
      {busy ? "Ativando..." : "Ativar notificações"}
    </button>
  )
}
