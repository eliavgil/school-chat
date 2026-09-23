// Shared by the אלפון (student directory) and קבוצות לימוד (study groups)
// one-off imports — both read a Mashov-style export where the real header
// row isn't the first row, and cells can arrive as numbers (ת.ז) that need
// clean string comparison.
export function colIndex(header: string[], label: string): number {
  return header.findIndex(h => (h ?? "").toString().trim() === label)
}

export function cellStr(v: unknown): string {
  if (v === null || v === undefined) return ""
  return String(v).trim()
}
