// A rough icon guess from a Google Drive/Docs URL's shape — shared between
// any page that lists manually-added Drive links (team files, study
// materials, ...).
export function driveIconFor(url: string): string {
  if (/\/folders\//.test(url)) return "📁"
  if (/spreadsheets/.test(url)) return "📊"
  if (/document/.test(url)) return "📄"
  if (/presentation/.test(url)) return "📽️"
  if (/forms/.test(url)) return "📋"
  return "🔗"
}
