"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

export function NavProgress() {
  const pathname = usePathname()
  const [width, setWidth] = useState(0)
  const [opacity, setOpacity] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completingRef = useRef(false)

  function start() {
    if (completingRef.current) return
    clearInterval(intervalRef.current!)
    completingRef.current = false
    setOpacity(1)
    setWidth(10)
    intervalRef.current = setInterval(() => {
      setWidth((w) => {
        if (w >= 82) { clearInterval(intervalRef.current!); return 82 }
        return Math.min(w + Math.random() * 8 + 3, 82)
      })
    }, 180)
  }

  function complete() {
    completingRef.current = true
    clearInterval(intervalRef.current!)
    setWidth(100)
    const t1 = setTimeout(() => setOpacity(0), 200)
    const t2 = setTimeout(() => { setWidth(0); completingRef.current = false }, 520)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }

  // Start bar on any internal link click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a")
      if (!anchor) return
      const href = anchor.getAttribute("href") ?? ""
      if (!href || href.startsWith("#") || /^https?:\/\//.test(href) || href.startsWith("mailto")) return
      start()
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Complete when route finishes loading
  const prevRef = useRef(pathname)
  useEffect(() => {
    if (pathname === prevRef.current) return
    prevRef.current = pathname
    complete()
  }, [pathname])

  return (
    <div
      className="pointer-events-none fixed top-0 left-0 z-9999 h-0.5 bg-primary"
      style={{
        width: `${width}%`,
        opacity,
        transition:
          width === 100
            ? "width 180ms ease-out"
            : width === 0
            ? "none"
            : "width 180ms linear",
      }}
    />
  )
}
