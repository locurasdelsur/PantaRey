import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.get("is_authenticated")?.value === "true"

  // Rutas que requieren autenticación
  const protectedRoutes = ["/", "/canciones", "/calendario", "/tareas", "/ideas", "/fotos"]

  // Si el usuario NO está autenticado y trata de acceder a una ruta protegida, redirige a login
  if (!isAuthenticated && protectedRoutes.includes(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  // Si el usuario SÍ está autenticado y trata de acceder a la página de login, redirige al dashboard
  if (isAuthenticated && request.nextUrl.pathname === "/login") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/"
    return NextResponse.redirect(redirectUrl)
  }

  // Si no se necesita redirección, permite el paso
  return NextResponse.next()
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
