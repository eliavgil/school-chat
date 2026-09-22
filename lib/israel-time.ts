// Converts a "YYYY-MM-DDTHH:mm" wall-clock string — what an
// <input type="datetime-local"> sends from a browser set to Israel time —
// into the correct UTC Date instant. Needed because the server runs in
// UTC: `new Date("2026-09-25T14:30")` is parsed as 14:30 UTC (the ECMAScript
// date-time form with no zone designator is local-to-the-runtime, and the
// runtime's "local" is UTC on Vercel), 2-3 hours off from the 14:30 Israel
// time the user actually picked, depending on DST. Same bug class as the
// widget's schedule endpoint fixed earlier — see app/api/widget/schedule.
export function israelLocalToUtc(dateTimeLocal: string): Date {
  const [datePart, timePart] = dateTimeLocal.split("T")
  const [y, m, d] = datePart.split("-").map(Number)
  const [hh, mm] = (timePart ?? "00:00").split(":").map(Number)
  const naiveUtc = new Date(Date.UTC(y, m - 1, d, hh, mm))
  const offsetName = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jerusalem",
    timeZoneName: "shortOffset",
  }).formatToParts(naiveUtc).find(p => p.type === "timeZoneName")?.value ?? "GMT+3"
  const match = offsetName.match(/GMT([+-]\d+)/)
  const offsetHours = match ? parseInt(match[1], 10) : 3
  return new Date(naiveUtc.getTime() - offsetHours * 60 * 60 * 1000)
}
