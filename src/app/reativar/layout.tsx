import { AuthSessionProvider } from "@/components/layout/session-provider"

export default function ReativarLayout({ children }: { children: React.ReactNode }) {
  return <AuthSessionProvider>{children}</AuthSessionProvider>
}
