export const ANIMATION_REGISTRY: Record<string, { label: string; emoji: string }> = {
  elephant: { label: "פיל", emoji: "🐘" },
  dog: { label: "כלב", emoji: "🐶" },
  turkey: { label: "הודו", emoji: "🦃" },
  bird: { label: "ציפור", emoji: "🐦" },
  totoro: { label: "טוטורו", emoji: "🌿" },
  robot: { label: "רובוט", emoji: "🤖" },
  giraffe: { label: "ג'ירפה", emoji: "🦒" },
}

export const ANIMATION_DELAYS = [
  { value: 0,   label: "מיד" },
  { value: 30,  label: "30 שניות" },
  { value: 60,  label: "דקה" },
  { value: 120, label: "2 דקות" },
  { value: 180, label: "3 דקות" },
]
