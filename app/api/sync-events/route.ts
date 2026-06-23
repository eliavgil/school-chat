import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const SHEET_ID = "1fo8pKLjhM0nmzl5moG5YEL-RJH-6J7udWoXtwIQ5RKU"
const CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const cols: string[] = []
  let cur = ""
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuote = !inQuote; continue }
    if (ch === "," && !inQuote) { cols.push(cur); cur = ""; continue }
    cur += ch
  }
  cols.push(cur)
  return cols
}

// Handles DD.M.YY, DD/M/YY, DD.M.YYYY, DD/M/YYYY
function parseDate(raw: string): Date | null {
  const clean = raw.trim().replace(/\//g, ".")
  const parts = clean.split(".")
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y) return null
  const year = y < 100 ? 2000 + y : y
  const date = new Date(Date.UTC(year, m - 1, d))
  if (isNaN(date.getTime())) return null
  return date
}

function parseBool(raw: string | undefined): boolean {
  return (raw ?? "").trim().toUpperCase() === "TRUE"
}

export async function POST() {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let csv: string
  try {
    const res = await fetch(CSV_URL, { cache: "no-store" })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    csv = await res.text()
  } catch (e: any) {
    return NextResponse.json({ error: `Failed to fetch sheet: ${e.message}` }, { status: 500 })
  }

  const lines = csv.split("\n").slice(1) // skip header row

  const events: {
    date: Date
    description: string
    type: string | null
    note: string | null
    forAll: boolean
    forTeacher: boolean
    forGradeTeam: boolean
    forStudents: boolean
    forParents: boolean
  }[] = []

  for (const line of lines) {
    if (!line.trim()) continue
    const cols = parseCSVLine(line)
    // Columns: A=date, B=description, C=type, D=note, E=forAll, F=forTeacher, G=forGradeTeam, H=forStudents, I=forParents
    const [dateRaw, description, type, note, forAllRaw, forTeacherRaw, forGradeTeamRaw, forStudentsRaw, forParentsRaw] = cols

    if (!dateRaw?.trim() || !description?.trim()) continue
    const date = parseDate(dateRaw)
    if (!date) continue

    events.push({
      date,
      description: description.trim(),
      type: type?.trim() || null,
      note: note?.trim() || null,
      forAll: parseBool(forAllRaw),
      forTeacher: parseBool(forTeacherRaw),
      forGradeTeam: parseBool(forGradeTeamRaw),
      forStudents: parseBool(forStudentsRaw),
      forParents: parseBool(forParentsRaw),
    })
  }

  // Replace all events atomically
  await prisma.$transaction([
    prisma.calendarEvent.deleteMany(),
    prisma.calendarEvent.createMany({ data: events }),
  ])

  return NextResponse.json({ synced: events.length })
}
