import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      accessStatus?: string
      parentType?: string | null
      studentId?: string | null
    }
  }
}
