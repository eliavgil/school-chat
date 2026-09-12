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

// Returns all values from a named range in an arbitrary spreadsheet (not
// just this app's own SHEET_ID) — used for reading one-off sheets a teacher
// links in, like a survey's response sheet.
export async function fetchSheetValues(spreadsheetId: string, range: string): Promise<string[][]> {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range })
  return (res.data.values ?? []) as string[][]
}

// Returns list of all tabs in an arbitrary spreadsheet: { title, sheetId }
export async function listSheetTabs(spreadsheetId: string) {
  const sheets = getSheetsClient()
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets.properties",
  })
  return (res.data.sheets ?? []).map((s: any) => ({
    title: s.properties.title as string,
    sheetId: s.properties.sheetId as number,
  }))
}

// Returns all values from a named sheet range in this app's own spreadsheet.
export async function fetchSheet(sheetName: string): Promise<string[][]> {
  return fetchSheetValues(SHEET_ID, sheetName)
}

// Returns list of all sheet tabs in this app's own spreadsheet.
export async function listSheets() {
  return listSheetTabs(SHEET_ID)
}

// The service account's own address — share a restricted (non-public)
// sheet with exactly this email to let the app read it, instead of
// exposing it to "anyone with the link".
export function getServiceAccountEmail(): string | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  try {
    return JSON.parse(raw).client_email ?? null
  } catch {
    return null
  }
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
