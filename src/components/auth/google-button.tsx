"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function GoogleButton({ label = "Continuar com Google" }: { label?: string }) {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      disabled={isLoading}
      onClick={() => {
        setIsLoading(true)
        signIn("google", { callbackUrl: "/dashboard" })
      }}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
          </svg>
          Redirecionando...
        </span>
      ) : (
        <span className="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.53 5.53 0 01-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.88-3c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09A12 12 0 0012 24z"/>
            <path fill="#FBBC05" d="M5.31 14.32a7.2 7.2 0 010-4.64V6.59H1.3a12 12 0 000 10.82l4.01-3.09z"/>
            <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 001.3 6.59l4.01 3.09C6.25 6.86 8.89 4.75 12 4.75z"/>
          </svg>
          {label}
        </span>
      )}
    </Button>
  )
}
