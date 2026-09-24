"use client"

import { useEffect, useState } from "react"

export type MascotState = "idle" | "talking" | "thinking"

// The three "thinking" poses — each is its own AI-generated image (see
// public/mascot/*.png), not a CSS-only variation like the old hand-drawn
// SVG had. The character's body language itself (steam from overthinking,
// impatiently waiting under a floating hourglass, meditating) already
// carries most of the personality, so each only needs a light CSS
// animation layered on top to sell the motion, not a full pose change.
const POSES = ["steam", "waiting", "meditation"] as const
type Pose = (typeof POSES)[number]

// מיסטר פקפקובי — a friendly robotic wizard, bronze/copper mechanical face
// under a blue-grey hooded robe with a stylized silver beard and a small
// glowing staff. Rendered as AI-generated character art (not hand-drawn
// SVG) per the user's own reference images, background-removed to real
// transparent PNGs. One image per pose; CSS handles the motion on top.
export default function RobotMascot({ state = "idle", size = 160 }: { state?: MascotState; size?: number }) {
  const [pose, setPose] = useState<Pose>("steam")

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

        /* steam: overheating from thinking too hard — a tight, straining
           vibration with an occasional bigger wobble, plus a brightness
           pulse suggesting the steam is puffing */
        .rm-pose-steam .rm-img { animation: rm-steam-shake 0.22s ease-in-out infinite, rm-steam-glow 1.4s ease-in-out infinite; transform-origin: 50% 100%; }
        @keyframes rm-steam-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(-0.6%, 0) rotate(-0.8deg); }
          50% { transform: translate(0.6%, -0.3%) rotate(0.6deg); }
          75% { transform: translate(-0.3%, 0) rotate(-0.5deg); }
        }
        @keyframes rm-steam-glow { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.12); } }

        /* waiting: impatient side-to-side weight shift under the floating
           hourglass, brisk pace */
        .rm-pose-waiting .rm-img { animation: rm-waiting 1s ease-in-out infinite; transform-origin: 50% 100%; }
        @keyframes rm-waiting {
          0%, 100% { transform: rotate(0deg) translateX(0); }
          25% { transform: rotate(-4deg) translateX(-1.5%); }
          75% { transform: rotate(4deg) translateX(1.5%); }
        }

        /* meditation: slow, calm breathing — minimal, gentle motion */
        .rm-pose-meditation .rm-img { animation: rm-meditate 4s ease-in-out infinite; }
        @keyframes rm-meditate { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-1.5%) scale(1.015); } }
        .rm-pose-meditation .rm-shadow { animation: rm-meditate-shadow 4s ease-in-out infinite; }
        @keyframes rm-meditate-shadow { 0%, 100% { opacity: 1; } 50% { opacity: 0.75; } }

        @media (prefers-reduced-motion: reduce) {
          .rm-root * { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
