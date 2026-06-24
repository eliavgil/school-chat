import { google } from "googleapis"

export const SHEET_ID = "1fo8pKLjhM0nmzl5moG5YEL-RJH-6J7udWoXtwIQ5RKU"

export function getSheetsClient() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON env var is not set")

  const creds = JSON.parse(raw)
  const auth = new google.auth.GoogleAuth({
    credentials: creds,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  })
  return google.sheets({ version: "v4", auth })
}

// Returns all values from a named sheet range
export async function fetchSheet(sheetName: string): Promise<string[][]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: sheetName,
  })
  return (res.data.values ?? []) as string[][]
}

// Returns list of all sheet tabs: { title, sheetId }
export async function listSheets() {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets.properties",
  })
  return (res.data.sheets ?? []).map((s: any) => ({
    title: s.properties.title as string,
    sheetId: s.properties.sheetId as number,
  }))
}

export function cell(row: string[], col: number): string {
  return (row[col] ?? "").trim()
}

export function parseDateHe(raw: string): Date | null {
  const clean = raw.trim().replace(/\//g, ".")
  const parts = clean.split(".")
  if (parts.length !== 3) return null
  const [d, m, y] = parts.map(Number)
  if (!d || !m || !y) return null
  const year = y < 100 ? 2000 + y : y
  const date = new Date(Date.UTC(year, m - 1, d))
  return isNaN(date.getTime()) ? null : date
}

export function parseBool(raw: string | undefined): boolean {
  return (raw ?? "").trim().toUpperCase() === "TRUE"
}
