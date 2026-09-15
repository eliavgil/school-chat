// Talks to Mashov's internal (undocumented) API the same way the school's
// own web portal does. Credentials come from env vars only, never from a
// request body.
//
// The login endpoint (POST /api/login) does NOT require a CSRF cookie to be
// primed first, despite the old Python script fetching the homepage before
// logging in — verified directly: a request with zero cookies still gets
// validated against `semel` (403 for an unrecognized school code) and then
// credentials (401 "NotAuthenticated" for a wrong username/password), so it
// clearly reaches real auth logic without any cookie/CSRF priming.

const BASE_URL = "https://web.mashov.info/api"

function currentSchoolYear(): number {
  // Mashov labels a school year by the calendar year it ENDS in — e.g.
  // Sept 2026–June 2027 (תשפ"ז) is "2027" on the login page's year picker,
  // not "2026". So from September onward we're already in next calendar
  // year's label; before that (Jan–Aug) the label matches the current year.
  const now = new Date()
  return now.getMonth() >= 8 ? now.getFullYear() + 1 : now.getFullYear()
}

function parseCookies(setCookieHeaders: string[]): Record<string, string> {
  const jar: Record<string, string> = {}
  for (const line of setCookieHeaders) {
    const [pair] = line.split(";")
    const eq = pair.indexOf("=")
    if (eq === -1) continue
    jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim()
  }
  return jar
}

function cookieHeaderFrom(jar: Record<string, string>): string {
  return Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ")
}

function getSetCookies(res: Response): string[] {
  const anyHeaders = res.headers as any
  if (typeof anyHeaders.getSetCookie === "function") return anyHeaders.getSetCookie()
  const raw = res.headers.get("set-cookie")
  return raw ? [raw] : []
}

export interface MashovSession {
  cookieHeader: string
  csrfToken: string
}

const BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"

export async function mashovLogin(): Promise<
  { ok: true; session: MashovSession } | { ok: false; error: string; debug?: Record<string, unknown> }
> {
  const semel = process.env.MASHOV_SEMEL
  const username = process.env.MASHOV_USERNAME
  const password = process.env.MASHOV_PASSWORD
  const year = process.env.MASHOV_YEAR ? Number(process.env.MASHOV_YEAR) : currentSchoolYear()

  if (!semel || !username || !password) {
    return { ok: false, error: "MASHOV_SEMEL / MASHOV_USERNAME / MASHOV_PASSWORD not set" }
  }

  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": BROWSER_UA,
      "Origin": "https://web.mashov.info",
      "Referer": "https://web.mashov.info/",
    },
    body: JSON.stringify({
      semel: Number(semel),
      year,
      username,
      password,
      appName: "info.mashov.web",
      appVersion: "3.20231115",
    }),
  })

  const reason = loginRes.headers.get("reason")

  if (!loginRes.ok) {
    const text = await loginRes.text().catch(() => "")
    let hint = "Unrecognized failure — see status/reason above."
    if (loginRes.status === 403) {
      hint = "semel (school code) not recognized by Mashov — double-check MASHOV_SEMEL."
    } else if (loginRes.status === 401 && reason === "NotAuthenticated") {
      hint = "semel is valid, but username/password were rejected — double-check MASHOV_USERNAME and MASHOV_PASSWORD (and that this login has portal access, not just app access)."
    } else if (loginRes.status === 404) {
      hint = "Request body missing a required field — this is a bug in the request shape, not credentials."
    }
    return {
      ok: false,
      error: `Login failed: ${loginRes.status} (${reason ?? "no reason header"}) — ${text.slice(0, 300)}`,
      debug: { year, semel, status: loginRes.status, reason, hint },
    }
  }

  const jar = parseCookies(getSetCookies(loginRes))
  const csrfToken = jar["Csrf-Token"] || jar["csrf-token"] || ""

  return { ok: true, session: { cookieHeader: cookieHeaderFrom(jar), csrfToken } }
}

export async function mashovGet(session: MashovSession, path: string): Promise<{ status: number; data: unknown }> {
  const res = await fetch(`${BASE_URL}/${path.replace(/^\//, "")}`, {
    headers: {
      "Cookie": session.cookieHeader,
      "X-Csrf-Token": session.csrfToken,
      "Accept": "application/json",
      "User-Agent": BROWSER_UA,
      "Referer": "https://web.mashov.info/",
    },
  })
  let data: unknown = null
  try { data = await res.json() } catch { /* non-JSON response */ }
  return { status: res.status, data }
}
