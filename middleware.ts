import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware" // Import the new utility
import { createServerClient } from "@supabase/ssr" // Also need this for session check

export async function middleware(request: NextRequest) {
  // Step 1: Update the session (refresh tokens and set cookies)
  const response = await updateSession(request)

  // Step 2: Create a server client to get the *current* session after updateSession has run
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Rutas que requieren autenticación
  const protectedRoutes = ["/", "/canciones", "/calendario", "/tareas", "/ideas", "/fotos"]

  // If the user is not authenticated and tries to access a protected route, redirect to login
  if (!session && protectedRoutes.includes(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is authenticated and tries to access the login page, redirect to dashboard
  if (session && request.nextUrl.pathname === "/login") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/"
    return NextResponse.redirect(redirectUrl)
  }

  // If no redirection is needed, return the response from updateSession (which contains updated cookies)
  return response
}

export const config = {
  matcher: [
    "/",
    "/canciones/:path*",
    "/calendario/:path*",
    "/tareas/:path*",
    "/ideas/:path*",
    "/fotos/:path*",
    "/login",
  ],
}
