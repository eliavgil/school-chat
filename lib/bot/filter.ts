import { ALLOWED_CATEGORIES, CATEGORY_KEYWORDS, AllowedCategory } from "./whitelist"

export type FilterResult =
  | { pass: true; category: AllowedCategory }
  | { pass: false; reason: string }

// Layer 1: Does the message belong to an allowed category?
export function checkCategory(message: string): FilterResult {
  const lower = message.toLowerCase()

  for (const category of ALLOWED_CATEGORIES) {
    const keywords = CATEGORY_KEYWORDS[category]
    if (keywords.some((kw) => lower.includes(kw))) {
      return { pass: true, category }
    }
  }

  return {
    pass: false,
    reason: "הנושא אינו ברשימת הנושאים המותרים למענה אוטומטי",
  }
}

// Layer 2: Is the question clear enough to answer confidently?
// This is called after Claude responds — we check if Claude flagged uncertainty.
export function checkConfidence(claudeResponse: string): FilterResult {
  const uncertaintyMarkers = [
    "לא ברור",
    "לא בטוח",
    "אינני יודע",
    "לא נמצא",
    "לא קיים",
    "לא זמין",
    "לא מוגדר",
    "אין מידע",
    "uncertain",
    "unclear",
    "not found",
    "no data",
  ]

  const lower = claudeResponse.toLowerCase()
  const foundMarker = uncertaintyMarkers.find((m) => lower.includes(m))

  if (foundMarker) {
    return {
      pass: false,
      reason: `הבוט זיהה אי-ודאות בתשובה (${foundMarker})`,
    }
  }

  return { pass: true, category: "attendance" } // category unused here
}
