// Animated Thailand beach scene — pure SVG + CSS, no external images
// Three variants: "sunset" (student), "night" (teacher), "tropical" (parent)

type SceneVariant = "sunset" | "night" | "tropical"

// Deterministic pseudo-random for star positions
function pr(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function Stars({ count, variant }: { count: number; variant: SceneVariant }) {
  const baseOp = variant === "night" ? 0.95 : variant === "sunset" ? 0.55 : 0.18
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={pr(i * 3.1) * 390}
          cy={pr(i * 7.3) * 380}
          r={pr(i * 11.7) > 0.72 ? 1.5 : pr(i * 13.1) > 0.5 ? 1.1 : 0.7}
          fill="white"
          style={{
            opacity: baseOp,
            animation: `star-twinkle ${(2 + pr(i * 2.7) * 4).toFixed(1)}s ${(pr(i * 5.9) * 5).toFixed(1)}s ease-in-out infinite`,
          }}
        />
      ))}
    </>
  )
}

interface AnimatedLandscapeProps {
  variant?: SceneVariant
}

export function AnimatedLandscape({ variant = "sunset" }: AnimatedLandscapeProps) {
  const id = variant

  const palette = {
    sunset: {
      skyTop: "#0d0824", skyMid: "#7b1055", skyHorizon: "#d94f1b", skyGlow: "#f7b733",
      oceanA: "#0a4b6e", oceanB: "#0e6fa0", oceanC: "#0c3d5a",
      wave: ["#0a4b6e99", "#0e6fa099", "#0c5a8099"],
      sun: "#f7b733", sunY: 496, sunR: 31, moonMode: false,
      palm: "#180d06", leaf: "#0a2f1a",
      cloudOp: 0.14, starCount: 25,
    },
    night: {
      skyTop: "#010409", skyMid: "#050d1a", skyHorizon: "#0e2044", skyGlow: "#1e3a8a",
      oceanA: "#050e1c", oceanB: "#08111f", oceanC: "#03080f",
      wave: ["#0a1a3388", "#0c2a5088", "#0a204099"],
      sun: "#cde0ff", sunY: 310, sunR: 22, moonMode: true,
      palm: "#050a0f", leaf: "#020d05",
      cloudOp: 0.07, starCount: 60,
    },
    tropical: {
      skyTop: "#052e16", skyMid: "#065f46", skyHorizon: "#059669", skyGlow: "#d1fae5",
      oceanA: "#065f46", oceanB: "#0d9488", oceanC: "#0f766e",
      wave: ["#0d948888", "#0891b299", "#06b6d488"],
      sun: "#fef9c3", sunY: 410, sunR: 28, moonMode: false,
      palm: "#022c22", leaf: "#052e16",
      cloudOp: 0.22, starCount: 4,
    },
  }[variant]

  const sparkleX = [55, 115, 175, 225, 278, 330]

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={palette.skyTop} />
          <stop offset="40%"  stopColor={palette.skyMid} />
          <stop offset="78%"  stopColor={palette.skyHorizon} />
          <stop offset="100%" stopColor={palette.skyGlow} />
        </linearGradient>

        <linearGradient id={`ocean-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={palette.oceanA} />
          <stop offset="50%"  stopColor={palette.oceanB} />
          <stop offset="100%" stopColor={palette.oceanC} />
        </linearGradient>

        <radialGradient id={`sun-glow-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={palette.sun} stopOpacity="1" />
          <stop offset="40%"  stopColor={palette.sun} stopOpacity="0.5" />
          <stop offset="100%" stopColor={palette.sun} stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`shimmer-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={palette.sun} stopOpacity="0.45" />
          <stop offset="100%" stopColor={palette.sun} stopOpacity="0" />
        </linearGradient>

        <filter id={`glow-f-${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <filter id={`halo-${id}`} x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="22" />
        </filter>

        {variant === "night" && (
          <filter id="bio" x="-30%" y="-150%" width="160%" height="400%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        )}
      </defs>

      {/* ── Sky ── */}
      <rect width="390" height="844" fill={`url(#sky-${id})`} />

      {/* Stars */}
      <Stars count={palette.starCount} variant={variant} />

      {/* ── Sun / Moon ── */}
      {/* Diffused halo */}
      <ellipse
        cx="195" cy={palette.sunY + 10}
        rx={palette.moonMode ? 65 : 105}
        ry={palette.moonMode ? 45 : 68}
        fill={`url(#sun-glow-${id})`}
        filter={`url(#halo-${id})`}
        style={{ animation: "sun-breathe 9s ease-in-out infinite" }}
      />
      {/* Disk */}
      <circle
        cx="195" cy={palette.sunY} r={palette.sunR}
        fill={palette.sun}
        filter={`url(#glow-f-${id})`}
        style={{ animation: "sun-float 14s ease-in-out infinite" }}
      />
      {/* Moon craters */}
      {palette.moonMode && (
        <>
          <circle cx="188" cy={palette.sunY - 3} r="4"   fill="rgba(0,0,0,0.18)" />
          <circle cx="201" cy={palette.sunY + 5} r="3"   fill="rgba(0,0,0,0.13)" />
          <circle cx="193" cy={palette.sunY + 11} r="2.2" fill="rgba(0,0,0,0.09)" />
        </>
      )}

      {/* ── Clouds ── */}
      <g opacity={palette.cloudOp}>
        <g style={{ animation: "cloud-drift 22s ease-in-out infinite" }}>
          <ellipse cx="78"  cy="188" rx="62" ry="18" fill="white" />
          <ellipse cx="98"  cy="174" rx="42" ry="17" fill="white" />
          <ellipse cx="55"  cy="177" rx="36" ry="13" fill="white" />
        </g>
        <g style={{ animation: "cloud-drift 18s 3s ease-in-out infinite reverse" }}>
          <ellipse cx="308" cy="232" rx="72" ry="22" fill="white" />
          <ellipse cx="286" cy="216" rx="48" ry="19" fill="white" />
          <ellipse cx="336" cy="220" rx="42" ry="15" fill="white" />
        </g>
        <g style={{ animation: "cloud-drift 27s 9s ease-in-out infinite" }}>
          <ellipse cx="200" cy="148" rx="52" ry="15" fill="white" />
          <ellipse cx="220" cy="136" rx="32" ry="13" fill="white" />
          <ellipse cx="178" cy="138" rx="28" ry="11" fill="white" />
        </g>
      </g>

      {/* ── Ocean ── */}
      <rect x="0" y="500" width="390" height="344" fill={`url(#ocean-${id})`} />

      {/* Water reflection column */}
      <rect
        x="150" y="502" width="90" height="280"
        fill={`url(#shimmer-${id})`}
        style={{ animation: "reflection-shimmer 4s ease-in-out infinite" }}
      />

      {/* Far wave */}
      <path
        d="M-60,514 Q0,504 60,514 Q120,524 180,514 Q240,504 300,514 Q360,524 450,514 L450,844 L-60,844 Z"
        fill={palette.wave[0]}
        style={{ animation: "wave-far 7s ease-in-out infinite" }}
      />
      {/* Mid wave */}
      <path
        d="M-40,536 Q30,522 90,536 Q150,550 210,536 Q270,522 330,536 Q390,550 450,536 L450,844 L-40,844 Z"
        fill={palette.wave[1]}
        style={{ animation: "wave-mid 5.5s ease-in-out infinite" }}
      />
      {/* Near wave */}
      <path
        d="M-20,559 Q50,544 115,559 Q180,574 245,559 Q310,544 370,559 Q405,567 450,559 L450,844 L-20,844 Z"
        fill={palette.wave[2]}
        style={{ animation: "wave-near 4.5s ease-in-out infinite" }}
      />
      {/* Foam crest */}
      <path
        d="M0,577 Q65,568 125,577 Q185,586 245,577 Q305,568 365,577 Q382,581 390,577"
        fill="none" stroke="white" strokeWidth="2" opacity="0.2"
        style={{ animation: "wave-far 4.5s ease-in-out infinite" }}
      />

      {/* Bioluminescent wave glow (night only) */}
      {variant === "night" && (
        <>
          <path
            d="M-40,536 Q30,522 90,536 Q150,550 210,536 Q270,522 330,536 Q390,550 450,536"
            fill="none" stroke="#7dd3fc" strokeWidth="2.5" opacity="0.4"
            filter="url(#bio)"
            style={{ animation: "wave-mid 5.5s ease-in-out infinite" }}
          />
          <path
            d="M-20,559 Q50,544 115,559 Q180,574 245,559 Q310,544 370,559 Q405,567 450,559"
            fill="none" stroke="#38bdf8" strokeWidth="2" opacity="0.3"
            filter="url(#bio)"
            style={{ animation: "wave-near 4.5s ease-in-out infinite" }}
          />
        </>
      )}

      {/* Water sparkles */}
      {sparkleX.map((x, i) => (
        <circle
          key={`sp-${i}`}
          cx={x} cy={510 + (i % 3) * 18}
          r="2"
          fill="white"
          style={{ animation: `water-sparkle 3s ${(i * 0.65).toFixed(1)}s ease-in-out infinite` }}
        />
      ))}

      {/* Night fireflies */}
      {variant === "night" && [70, 140, 200, 255, 315].map((x, i) => (
        <circle
          key={`ff-${i}`}
          cx={x} cy={420 + (i % 4) * 22}
          r="2.2"
          fill="#86efac"
          style={{ animation: `water-sparkle 4.5s ${(i * 1.1).toFixed(1)}s ease-in-out infinite` }}
        />
      ))}

      {/* ── Left palm — base at (30, 844) ── */}
      <g style={{ transformOrigin: "30px 844px", animation: "palm-sway-l 7s ease-in-out infinite" }}>
        {/* Trunk */}
        <path
          d="M30,844 Q44,740 52,648 Q58,580 70,518"
          stroke={palette.palm} strokeWidth="13" fill="none"
          strokeLinecap="round"
        />
        {/* Coconuts */}
        <circle cx="73" cy="525" r="7"   fill="#2d1810" />
        <circle cx="66" cy="518" r="6.5" fill="#381f10" />
        <circle cx="74" cy="514" r="5.5" fill="#2d1810" />
        {/* Fronds from tip (70, 518) */}
        <path d="M70,518 Q36,493 -6,482"   stroke={palette.leaf} strokeWidth="6"   fill="none" strokeLinecap="round" />
        <path d="M70,518 Q50,473 26,445"   stroke={palette.leaf} strokeWidth="6"   fill="none" strokeLinecap="round" />
        <path d="M70,518 Q67,462 54,428"   stroke={palette.leaf} strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M70,518 Q84,462 92,426"   stroke={palette.leaf} strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M70,518 Q100,472 122,457" stroke={palette.leaf} strokeWidth="5"   fill="none" strokeLinecap="round" />
        <path d="M70,518 Q108,506 132,504" stroke={palette.leaf} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        {/* Sub-fronds */}
        <path d="M56,500 Q46,487 38,480"  stroke={palette.leaf} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M60,490 Q56,475 51,466"  stroke={palette.leaf} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M72,499 Q83,484 88,473"  stroke={palette.leaf} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* ── Right palm — base at (360, 844) ── */}
      <g style={{ transformOrigin: "360px 844px", animation: "palm-sway-r 8s ease-in-out infinite" }}>
        {/* Trunk */}
        <path
          d="M360,844 Q346,740 338,648 Q332,578 320,518"
          stroke={palette.palm} strokeWidth="13" fill="none"
          strokeLinecap="round"
        />
        {/* Coconuts */}
        <circle cx="317" cy="525" r="7"   fill="#2d1810" />
        <circle cx="324" cy="518" r="6.5" fill="#381f10" />
        <circle cx="316" cy="514" r="5.5" fill="#2d1810" />
        {/* Fronds from tip (320, 518) */}
        <path d="M320,518 Q354,493 396,482"  stroke={palette.leaf} strokeWidth="6"   fill="none" strokeLinecap="round" />
        <path d="M320,518 Q340,473 364,445"  stroke={palette.leaf} strokeWidth="6"   fill="none" strokeLinecap="round" />
        <path d="M320,518 Q323,462 336,428"  stroke={palette.leaf} strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M320,518 Q306,462 298,426"  stroke={palette.leaf} strokeWidth="5.5" fill="none" strokeLinecap="round" />
        <path d="M320,518 Q290,472 268,457"  stroke={palette.leaf} strokeWidth="5"   fill="none" strokeLinecap="round" />
        <path d="M320,518 Q282,506 258,504"  stroke={palette.leaf} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        {/* Sub-fronds */}
        <path d="M334,500 Q344,487 352,480"  stroke={palette.leaf} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M330,490 Q334,475 339,466"  stroke={palette.leaf} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
        <path d="M318,499 Q307,484 302,473"  stroke={palette.leaf} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
      </g>

      {/* ── Birds (daytime) ── */}
      {variant !== "night" && (
        <g opacity="0.55" style={{ animation: "birds-soar 18s linear infinite" }}>
          <path d="M0,358 Q5,353 10,358"  stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M14,351 Q19,346 24,351" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M30,360 Q35,355 40,360" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}
