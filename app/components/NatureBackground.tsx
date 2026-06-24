"use client"

export interface BgOption {
  id: string
  label: string
  emoji: string
  type: "photo" | "animated" | "solid"
  // photo only
  url?: string
  thumbUrl?: string
  anim?: "light-rays" | "stars" | "mist" | "shimmer" | "heat" | "snow" | "leaves" | "bubbles" | "rain" | "fireflies" | "aurora"
  kbFrom?: string
  kbTo?: string
  overlay?: string
  // solid only
  solidColor?: string
  // animated only — CSS gradient background
  gradientCss?: string
  gradientAnim?: string  // keyframe name
}

// ── Photos ────────────────────────────────────────────────────────────────────
const PHOTO_OPTIONS: BgOption[] = [
  {
    id: "mountains-sunset", label: "הרים שקיעה", emoji: "🏔️", type: "photo",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=70",
    overlay: "from-black/50 via-black/20 to-black/60", anim: "light-rays",
    kbFrom: "scale(1.1) translate(1%, 1%)", kbTo: "scale(1.0) translate(-1%, -1%)",
  },
  {
    id: "starry-night", label: "שמיים כוכבים", emoji: "🌌", type: "photo",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&q=70",
    overlay: "from-black/60 via-black/30 to-black/70", anim: "stars",
    kbFrom: "scale(1.06) translate(0%, 1%)", kbTo: "scale(1.12) translate(-1%, -1%)",
  },
  {
    id: "tropical-forest", label: "יער טרופי", emoji: "🌿", type: "photo",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=70",
    overlay: "from-black/55 via-black/15 to-black/65", anim: "mist",
    kbFrom: "scale(1.08) translate(-1%, 0%)", kbTo: "scale(1.02) translate(1%, 1%)",
  },
  {
    id: "ocean-waves", label: "אוקיינוס", emoji: "🌊", type: "photo",
    url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=70",
    overlay: "from-black/50 via-black/20 to-black/60", anim: "shimmer",
    kbFrom: "scale(1.1) translate(1%, -1%)", kbTo: "scale(1.03) translate(-1%, 1%)",
  },
  {
    id: "desert-dunes", label: "מדבר חולות", emoji: "🏜️", type: "photo",
    url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&q=70",
    overlay: "from-black/45 via-black/15 to-black/55", anim: "heat",
    kbFrom: "scale(1.08) translate(-1%, 1%)", kbTo: "scale(1.13) translate(1%, -1%)",
  },
  {
    id: "snowy-peaks", label: "הרי שלג", emoji: "❄️", type: "photo",
    url: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=400&q=70",
    overlay: "from-black/45 via-black/15 to-black/55", anim: "snow",
    kbFrom: "scale(1.1) translate(0%, 1%)", kbTo: "scale(1.03) translate(-1%, -1%)",
  },
  {
    id: "autumn-forest", label: "יער סתיו", emoji: "🍂", type: "photo",
    url: "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=400&q=70",
    overlay: "from-black/50 via-black/20 to-black/65", anim: "leaves",
    kbFrom: "scale(1.1) translate(1%, 0%)", kbTo: "scale(1.03) translate(-1%, 1%)",
  },
  {
    id: "cherry-blossom", label: "פריחת דובדבן", emoji: "🌸", type: "photo",
    url: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&q=70",
    overlay: "from-black/45 via-black/10 to-black/55", anim: "bubbles",
    kbFrom: "scale(1.08) translate(0%, 1%)", kbTo: "scale(1.02) translate(1%, -1%)",
  },
  {
    id: "city-night", label: "עיר בלילה", emoji: "🌃", type: "photo",
    url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&q=70",
    overlay: "from-black/55 via-black/20 to-black/65", anim: "rain",
    kbFrom: "scale(1.06) translate(-1%, 0%)", kbTo: "scale(1.1) translate(1%, -1%)",
  },
]

