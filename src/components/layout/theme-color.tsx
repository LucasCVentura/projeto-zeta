"use client"

import { useEffect } from "react"

const LIGHT = "#fdfcfb"
const DARK  = "#201318"

export function ThemeColor() {
  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) return

    function update() {
      meta!.content = document.documentElement.classList.contains("dark") ? DARK : LIGHT
    }

    update()

    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  return null
}
