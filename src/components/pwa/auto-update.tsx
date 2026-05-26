"use client"

import { useEffect } from "react"

export function PwaAutoUpdate() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"
    const swUrl = `/sw.js?v=${encodeURIComponent(appVersion)}`
    const refreshKey = `kira:pwa:reloaded:${appVersion}`
    const checkIntervalMs = 60_000

    let refreshing = false
    let lastCheckAt = 0

    // Reset da trava quando muda a versão publicada.
    const previousVersion = sessionStorage.getItem("kira:pwa:version")
    if (previousVersion !== appVersion) {
      sessionStorage.setItem("kira:pwa:version", appVersion)
      sessionStorage.removeItem(refreshKey)
    }

    const onControllerChange = () => {
      if (refreshing) return
      if (sessionStorage.getItem(refreshKey) === "1") return
      refreshing = true
      sessionStorage.setItem(refreshKey, "1")
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange)

    let regRef: ServiceWorkerRegistration | null = null

    const askUpdate = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" })
      }
    }

    const setup = async () => {
      try {
        const reg = await navigator.serviceWorker.register(swUrl)
        regRef = reg
        await reg.update()
        askUpdate(reg)

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing
          if (!newWorker) return
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              newWorker.postMessage({ type: "SKIP_WAITING" })
            }
          })
        })
      } catch {
        // atualização de PWA é best-effort
      }
    }

    const checkForUpdate = () => {
      if (document.visibilityState !== "visible") return
      const now = Date.now()
      if (now - lastCheckAt < checkIntervalMs) return
      lastCheckAt = now
      regRef?.update().catch(() => { /* best-effort */ })
    }

    setup()
    window.addEventListener("focus", checkForUpdate)
    document.addEventListener("visibilitychange", checkForUpdate)

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange)
      window.removeEventListener("focus", checkForUpdate)
      document.removeEventListener("visibilitychange", checkForUpdate)
    }
  }, [])

  return null
}