// ── Animated (CSS only) ───────────────────────────────────────────────────────
const ANIMATED_OPTIONS: BgOption[] = [
  {
    id: "aurora", label: "זוהר צפוני", emoji: "🌈", type: "animated",
    anim: "aurora",
    gradientCss: "linear-gradient(135deg, #0a0a2e, #0d3b1e, #1a0a2e)",
    gradientAnim: "aurora-shift",
    thumbUrl: "",
  },
  {
    id: "sunset-gradient", label: "שקיעה", emoji: "🌅", type: "animated",
    anim: "shimmer",
    gradientCss: "linear-gradient(160deg, #1a0533, #7b2d00, #c45c00, #1a0533)",
    gradientAnim: "sunset-pulse",
    thumbUrl: "",
  },
  {
    id: "deep-ocean", label: "ים עמוק", emoji: "🐋", type: "animated",
    anim: "bubbles",
    gradientCss: "linear-gradient(180deg, #000d1a, #001a33, #002244, #001a33)",
    gradientAnim: "ocean-pulse",
    thumbUrl: "",
  },
  {
    id: "galaxy", label: "גלקסיה", emoji: "🌀", type: "animated",
    anim: "stars",
    gradientCss: "linear-gradient(135deg, #0a001a, #1a0033, #000d26, #0a001a)",
    gradientAnim: "galaxy-spin",
    thumbUrl: "",
  },
]

// ── Solid colors ──────────────────────────────────────────────────────────────
const SOLID_OPTIONS: BgOption[] = [
  { id: "solid-navy",   label: "כחול כהה",   emoji: "🔵", type: "solid", solidColor: "#0f172a" },
  { id: "solid-forest", label: "ירוק יער",   emoji: "🟢", type: "solid", solidColor: "#14532d" },
  { id: "solid-purple", label: "סגול עמוק",  emoji: "🟣", type: "solid", solidColor: "#3b0764" },
  { id: "solid-stone",  label: "אפור חם",    emoji: "⚫", type: "solid", solidColor: "#292524" },
]

export const BG_OPTIONS: BgOption[] = [
  ...PHOTO_OPTIONS,
  ...ANIMATED_OPTIONS,
  ...SOLID_OPTIONS,
]

export const ROLE_DEFAULTS: Record<string, string> = {
  student: "mountains-sunset",
  teacher: "starry-night",
  parent:  "tropical-forest",
}

