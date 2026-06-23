"use client"

export interface BgOption {
  id: string
  label: string
  emoji: string
  url: string
  thumbUrl: string
  overlay: string
  // which CSS animation overlay to apply
  anim: "light-rays" | "stars" | "mist" | "shimmer" | "heat" | "snow" | "leaves"
  kbFrom: string
  kbTo: string
}

export const BG_OPTIONS: BgOption[] = [
  {
    id: "mountains-sunset",
    label: "הרים שקיעה",
    emoji: "🏔️",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75",
    overlay: "from-black/50 via-black/20 to-black/60",
    anim: "light-rays",
    kbFrom: "scale(1.1) translate(1%, 1%)",
    kbTo: "scale(1.0) translate(-1%, -1%)",
  },
  {
    id: "starry-night",
    label: "שמיים כוכבים",
    emoji: "🌌",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&q=75",
    overlay: "from-black/60 via-black/30 to-black/70",
    anim: "stars",
    kbFrom: "scale(1.06) translate(0%, 1%)",
    kbTo: "scale(1.12) translate(-1%, -1%)",
  },
  {
    id: "tropical-forest",
    label: "יער טרופי",
    emoji: "🌿",
    url: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=600&q=75",
    overlay: "from-black/55 via-black/15 to-black/65",
    anim: "mist",
    kbFrom: "scale(1.08) translate(-1%, 0%)",
    kbTo: "scale(1.02) translate(1%, 1%)",
  },
  {
    id: "ocean-waves",
    label: "אוקיינוס",
    emoji: "🌊",
    url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=600&q=75",
    overlay: "from-black/50 via-black/20 to-black/60",
    anim: "shimmer",
    kbFrom: "scale(1.1) translate(1%, -1%)",
    kbTo: "scale(1.03) translate(-1%, 1%)",
  },
  {
    id: "desert-dunes",
    label: "מדבר חולות",
    emoji: "🏜️",
    url: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=75",
    overlay: "from-black/45 via-black/15 to-black/55",
    anim: "heat",
    kbFrom: "scale(1.08) translate(-1%, 1%)",
    kbTo: "scale(1.13) translate(1%, -1%)",
  },
  {
    id: "snowy-peaks",
    label: "הרי שלג",
    emoji: "❄️",
    url: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1491555103944-7c647fd857e6?w=600&q=75",
    overlay: "from-black/45 via-black/15 to-black/55",
    anim: "snow",
    kbFrom: "scale(1.1) translate(0%, 1%)",
    kbTo: "scale(1.03) translate(-1%, -1%)",
  },
  {
    id: "autumn-forest",
    label: "יער סתיו",
    emoji: "🍂",
    url: "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=1600&q=85",
    thumbUrl: "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?w=600&q=75",
    overlay: "from-black/50 via-black/20 to-black/65",
    anim: "leaves",
    kbFrom: "scale(1.1) translate(1%, 0%)",
    kbTo: "scale(1.03) translate(-1%, 1%)",
  },
]

export const ROLE_DEFAULTS: Record<string, string> = {
  student: "mountains-sunset",
  teacher: "starry-night",
  parent:  "tropical-forest",
}

// ── Overlay animations per scene type ────────────────────
function AnimOverlay({ anim }: { anim: BgOption["anim"] }) {
  if (anim === "stars") return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
      {[...Array(18)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{
            width: i % 3 === 0 ? 2 : 1.5,
            height: i % 3 === 0 ? 2 : 1.5,
            left: `${(i * 37 + 11) % 100}%`,
            top: `${(i * 53 + 7) % 60}%`,
            opacity: 0.6 + (i % 4) * 0.1,
            animation: `star-twinkle ${2 + (i % 4)}s ${(i * 0.7) % 5}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  )

  if (anim === "light-rays") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="absolute top-0 bottom-0 opacity-0"
          style={{
            left: `${15 + i * 22}%`,
            width: `${4 + i * 2}%`,
            background: "linear-gradient(to bottom, rgba(255,200,100,0.12), transparent)",
            animation: `light-ray ${6 + i * 2}s ${i * 1.5}s ease-in-out infinite`,
            transformOrigin: "top center",
          }}
        />
      ))}
    </div>
  )

  if (anim === "mist") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="absolute"
          style={{
            bottom: `${10 + i * 12}%`,
            left: "-20%",
            right: "-20%",
            height: `${8 + i * 3}%`,
            background: "rgba(255,255,255,0.06)",
            borderRadius: "50%",
            filter: "blur(20px)",
            animation: `mist-drift ${12 + i * 4}s ${i * 3}s ease-in-out infinite alternate`,
          }}
        />
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
            left: `${20 + i * 25}%`,
            width: "30%",
            height: "40%",
            background: "radial-gradient(ellipse, rgba(255,150,50,0.05) 0%, transparent 70%)",
            animation: `heat-shimmer ${3 + i}s ${i * 0.8}s ease-in-out infinite alternate`,
          }}
        />
      ))}
    </div>
  )

  if (anim === "snow") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[...Array(20)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white"
          style={{
            width: 1 + (i % 3),
            height: 1 + (i % 3),
            left: `${(i * 41 + 5) % 100}%`,
            top: "-2%",
            opacity: 0.5 + (i % 3) * 0.15,
            animation: `snow-fall ${5 + (i % 5)}s ${(i * 0.6) % 6}s linear infinite`,
          }}
        />
      ))}
    </div>
  )

  if (anim === "leaves") return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="absolute text-base"
          style={{
            left: `${(i * 43 + 5) % 100}%`,
            top: "-5%",
            fontSize: 8 + (i % 3) * 4,
            opacity: 0.7,
            animation: `leaf-fall ${6 + (i % 4)}s ${i * 0.9}s ease-in-out infinite`,
          }}>
          {i % 2 === 0 ? "🍂" : "🍁"}
        </div>
      ))}
    </div>
  )

  return null
}

interface Props { bgId?: string }

export function NatureBackground({ bgId }: Props) {
  const bg = BG_OPTIONS.find(b => b.id === bgId) ?? BG_OPTIONS[0]

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
      <AnimOverlay anim={bg.anim} />
      <div className={`absolute inset-0 bg-gradient-to-b ${bg.overlay}`} style={{ zIndex: 2 }} />
    </div>
  )
}
