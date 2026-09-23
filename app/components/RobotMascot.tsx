"use client"

import { useEffect, useState } from "react"

export type MascotState = "idle" | "talking" | "thinking"

// The three "thinking" poses — each is its own AI-generated image (see
// public/mascot/*.png), not a CSS-only variation like the old hand-drawn
// SVG had. The character's body language itself (slouched/bored,
// clutching-head/frantic, arms-up/excited) already carries most of the
// personality, so each only needs a light CSS animation layered on top to
// sell the motion, not a full pose change.
const POSES = ["jump", "bored", "frantic"] as const
type Pose = (typeof POSES)[number]

// מיסטר פקפקובי — a friendly robotic wizard, bronze/copper mechanical face
// under a blue-grey hooded robe with a stylized silver beard and a small
// glowing staff. Rendered as AI-generated character art (not hand-drawn
// SVG) per the user's own reference images, background-removed to real
// transparent PNGs. One image per pose; CSS handles the motion on top.
export default function RobotMascot({ state = "idle", size = 160 }: { state?: MascotState; size?: number }) {
  const [pose, setPose] = useState<Pose>("jump")

  useEffect(() => {
    if (state === "thinking") {
      setPose(POSES[Math.floor(Math.random() * POSES.length)])
    }
  }, [state])

  const src = state === "thinking" ? `/mascot/${pose}.png` : "/mascot/idle.png"
  const poseClass = state === "thinking" ? `rm-pose-${pose}` : ""

  return (
    <div className={`rm-root rm-${state} ${poseClass}`} style={{ width: size, height: size }} aria-hidden="true">
      <div className="rm-shadow" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="rm-img" draggable={false} />

      <style jsx>{`
        .rm-root { position: relative; display: inline-block; }
        .rm-img { position: relative; z-index: 1; width: 100%; height: 100%; object-fit: contain; user-select: none; -webkit-user-drag: none; }
        .rm-shadow {
          position: absolute; left: 50%; bottom: 2%; width: 42%; height: 6%;
          transform: translateX(-50%);
          background: radial-gradient(ellipse at center, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0) 75%);
          border-radius: 50%;
        }

        /* idle: gentle breathing bob */
        .rm-idle .rm-img { animation: rm-bob 3.2s ease-in-out infinite; }
        @keyframes rm-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3%); } }

        /* talking: a soft glow/scale pulse standing in for mouth movement
           (there's no separate mouth-open frame to swap to) */
        .rm-talking .rm-img { animation: rm-talk-pulse 0.6s ease-in-out infinite; }
        @keyframes rm-talk-pulse { 0%, 100% { transform: scale(1); filter: brightness(1); } 50% { transform: scale(1.02); filter: brightness(1.1); } }

        /* jump: bouncy hop, shadow squashes on landing */
        .rm-pose-jump .rm-img { animation: rm-jump 0.7s ease-in-out infinite; }
        @keyframes rm-jump {
          0%, 100% { transform: translateY(0) scaleY(1); }
          15% { transform: translateY(2%) scaleY(0.95); }
          45% { transform: translateY(-14%) scaleY(1.03); }
          75% { transform: translateY(2%) scaleY(0.95); }
        }
        .rm-pose-jump .rm-shadow { animation: rm-shadow-squash 0.7s ease-in-out infinite; }
        @keyframes rm-shadow-squash { 0%, 100% { transform: translateX(-50%) scale(1); opacity: 1; } 45% { transform: translateX(-50%) scale(0.55); opacity: 0.5; } }

        /* bored: slow, exaggerated sigh-like sway */
        .rm-pose-bored .rm-img { animation: rm-bored 2.8s ease-in-out infinite; transform-origin: 50% 100%; }
        @keyframes rm-bored {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(-3deg) scale(0.985); }
        }

        /* frantic: quick anxious jitter */
        .rm-pose-frantic .rm-img { animation: rm-frantic 0.18s ease-in-out infinite; }
        @keyframes rm-frantic {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-1.5%, -1%) rotate(-2deg); }
          50% { transform: translate(1.5%, 0.5%) rotate(1.5deg); }
          75% { transform: translate(-1%, 1%) rotate(-1deg); }
        }

        @media (prefers-reduced-motion: reduce) {
          .rm-root * { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
