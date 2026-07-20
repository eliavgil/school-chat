import { createClient } from "@supabase/supabase-js"

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ""
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

// Server-side admin client — bypasses RLS (use in API routes / Server Components)
export function adminClient() {
  if (!url || !svc) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  return createClient(url, svc, { auth: { persistSession: false } })
}

// Browser client — RLS applies (use in "use client" components)
// Singleton so Realtime channels are shared across re-renders
let _browser: ReturnType<typeof createClient> | null = null
export function browserClient() {
  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
  if (!_browser) _browser = createClient(url, anon)
  return _browser
}
