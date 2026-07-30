import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { REFERRAL_COOKIE, REFERRAL_COOKIE_MAX_AGE, MANUAL_NF_REF } from "@/lib/referral"

const publicRoutes = [
  "/", "/login", "/register", "/forgot-password", "/reset-password", "/assinar",
  "/termos", "/privacidade", "/api/webhooks",
  "/agendar",
  "/anamnese", "/convite", "/reativar", "/og",
  "/agenda-para-estetica", "/prontuario-estetico-digital",
  "/sistema-para-biomedica-esteta", "/sistema-para-clinica-de-estetica",
  "/manual-nf",
]
const authRoutes = ["/login", "/register"]

function matchesRoute(pathname: string, route: string) {
  if (route === "/") return pathname === "/"
  return pathname === route || pathname.startsWith(`${route}/`)
}

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user
  const isPublic = publicRoutes.some((r) => matchesRoute(nextUrl.pathname, r))
  const isAuthRoute = authRoutes.some((r) => matchesRoute(nextUrl.pathname, r))

  // Usuário logado tentando acessar login/register → manda pro dashboard
  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  // Rota privada sem sessão → manda pro login
  if (!isLoggedIn && !isPublic) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const res = NextResponse.next()
  res.headers.set("x-pathname", nextUrl.pathname)

  // Landing on the Manual NF welcome page (or carrying its ?ref= tag anywhere)
  // marks this browser for the extended trial — set here, in middleware,
  // rather than client-side, so it survives straight through the OAuth
  // (Google/Facebook) redirect round-trip too, not just the email/password form.
  if (nextUrl.pathname === "/manual-nf" || nextUrl.searchParams.get("ref") === MANUAL_NF_REF) {
    res.cookies.set(REFERRAL_COOKIE, MANUAL_NF_REF, {
      maxAge: REFERRAL_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    })
  }

  return res
})

export const config = {
  // Ignora assets estáticos (arquivos com extensão) e rotas internas
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
