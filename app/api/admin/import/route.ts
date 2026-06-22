import { NextRequest, NextResponse } from "next/server"
import { readExcelBuffer } from "@/lib/csv/readExcel"
import {
  importTeachers,
  importGrades,
  importAttendance,
  importSchedule,
  importCalendarRows,
} from "@/lib/csv/importHandlers"

// POST /api/admin/import
// Body: FormData with fields: type, classId?, file? OR sheetUrl?
export async function POST(req: NextRequest) {
  try {
  const formData = await req.formData()
  const type = formData.get("type") as string
  const classId = (formData.get("classId") as string) || "class-y"

  let count = 0

  if (type === "calendar-url" || type === "calendar-url-events") {
    const sheetUrl = formData.get("sheetUrl") as string
    if (!sheetUrl) return NextResponse.json({ error: "sheetUrl required" }, { status: 400 })

    // Fetch Google Sheet as CSV (export URL)
    const csvUrl = sheetUrl.replace(/\/edit.*$/, "/export?format=csv")
    const res = await fetch(csvUrl, { redirect: "follow" })
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch sheet" }, { status: 502 })

    const text = await res.text()
    const rows = text.split("\n").map((line) =>
      line.split(",").map((cell) => cell.replace(/^"|"$/g, "").trim())
    )
    count = await importCalendarRows(rows, sheetUrl)
  } else {
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "file required" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const sheets = readExcelBuffer(buffer)

    switch (type) {
      case "teachers":
        count = await importTeachers(sheets)
        break
      case "grades":
        count = await importGrades(sheets, classId)
        break
      case "attendance":
        count = await importAttendance(sheets, classId)
        break
      case "schedule":
        count = await importSchedule(sheets, classId)
        break
      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 })
    }
  }

  return NextResponse.json({ ok: true, count })
  } catch (err: any) {
    console.error("Import error:", err)
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 })
  }
}
