import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PATHS = ["/login", "/api/auth", "/grocery", "/api/grocery"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // --- Unauthenticated ---
  if (!token) {
    if (isPublic) return NextResponse.next()
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const role = token.role as string
  const accessStatus = token.accessStatus as string

  // --- Already logged in, trying to access login ---
  if (pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // --- PENDING or DENIED users: only /pending and /api/* ---
  if (
    accessStatus === "PENDING" &&
    !pathname.startsWith("/pending") &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.redirect(new URL("/pending", req.url))
  }

  if (accessStatus === "DENIED" && !pathname.startsWith("/pending") && !pathname.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/pending", req.url))
  }

  // --- Route guards ---
  const teacherRoutes = ["/dashboard", "/admin", "/profile"]
  const parentRoutes = ["/chat"]
  const studentRoutes = ["/student"]

  if (teacherRoutes.some((r) => pathname.startsWith(r))) {
    if (role !== "TEACHER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (parentRoutes.some((r) => pathname.startsWith(r))) {
    if (role !== "PARENT") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  if (studentRoutes.some((r) => pathname.startsWith(r))) {
    if (role !== "STUDENT") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
