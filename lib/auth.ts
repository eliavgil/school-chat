import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/db/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Google is the only provider here, and the "existing account" it might
      // link to is always one we created ourselves (pre-registered by email
      // in /manage, or a prior sign-in) — never a third-party account, so the
      // usual phishing risk this flag is named for doesn't apply. Without it,
      // a teacher pre-registering a student's email before their first sign-in
      // (app/api/admin/users POST) leaves a User row with no linked Account
      // and no emailVerified — NextAuth then refuses to link the student's
      // real Google sign-in to it (OAuthAccountNotLinked) instead of just
      // signing them in.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On first sign-in, copy DB fields into the token
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.accessStatus = (user as any).accessStatus
        token.parentType = (user as any).parentType ?? null
        token.studentId = (user as any).studentId ?? null
      }
      // Always re-verify against the DB on every session check (not just first
      // sign-in). This used to be conditional on "still pending" only, which
      // meant an admin correction made *after* approval — e.g. converting a
      // student who'd mistakenly registered as a parent — never reached an
      // already-signed-in browser's token: role stayed stuck at the old value
      // (still "PARENT", still routing to the parent home screen) until the
      // JWT's ~30-day expiry, since neither of the old narrower re-check
      // conditions ever matched an already-APPROVED, already-linked account.
      // A small school app's session-check volume makes the extra read here
      // free; the alternative is silently-stale identity data, which is worse.
      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub! },
        select: { role: true, accessStatus: true, parentType: true, studentId: true },
      })
      if (dbUser) {
        token.role = dbUser.role
        token.accessStatus = dbUser.accessStatus
        token.parentType = dbUser.parentType ?? null
        token.studentId = dbUser.studentId ?? null
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id ?? token.sub) as string
        session.user.role = token.role as string
        session.user.accessStatus = token.accessStatus as string
        session.user.parentType = token.parentType as string | null
        session.user.studentId = token.studentId as string | null
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
}
