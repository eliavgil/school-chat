import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminClient } from "@/lib/lessons/supabase"

const BUCKET = "lesson-images"
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof Blob)) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 413 })
  }

  const ext = file.type.split("/")[1].replace("svg+xml", "svg")
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const path = `slides/${name}`

  const sb = adminClient()

  // Ensure bucket exists (no-op if it already does)
  await sb.storage.createBucket(BUCKET, { public: true }).catch(() => {})

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await sb.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
