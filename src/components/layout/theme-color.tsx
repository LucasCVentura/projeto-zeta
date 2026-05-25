"use client"

import { useEffect } from "react"
import { useTheme } from "@/hooks/use-theme"

// Cores do globals.css convertidas para hex
const LIGHT = "#fdfcfb" // --background light: oklch(0.99 0.004 345)
const DARK  = "#201318" // --background dark:  oklch(0.13 0.01 340)

export function ThemeColor() {
  const { isDark, mounted } = useTheme()

  useEffect(() => {
    if (!mounted) return
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (meta) meta.content = isDark ? DARK : LIGHT
  }, [isDark, mounted])

  return null
}
