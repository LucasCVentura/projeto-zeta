"use client"

import { useState, useEffect } from "react"
import type { Notice } from "@/lib/notices"
import { X, AlertTriangle, Info, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "kira_dismissed_notices"

function getDismissed(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") } catch { return [] }
}

function dismiss(id: string) {
  const dismissed = getDismissed()
  if (!dismissed.includes(id)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...dismissed, id]))
  }
}

const ICONS = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle2,
}

const STYLES = {
  warning: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-700 dark:text-amber-200",
  info: "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200",
  success: "bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-200",
}

export function NoticesBanner({ notices }: { notices: Notice[] }) {
  const [visible, setVisible] = useState<Notice[]>([])

  useEffect(() => {
    const dismissed = getDismissed()
    setVisible(notices.filter(n => !dismissed.includes(n.id)))
  }, [notices])

  function handleDismiss(id: string) {
    dismiss(id)
    setVisible(prev => prev.filter(n => n.id !== id))
  }

  if (visible.length === 0) return null

  return (
    <div className="flex flex-col gap-0">
      {visible.map(notice => {
        const Icon = ICONS[notice.type]
        return (
          <div key={notice.id} className={cn("flex items-start gap-3 px-4 py-3 border-b text-sm", STYLES[notice.type])}>
            <Icon size={16} className="shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="font-semibold">{notice.title}</span>
              {notice.message && <span className="ml-1 opacity-80">{notice.message}</span>}
            </div>
            <button onClick={() => handleDismiss(notice.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
