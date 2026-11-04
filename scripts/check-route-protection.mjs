#!/usr/bin/env node
// Build-time guard against the exact bug class behind the Nov 2026 incident:
// /lessons/[id]/present had no role check anywhere — not in middleware, not
// in the APIs underneath it — so any signed-in student who loaded the URL
// got full teacher presenter control. The APIs were the deciding factor
// (the page itself just renders whatever the API hands it), so this script
// audits every WRITE-method (POST/PUT/PATCH/DELETE) handler under app/api
// for *some* form of real auth, and fails the build if it finds a route
// with neither a recognizable role check nor an explicit, justified entry
// in route-protection-allowlist.json.
//
// This is a heuristic text scan, not a type-aware analyzer — it can be
// fooled by sufficiently unusual code, but it was built to catch exactly
// the two shapes of gap this incident actually had: a handler that never
// calls getServerSession at all (CRITICAL — not even "signed in" is
// required), and one that calls it but never checks `role` or an
// equivalent helper (WARN — any signed-in user, any role, can call it).
//
// Run directly: node scripts/check-route-protection.mjs
// Wired into `npm run build` as a prebuild step so a new unprotected
// mutating route fails the deploy instead of shipping silently.

import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..")
const API_DIR = join(ROOT, "app", "api")
const ALLOWLIST_PATH = join(ROOT, "scripts", "route-protection-allowlist.json")

const WRITE_METHODS = ["POST", "PUT", "PATCH", "DELETE"]

// Alternative, equally-legitimate auth mechanisms this app actually uses —
// a route gated by one of these doesn't need a NextAuth role check too.
const ALT_AUTH_PATTERN = /CRON_SECRET|x-cron-secret|Bearer\s|widgetToken|verifySlackSignature|X-Hub-Signature/i

// A role check, inline or via a named helper this codebase actually uses
// for that purpose (grep for new helper names here as they're added).
const ROLE_CHECK_PATTERN =
  /\brole\s*(!==|===|==|!=)|\.role\s*(!==|===|==|!=)|isTeacherRole\s*\(|isTeacher\s*\(|requireTeacher|requireAdmin|requireSession\s*\(|requireTeacherClassId\s*\(|ctx\.isAdmin\b|isOwner\s*\(/

function findRouteFiles(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) findRouteFiles(full, out)
    else if (entry === "route.ts" || entry === "route.js") out.push(full)
  }
  return out
}

function urlPathFor(file) {
  const rel = relative(API_DIR, file).replace(/\\/g, "/").replace(/\/route\.(ts|js)$/, "")
  return "/api/" + rel
}

function splitByMethod(content) {
  const re = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g
  const hits = []
  let m
  while ((m = re.exec(content))) hits.push({ method: m[1], start: m.index })
  const chunks = []
  for (let i = 0; i < hits.length; i++) {
    const end = i + 1 < hits.length ? hits[i + 1].start : content.length
    chunks.push({ method: hits[i].method, body: content.slice(hits[i].start, end) })
  }
  return chunks
}

function loadAllowlist() {
  try {
    const raw = JSON.parse(readFileSync(ALLOWLIST_PATH, "utf8"))
    const map = new Map()
    for (const entry of raw) map.set(`${entry.method} ${entry.path}`, entry.reason)
    return map
  } catch {
    return new Map()
  }
}

function main() {
  const allowlist = loadAllowlist()
  const files = findRouteFiles(API_DIR)
  const findings = []

  for (const file of files) {
    const content = readFileSync(file, "utf8")
    const urlPath = urlPathFor(file)
    const chunks = splitByMethod(content)

    for (const { method, body } of chunks) {
      if (!WRITE_METHODS.includes(method)) continue
      const key = `${method} ${urlPath}`
      if (allowlist.has(key)) continue

      const hasAltAuth = ALT_AUTH_PATTERN.test(body)
      if (hasAltAuth) continue

      // A role-check helper (requireTeacherClassId(), requireSession(), …)
      // implies a session check too — they all fetch the session internally
      // before ever looking at role, so a route that delegates to one is
      // fully covered even though the literal string "getServerSession("
      // never appears in the handler's own body text.
      const hasRoleCheck = ROLE_CHECK_PATTERN.test(body)
      if (hasRoleCheck) continue

      const hasSession = /getServerSession\s*\(/.test(body)
      if (!hasSession) {
        findings.push({ level: "CRITICAL", key, file: relative(ROOT, file), detail: "no getServerSession() call (or known auth helper) at all — open to anyone, including signed-out requests" })
      } else {
        findings.push({ level: "WARN", key, file: relative(ROOT, file), detail: "signed-in required, but no role check found — open to any signed-in role" })
      }
    }
  }

  if (findings.length === 0) {
    console.log("✓ check-route-protection: no unprotected write-method API routes found.")
    return
  }

  console.error(`\n✗ check-route-protection: ${findings.length} write-method route(s) have no recognizable auth check and aren't in the allowlist:\n`)
  for (const f of findings) {
    console.error(`  [${f.level}] ${f.key}`)
    console.error(`    ${f.file}`)
    console.error(`    ${f.detail}`)
  }
  console.error(`
Fix one of two ways:
  1. Add the missing check (getServerSession + a role comparison, or a
     helper matching ROLE_CHECK_PATTERN in scripts/check-route-protection.mjs).
  2. If this route is genuinely meant to be open to any signed-in user (or
     anyone at all) by design, add it to scripts/route-protection-allowlist.json
     with a one-line "reason" explaining why — that's a deliberate decision
     on record, not a silent gap.
`)
  process.exit(1)
}

main()