// ── Animation overlays ────────────────────────────────────────────────────────
function AnimOverlay({ anim }: { anim: BgOption["anim"] }) {
  if (anim === "stars") return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {[...Array(18)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{
            width: i % 3 === 0 ? 2 : 1.5, height: i % 3 === 0 ? 2 : 1.5,
            left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 60}%`,
            opacity: 0.6 + (i % 4) * 0.1,
            animation: `star-twinkle ${2 + (i % 4)}s ${(i * 0.7) % 5}s ease-in-out infinite`,
          }} />
      ))}
    </div>
  )

  if (anim === "aurora") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="absolute"
          style={{
            top: `${10 + i * 15}%`, left: "-10%", right: "-10%",
            height: "25%",
            background: [
              "linear-gradient(90deg, transparent, rgba(0,255,128,0.08), rgba(100,0,255,0.06), transparent)",
              "linear-gradient(90deg, transparent, rgba(0,200,255,0.07), rgba(0,255,100,0.05), transparent)",
              "linear-gradient(90deg, transparent, rgba(150,0,255,0.06), rgba(0,255,180,0.04), transparent)",
            ][i],
            filter: "blur(15px)",
            animation: `aurora-wave ${8 + i * 3}s ${i * 2}s ease-in-out infinite alternate`,
          }} />
      ))}
    </div>
  )

  if (anim === "bubbles") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[...Array(10)].map((_, i) => (
        <div key={i} className="absolute rounded-full border border-white/10"
          style={{
            width: 4 + (i % 4) * 3, height: 4 + (i % 4) * 3,
            left: `${(i * 37 + 5) % 95}%`,
            bottom: "-5%",
            opacity: 0.3 + (i % 3) * 0.1,
            animation: `bubble-rise ${6 + (i % 5)}s ${i * 0.8}s ease-in infinite`,
          }} />
      ))}
    </div>
  )

  if (anim === "rain") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute bg-white/10"
          style={{
            width: 1, height: 8 + (i % 4) * 4,
            left: `${(i * 41 + 3) % 100}%`,
            top: "-5%",
            borderRadius: 1,
            animation: `rain-fall ${0.6 + (i % 5) * 0.2}s ${(i * 0.15) % 1}s linear infinite`,
          }} />
      ))}
    </div>
  )

  if (anim === "light-rays") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="absolute top-0 bottom-0 opacity-0"
          style={{
            left: `${15 + i * 22}%`, width: `${4 + i * 2}%`,
            background: "linear-gradient(to bottom, rgba(255,200,100,0.12), transparent)",
            animation: `light-ray ${6 + i * 2}s ${i * 1.5}s ease-in-out infinite`,
            transformOrigin: "top center",
          }} />
      ))}
    </div>
  )

  if (anim === "mist") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="absolute"
          style={{
            bottom: `${10 + i * 12}%`, left: "-20%", right: "-20%",
            height: `${8 + i * 3}%`,
            background: "rgba(255,255,255,0.06)", borderRadius: "50%",
            filter: "blur(20px)",
            animation: `mist-drift ${12 + i * 4}s ${i * 3}s ease-in-out infinite alternate`,
          }} />
      ))}
    </div>
  )

  if (anim === "shimmer") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      <div className="absolute inset-0" style={{
        background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)",
        animation: "shimmer-wave 4s ease-in-out infinite",
        backgroundSize: "200% 200%",
      }} />
    </div>
  )

  if (anim === "heat") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="absolute bottom-0"
          style={{
            left: `${20 + i * 25}%`, width: "30%", height: "40%",
            background: "radial-gradient(ellipse, rgba(255,150,50,0.05) 0%, transparent 70%)",
            animation: `heat-shimmer ${3 + i}s ${i * 0.8}s ease-in-out infinite alternate`,
          }} />
      ))}
    </div>
  )

  if (anim === "snow") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{
            width: 1 + (i % 3), height: 1 + (i % 3),
            left: `${(i * 41 + 5) % 100}%`, top: "-2%",
            opacity: 0.5 + (i % 3) * 0.15,
            animation: `snow-fall ${5 + (i % 5)}s ${(i * 0.6) % 6}s linear infinite`,
          }} />
      ))}
    </div>
  )

  if (anim === "leaves") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute"
          style={{
            left: `${(i * 43 + 5) % 100}%`, top: "-5%",
            fontSize: 8 + (i % 3) * 4, opacity: 0.7,
            animation: `leaf-fall ${6 + (i % 4)}s ${i * 0.9}s ease-in-out infinite`,
          }}>
          {i % 2 === 0 ? "🍂" : "🍁"}
        </div>
      ))}
    </div>
  )

  if (anim === "fireflies") return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {[...Array(12)].map((_, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: 3, height: 3,
            left: `${(i * 53 + 7) % 90}%`, top: `${(i * 37 + 20) % 75}%`,
            background: "rgba(180,255,100,0.9)",
            boxShadow: "0 0 6px 2px rgba(180,255,100,0.4)",
            animation: `firefly ${3 + (i % 4)}s ${i * 0.5}s ease-in-out infinite`,
          }} />
      ))}
    </div>
  )

  return null
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props { bgId?: string; customUrl?: string }

export function NatureBackground({ bgId, customUrl }: Props) {
  // Custom uploaded image
  if (bgId === "custom" && customUrl) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <img src={customUrl} alt="" className="absolute inset-0 w-full h-full object-cover"
          style={{ animation: "kb-zoom 22s ease-in-out infinite alternate", "--kb-from": "scale(1.05)", "--kb-to": "scale(1.0)" } as React.CSSProperties} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/50" style={{ zIndex: 2 }} />
      </div>
    )
  }

  const bg = BG_OPTIONS.find(b => b.id === bgId) ?? BG_OPTIONS[0]

  // Solid color
  if (bg.type === "solid") {
    return (
      <div className="absolute inset-0" style={{ background: bg.solidColor }} />
    )
  }

  // Animated CSS gradient
  if (bg.type === "animated") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0"
          style={{
            background: bg.gradientCss,
            backgroundSize: "400% 400%",
            animation: `${bg.gradientAnim} 12s ease infinite`,
          }} />
        {bg.anim && <AnimOverlay anim={bg.anim} />}
        <div className="absolute inset-0 bg-black/20" style={{ zIndex: 2 }} />
      </div>
    )
  }

  // Photo
  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        key={bg.id}
        src={bg.url}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          animation: "kb-zoom 22s ease-in-out infinite alternate",
          "--kb-from": bg.kbFrom,
          "--kb-to": bg.kbTo,
        } as React.CSSProperties}
      />
      {bg.anim && <AnimOverlay anim={bg.anim} />}
      <div className={`absolute inset-0 bg-gradient-to-b ${bg.overlay}`} style={{ zIndex: 2 }} />
    </div>
  )
}
