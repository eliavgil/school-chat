// Talks to Mashov's internal (undocumented) API the same way the school's
// own web portal does — mirrors scripts/mashov/fetch.py's login flow, just
// in TypeScript so it can run as a Vercel serverless route instead of
// requiring a local Python setup. Credentials come from env vars only,
// never from a request body.

const BASE_URL = "https://web.mashov.info/api"

function currentSchoolYear(): number {
  const now = new Date()
  return now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1
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
  // Node's fetch (undici) exposes getSetCookie() for multi-value headers;
  // fall back to the single combined header on runtimes without it.
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

  // Mashov requires a CSRF cookie to exist before login — fetch the app
  // shell first, same as the Python script does. A realistic User-Agent and
  // Origin/Referer are included since a server-to-server request without
  // them can get rejected by anti-bot checks even with correct credentials.
  const homeRes = await fetch("https://web.mashov.info", {
    redirect: "follow",
    headers: { "User-Agent": BROWSER_UA },
  })
  let jar = parseCookies(getSetCookies(homeRes))
  const initialCsrf = jar["Csrf-Token"] || jar["csrf-token"] || ""

  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Csrf-Token": initialCsrf,
      "Cookie": cookieHeaderFrom(jar),
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

  if (!loginRes.ok) {
    const text = await loginRes.text().catch(() => "")
    return {
      ok: false,
      error: `Login failed: ${loginRes.status} — ${text.slice(0, 300)}`,
      debug: {
        year,
        semel,
        homeStatus: homeRes.status,
        cookieNamesFromHome: Object.keys(jar),
        csrfFoundBeforeLogin: !!initialCsrf,
      },
    }
  }

  const newCookies = parseCookies(getSetCookies(loginRes))
  jar = { ...jar, ...newCookies }
  const csrfToken = jar["Csrf-Token"] || jar["csrf-token"] || initialCsrf

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
