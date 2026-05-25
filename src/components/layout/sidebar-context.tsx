"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

type SidebarCtx = { collapsed: boolean; toggle: () => void }
const SidebarContext = createContext<SidebarCtx>({ collapsed: false, toggle: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(localStorage.getItem("kira:sidebar-collapsed") === "1")
  }, [])

  const toggle = useCallback(() => {
    setCollapsed((v) => {
      localStorage.setItem("kira:sidebar-collapsed", !v ? "1" : "0")
      return !v
    })
  }, [])

  return (
    <SidebarContext.Provider value={{ collapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
