import { ALLOWED_CATEGORIES, CATEGORY_KEYWORDS, AllowedCategory } from "./whitelist"

export type FilterResult =
  | { pass: true; category: AllowedCategory }
  | { pass: false; reason: string }

// Words that indicate a question is NOT school-related
const OFF_TOPIC_KEYWORDS = [
  "מזג אוויר", "מתכון", "ספורט", "כדורגל", "פוליטיקה",
  "weather", "recipe", "sport", "football", "politics",
]

// Layer 1: Does the message belong to an allowed category?
export function checkCategory(message: string): FilterResult {
  const lower = message.toLowerCase()

  // Block clearly off-topic questions
  if (OFF_TOPIC_KEYWORDS.some((kw) => lower.includes(kw))) {
    return { pass: false, reason: "הנושא אינו קשור לבית הספר" }
  }

  // Try to match a specific category
  for (const category of ALLOWED_CATEGORIES) {
    const keywords = CATEGORY_KEYWORDS[category]
    if (keywords.some((kw) => lower.includes(kw))) {
      return { pass: true, category }
    }
  }

  // Default: pass all other questions to Claude with all data
  return { pass: true, category: "אירועים" }
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

  return { pass: true, category: "ציונים" } // category unused here
}
