"use client"

import { useEffect, useState } from "react"
import { Lightbulb, X } from "lucide-react"
import { DASHBOARD_TIPS } from "@/lib/dashboard-tips"

function dayOfYear(d: Date) {
  const start = new Date(d.getFullYear(), 0, 0)
  const diff = d.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function DailyTip() {
  const [visible, setVisible] = useState(false)
  const [tip, setTip] = useState("")

  useEffect(() => {
    const todayKey = new Date().toDateString()
    const storageKey = `kira:daily-tip-dismissed:${todayKey}`
    setTip(DASHBOARD_TIPS[dayOfYear(new Date()) % DASHBOARD_TIPS.length])
    setVisible(localStorage.getItem(storageKey) !== "1")
  }, [])

  if (!visible || !tip) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
      <Lightbulb size={16} className="text-primary shrink-0" />
      <p className="flex-1 text-sm text-foreground/90">{tip}</p>
      <button
        onClick={() => {
          localStorage.setItem(`kira:daily-tip-dismissed:${new Date().toDateString()}`, "1")
          setVisible(false)
        }}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        title="Dispensar"
      >
        <X size={13} />
      </button>
    </div>
  )
}
