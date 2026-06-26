// Personal per-user storage (localStorage) — changes are local only

export interface PersonalEvent {
  id: string
  date: string
  description: string
  createdAt: string
}

export interface PersonalScheduleNote {
  id: string
  dayHeb: string
  period: string
  note: string
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// ── Events ───────────────────────────────────────────────
export function getPersonalEvents(): PersonalEvent[] {
  try { return JSON.parse(localStorage.getItem("personal-events") ?? "[]") } catch { return [] }
}
export function addPersonalEvent(date: string, description: string): PersonalEvent {
  const ev: PersonalEvent = { id: uid(), date, description, createdAt: new Date().toISOString() }
  const all = getPersonalEvents()
  all.push(ev)
  all.sort((a, b) => a.date.localeCompare(b.date))
  localStorage.setItem("personal-events", JSON.stringify(all))
  return ev
}
export function updatePersonalEvent(id: string, description: string) {
  const all = getPersonalEvents().map(e => e.id === id ? { ...e, description } : e)
  localStorage.setItem("personal-events", JSON.stringify(all))
}
export function deletePersonalEvent(id: string) {
  localStorage.setItem("personal-events", JSON.stringify(getPersonalEvents().filter(e => e.id !== id)))
}

// ── Schedule notes ────────────────────────────────────────
export function getPersonalScheduleNotes(): PersonalScheduleNote[] {
  try { return JSON.parse(localStorage.getItem("personal-schedule-notes") ?? "[]") } catch { return [] }
}
export function addPersonalScheduleNote(dayHeb: string, period: string, note: string): PersonalScheduleNote {
  const item: PersonalScheduleNote = { id: uid(), dayHeb, period, note }
  const all = getPersonalScheduleNotes()
  localStorage.setItem("personal-schedule-notes", JSON.stringify([...all, item]))
  return item
}
export function updatePersonalScheduleNote(id: string, note: string) {
  const all = getPersonalScheduleNotes().map(n => n.id === id ? { ...n, note } : n)
  localStorage.setItem("personal-schedule-notes", JSON.stringify(all))
}
export function deletePersonalScheduleNote(id: string) {
  localStorage.setItem("personal-schedule-notes", JSON.stringify(getPersonalScheduleNotes().filter(n => n.id !== id)))
}

// ── Display name ──────────────────────────────────────────
export function getPersonalDisplayName(): string {
  return localStorage.getItem("personal-display-name") ?? ""
}
export function setPersonalDisplayName(name: string) {
  localStorage.setItem("personal-display-name", name)
}

// ── Background ────────────────────────────────────────────
export function getPersonalBackground(): string {
  return localStorage.getItem("personal-background") ?? ""
}
export function setPersonalBackground(id: string) {
  localStorage.setItem("personal-background", id)
}

// ── Custom background image (stored as data URL) ──────────
export function getCustomBgUrl(): string {
  return localStorage.getItem("personal-bg-custom-url") ?? ""
}
export function setCustomBgUrl(dataUrl: string) {
  localStorage.setItem("personal-bg-custom-url", dataUrl)
}

// ── Quote categories ───────────────────────────────────────
import type { QuoteCategory } from "@/lib/quotes"
const DEFAULT_QUOTE_CATS: QuoteCategory[] = ["חינוך", "הומור", "הידעת"]
export function getQuoteCategories(): QuoteCategory[] {
  try {
    const stored = localStorage.getItem("quote-categories")
    if (!stored) return DEFAULT_QUOTE_CATS
    return JSON.parse(stored)
  } catch { return DEFAULT_QUOTE_CATS }
}
export function setQuoteCategories(cats: QuoteCategory[]) {
  localStorage.setItem("quote-categories", JSON.stringify(cats))
}
