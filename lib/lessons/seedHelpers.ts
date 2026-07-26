import type { Slide } from "./types"

// Seed routes overwrite a lesson's whole `slides` array from hardcoded
// content every time they run. Media fields, though, are routinely added by
// hand in the editor after seeding (per AGENTS.md's media-only guidance) and
// only ever live in the database — never in the seed source. Re-seeding
// (including via /api/seed/all) would otherwise silently wipe them out.
// This carries those fields forward from the existing DB slide (matched by
// id) whenever the new/seeded slide doesn't itself specify a value.
export function preserveManualMedia(newSlides: Slide[], oldSlides: Slide[] | null | undefined): Slide[] {
  if (!oldSlides || oldSlides.length === 0) return newSlides
  const oldById = new Map(oldSlides.map(s => [s.id, s]))

  return newSlides.map(slide => {
    const old = oldById.get(slide.id)
    if (!old) return slide

    const merged = { ...slide }
    if (!merged.image_url && old.image_url) merged.image_url = old.image_url
    if ((!merged.images || merged.images.length === 0) && old.images && old.images.length > 0) merged.images = old.images
    if (!merged.youtube_url && old.youtube_url) merged.youtube_url = old.youtube_url
    if (!merged.link_url && old.link_url) merged.link_url = old.link_url
    if (!merged.audio_url && old.audio_url) merged.audio_url = old.audio_url
    return merged
  })
}
