import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getServiceAccountEmail } from "@/lib/sheets/client"

// GET — the service account's own address, so a teacher can share a
// restricted (non-public) sheet with exactly this one email instead of
// "anyone with the link". client_email isn't a secret (it's meant to be
// handed out — that's how sharing with a service account works), unlike
// the private key that sits alongside it in GOOGLE_SERVICE_ACCOUNT_JSON.
export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== "TEACHER" && role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const email = getServiceAccountEmail()
  if (!email) return NextResponse.json({ error: "GOOGLE_SERVICE_ACCOUNT_JSON not set" }, { status: 500 })
  return NextResponse.json({ email })
}
