"use client"

import { useEffect, useState } from "react"

export type ThemeMode = "light" | "dark" | "light-slate" | "dark-slate"

const VALID_MODES: ThemeMode[] = ["light", "dark", "light-slate", "dark-slate"]

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.toggle("dark", mode === "dark" || mode === "dark-slate")
  root.classList.toggle("theme-slate", mode === "light-slate" || mode === "dark-slate")
}

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    const initial: ThemeMode = VALID_MODES.includes(saved as ThemeMode) ? (saved as ThemeMode) : "dark"
    setMode(initial)
    applyTheme(initial)
    setMounted(true)
  }, [])

  function setTheme(next: ThemeMode) {
    setMode(next)
    applyTheme(next)
    localStorage.setItem("theme", next)
  }

  function toggle() {
    setTheme(mode === "light" || mode === "light-slate" ? "dark" : "light")
  }

  const isDark = mode === "dark" || mode === "dark-slate"
  return { mode, isDark, setTheme, toggle, mounted }
}
