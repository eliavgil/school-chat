import * as XLSX from "xlsx"

export interface SheetData {
  name: string
  rows: (string | number | null)[][]
}

export function readExcelBuffer(buffer: Buffer): SheetData[] {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true })
  return wb.SheetNames.map((name) => {
    const ws = wb.Sheets[name]
    const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, {
      header: 1,
      defval: null,
      raw: false,
    })
    return { name, rows: rows as (string | number | null)[][] }
  })
}

export function cellStr(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return ""
  return String(val).trim()
}
