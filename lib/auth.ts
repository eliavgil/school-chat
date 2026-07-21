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
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      // On first sign-in, copy DB fields into the token
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.accessStatus = (user as any).accessStatus
        token.parentType = (user as any).parentType ?? null
        token.studentId = (user as any).studentId ?? null
      }
      // Re-fetch from DB when admin changes role/accessStatus,
      // or when the token doesn't yet carry our custom fields.
      // This only hits DB on PENDING users (cheap for rare case) and
      // on the very first request after a deploy.
      if (trigger === "update" || !token.role) {
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
      }
      // For PENDING users: always re-check DB so approval takes effect
      // without requiring a logout/login cycle.
      if (token.role === "PARENT" && token.accessStatus === "PENDING") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub! },
          select: { accessStatus: true },
        })
        if (dbUser) token.accessStatus = dbUser.accessStatus
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
