"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { acceptInviteAction } from "@/actions/team"

export function AcceptInviteButton({ token }: { token: string }) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleAccept() {
    startTransition(async () => {
      const result = await acceptInviteAction(token)
      if (result.success) {
        router.push("/dashboard")
      } else {
        alert(result.error)
      }
    })
  }

  return (
    <button
      onClick={handleAccept}
      disabled={isPending}
      className="flex w-full items-center justify-center rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-60"
    >
      {isPending ? "Aceitando..." : "Aceitar convite"}
    </button>
  )
}
