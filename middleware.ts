import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { prisma } from "@/lib/db/prisma"

// Middleware runs on every request, but the JWT cookie it reads is only
// re-signed by NextAuth's own callback pipeline (sign-in, or a client-side
// session refresh) — a teacher approving a student in /manage updates the
// database immediately, but that student's *existing* JWT keeps saying
// PENDING until something happens to refresh it, so they kept landing back
// on /pending ("approved but can't get in") with no logout/login to force
// it. Re-checking the DB here, only for the PENDING/DENIED case, closes
// that gap without adding a DB round-trip to every already-approved request.
export const runtime = "nodejs"

const PUBLIC_PATHS = ["/login", "/api/auth"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // --- Unauthenticated ---
  if (!token) {
    if (isPublic) return NextResponse.next()
    return NextResponse.redirect(new URL("/login", req.url))
  }

  let role = token.role as string
  let accessStatus = token.accessStatus as string

  if ((accessStatus === "PENDING" || accessStatus === "DENIED") && token.sub) {
    const fresh = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true, accessStatus: true },
    }).catch(() => null)
    if (fresh) {
      role = fresh.role
      accessStatus = fresh.accessStatus
    }
  }

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
    // Teachers/admins can also open this in preview mode (see "גרסת תלמיד"
    // on the teacher home) — the page itself detects the role and adjusts
    // what it shows instead of pretending to be a real student.
    if (role !== "STUDENT" && role !== "TEACHER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
