import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { listSheets } from "@/lib/sheets/client"

export async function GET() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== "TEACHER" && role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const hasEnv = !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!hasEnv) return NextResponse.json({ error: "GOOGLE_SERVICE_ACCOUNT_JSON not set" })

  try {
    const sheets = await listSheets()
    return NextResponse.json({ ok: true, sheets })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack?.slice(0, 500) })
  }
}
