"use client"

import { useEffect, useState } from "react"

export type MascotState = "idle" | "thinking" | "confused" | "talking"

const THINKING_VARIANTS = ["scratch", "spin-eyes", "dizzy", "steam", "watch", "brow", "jump", "dance", "wiggle"] as const
type ThinkingVariant = (typeof THINKING_VARIANTS)[number]

// The subset of thinking variants that move the whole body, not just an
// eye/arm/antenna — for the large full-screen "thinking" moment, where a
// subtle head-tilt would just look like a bigger static image with no
// visible motion. The small inline indicator still samples from the full
// pool above.
export const BIG_THINKING_VARIANTS: readonly ThinkingVariant[] = ["jump", "dance", "wiggle"]

// מיסטר פקפקובי — a friendly robotic wizard: a bronze/copper mechanical
// face (kept from the original tin-toy design) under a soft blue-grey
// wizard's hood, with a stylized silver beard and a small glowing staff in
// place of an antenna. One expressive camera-lens eye behind round
// spectacles instead of two (reads as "device," not "person," and is far
// easier to animate for personality than a face). All animation is plain
// CSS keyframes scoped to this file — no Lottie assets available, so this
// is drawn and rigged entirely in SVG.
export default function RobotMascot({
  state = "idle", size = 160, variantPool = THINKING_VARIANTS,
}: { state?: MascotState; size?: number; variantPool?: readonly ThinkingVariant[] }) {
  const [thinkingVariant, setThinkingVariant] = useState<ThinkingVariant>("scratch")

  useEffect(() => {
    if (state === "thinking") {
      setThinkingVariant(variantPool[Math.floor(Math.random() * variantPool.length)])
    }
  }, [state, variantPool])

  return (
    <div
      className={`rm-root rm-${state} rm-think-${thinkingVariant}`}
      style={{ width: size, height: size * 1.08 }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 216" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="rm-head-grad" cx="38%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#E8A868" />
            <stop offset="55%" stopColor="#C9793F" />
            <stop offset="100%" stopColor="#9C5A2E" />
          </radialGradient>
          <radialGradient id="rm-eye-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#EAF6FF" />
            <stop offset="45%" stopColor="#7EC8F2" />
            <stop offset="100%" stopColor="#1C6FA8" />
          </radialGradient>
          <linearGradient id="rm-robe-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5C6E93" />
            <stop offset="100%" stopColor="#31384E" />
          </linearGradient>
          <linearGradient id="rm-beard-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F0EEE9" />
            <stop offset="100%" stopColor="#BDB8AC" />
          </linearGradient>
        </defs>

        {/* soft ground shadow */}
        <ellipse className="rm-shadow" cx="100" cy="205" rx="42" ry="7" fill="#000" opacity="0.18" />

        {/* steam puffs (only visible in "steam" thinking variant) */}
        <g className="rm-steam">
          <circle cx="150" cy="55" r="4" />
          <circle cx="158" cy="42" r="5" />
          <circle cx="152" cy="28" r="6" />
        </g>

        {/* floating question mark (confused state only) */}
        <text className="rm-qmark" x="152" y="38" fontSize="26" fontWeight="700" fill="#7EC8F2" fontFamily="system-ui">?</text>

        <g className="rm-bob">
          {/* arms */}
          <g className="rm-arm-left">
            <path d="M66 148 Q44 156 40 178" stroke="url(#rm-robe-grad)" strokeWidth="10" fill="none" strokeLinecap="round" />
            <circle cx="39" cy="181" r="8" fill="url(#rm-head-grad)" stroke="#7A4523" strokeWidth="2" />
          </g>
          <g className="rm-arm-right">
            <path d="M134 148 Q156 156 160 178" stroke="url(#rm-robe-grad)" strokeWidth="10" fill="none" strokeLinecap="round" />
            <circle cx="161" cy="181" r="8" fill="url(#rm-head-grad)" stroke="#7A4523" strokeWidth="2" />
          </g>

          {/* robe body */}
          <path d="M76 140 Q68 162 60 196 L140 196 Q132 162 124 140 Z" fill="url(#rm-robe-grad)" stroke="#242A3D" strokeWidth="2.5" />
          {/* chest emblem — soft glow */}
          <circle cx="100" cy="166" r="11" fill="#3FA9F5" opacity="0.22" />
          <circle cx="100" cy="166" r="7" fill="url(#rm-eye-grad)" />
          <circle cx="100" cy="166" r="3" fill="#EAF6FF" opacity="0.9" />
          {/* feet, peeking from the hem */}
          <rect x="72" y="195" width="16" height="7" rx="3.5" fill="url(#rm-head-grad)" stroke="#7A4523" strokeWidth="1.5" />
          <rect x="112" y="195" width="16" height="7" rx="3.5" fill="url(#rm-head-grad)" stroke="#7A4523" strokeWidth="1.5" />

          {/* neck */}
          <rect x="88" y="128" width="24" height="18" rx="6" fill="#8B4F2A" />

          {/* head + hood */}
          <g className="rm-head">
            {/* staff (was a plain antenna) */}
            <g className="rm-antenna">
              <path d="M114 38 Q128 14 122 2" stroke="#8B4F2A" strokeWidth="5" fill="none" strokeLinecap="round" />
              <circle cx="122" cy="2" r="9" fill="#3FA9F5" opacity="0.28" />
              <circle cx="122" cy="2" r="5.5" fill="url(#rm-eye-grad)" stroke="#EAF6FF" strokeWidth="1" />
            </g>

            {/* wizard hood, behind the face */}
            <path d="M100 4 C56 4 26 44 26 84 C26 102 33 115 44 124 L156 124 C167 115 174 102 174 84 C174 44 144 4 100 4 Z"
              fill="url(#rm-robe-grad)" stroke="#242A3D" strokeWidth="3" />

            {/* face */}
            <circle cx="100" cy="82" r="62" fill="url(#rm-head-grad)" stroke="#7A4523" strokeWidth="3" />
            {/* rivets */}
            <circle cx="72" cy="32" r="3" fill="#7A4523" opacity="0.5" />
            <circle cx="128" cy="32" r="3" fill="#7A4523" opacity="0.5" />

            {/* spectacles + eye — sized and raised to leave room for the
                mouth/beard below, unlike the original bigger-headed robot
                where the eye could fill most of the face */}
            <circle cx="100" cy="80" r="36" fill="#3A2517" />
            <circle cx="100" cy="80" r="31" fill="#1C130B" />
            <circle cx="100" cy="80" r="28.5" fill="none" stroke="#B8703B" strokeWidth="2.2" opacity="0.6" />
            <g className="rm-eye">
              <circle cx="100" cy="80" r="25" fill="url(#rm-eye-grad)" />
              <circle className="rm-pupil" cx="100" cy="80" r="10" fill="#0E3854" />
              <circle cx="95" cy="73" r="4" fill="#FFFFFF" opacity="0.9" />
            </g>
            {/* eyelid for blinking */}
            <rect className="rm-eyelid" x="64" y="44" width="72" height="0" fill="#C9793F" />

            {/* mouth (drawn before the beard so the beard's top wisps can
                overlap its edges slightly, the way facial hair naturally
                frames a mouth) */}
            <rect className="rm-mouth" x="82" y="116" width="36" height="7" rx="3.5" fill="#3FA9F5" opacity="0.85" />

            {/* beard */}
            <path d="M56 118 Q56 138 63 149 Q71 140 79 150 Q87 138 96 152 Q105 138 113 150 Q121 140 129 149 Q136 138 136 118 Q100 130 56 118 Z"
              fill="url(#rm-beard-grad)" stroke="#A19C90" strokeWidth="1.5" opacity="0.94" />
          </g>
        </g>
      </svg>

      <style jsx>{`
        .rm-root { position: relative; display: inline-block; }
        .rm-bob { transform-origin: 100px 196px; animation: rm-bob 3.2s ease-in-out infinite; }
        .rm-head { transform-origin: 100px 128px; }
        .rm-eye { transform-origin: 100px 80px; }
        .rm-pupil { transform-origin: 100px 80px; }
        .rm-antenna { transform-origin: 114px 38px; animation: rm-antenna-sway 2.6s ease-in-out infinite; }
        .rm-eyelid { transform-origin: 100px 44px; }
        .rm-arm-left, .rm-arm-right { transform-origin: 66px 148px; }
        .rm-arm-right { transform-origin: 134px 148px; }
        .rm-steam circle { fill: #cfe8ff; opacity: 0; }
        .rm-qmark { opacity: 0; transform-origin: 152px 30px; }
        .rm-shadow { transform-origin: 100px 205px; }

        @keyframes rm-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes rm-antenna-sway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(4deg); } }
        @keyframes rm-blink { 0%, 88%, 100% { height: 0; } 92%, 96% { height: 72px; } }

        /* idle: gentle blink loop */
        .rm-idle .rm-eyelid { animation: rm-blink 4.5s ease-in-out infinite; }

        /* talking: mouth LED pulses */
        .rm-talking .rm-mouth { animation: rm-talk 0.5s ease-in-out infinite; }
        @keyframes rm-talk { 0%, 100% { transform: scaleY(1); opacity: 0.9; } 50% { transform: scaleY(1.8); opacity: 1; } }

        /* confused: droopy antenna, narrowed eye, flat mouth, question mark bobs in */
        .rm-confused .rm-antenna { animation: none; transform: rotate(-14deg); }
        .rm-confused .rm-eye { transform: scaleY(0.55) translateY(14px); }
        .rm-confused .rm-mouth { transform: scaleX(0.6) rotate(-6deg); }
        .rm-confused .rm-qmark { animation: rm-qmark-in 1.8s ease-in-out infinite; }
        @keyframes rm-qmark-in { 0%, 100% { opacity: 0; transform: translateY(4px); } 50% { opacity: 1; transform: translateY(-6px); } }

        /* thinking: base head tilt, then one randomized variant layered on top */
        .rm-thinking .rm-bob { animation-duration: 1.6s; }

        .rm-think-scratch .rm-arm-left { animation: rm-scratch 1s ease-in-out infinite; }
        @keyframes rm-scratch { 0%, 100% { transform: rotate(0deg); } 30% { transform: rotate(-55deg) translate(6px,-10px); } 60% { transform: rotate(-40deg) translate(6px,-10px); } }
        .rm-think-scratch .rm-antenna { animation: rm-antenna-sway 0.5s ease-in-out infinite; }

        .rm-think-spin-eyes .rm-pupil { animation: rm-spin 0.7s linear infinite; }
        @keyframes rm-spin { from { transform: rotate(0deg) translateX(10px) rotate(0deg); } to { transform: rotate(360deg) translateX(10px) rotate(-360deg); } }

        .rm-think-dizzy .rm-head { animation: rm-dizzy 1.1s ease-in-out infinite; }
        @keyframes rm-dizzy { 0%, 100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
        .rm-think-dizzy .rm-eyelid { animation: rm-blink 1.4s ease-in-out infinite; }

        .rm-think-steam .rm-steam circle { animation: rm-steam 1.8s ease-out infinite; }
        .rm-think-steam .rm-steam circle:nth-child(2) { animation-delay: 0.3s; }
        .rm-think-steam .rm-steam circle:nth-child(3) { animation-delay: 0.6s; }
        @keyframes rm-steam { 0% { opacity: 0; transform: translateY(0) scale(0.6); } 30% { opacity: 0.85; } 100% { opacity: 0; transform: translateY(-22px) scale(1.3); } }

        .rm-think-watch .rm-arm-right { animation: rm-watch 1.8s ease-in-out infinite; }
        @keyframes rm-watch { 0%, 20%, 100% { transform: rotate(0deg); } 35%, 75% { transform: rotate(-95deg) translate(-4px,-14px); } }

        .rm-think-brow .rm-antenna { animation: rm-brow 0.9s ease-in-out infinite; }
        @keyframes rm-brow { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-22deg) translateY(-3px); } }
        .rm-think-brow .rm-mouth { animation: rm-smirk 0.9s ease-in-out infinite; }
        @keyframes rm-smirk { 0%, 100% { transform: skewX(0deg); } 50% { transform: skewX(-8deg) translateX(4px); } }

        /* jump: whole body leaps with a squash-and-stretch, shadow squeezes on landing */
        .rm-think-jump .rm-bob { animation: rm-jump 0.7s ease-in-out infinite; }
        @keyframes rm-jump {
          0%, 100% { transform: translateY(0) scaleY(1); }
          15% { transform: translateY(5px) scaleY(0.9); }
          45% { transform: translateY(-30px) scaleY(1.08); }
          75% { transform: translateY(5px) scaleY(0.9); }
        }
        .rm-think-jump .rm-shadow { animation: rm-shadow-squash 0.7s ease-in-out infinite; }
        @keyframes rm-shadow-squash { 0%, 100% { transform: scale(1); opacity: 0.18; } 45% { transform: scale(0.55); opacity: 0.08; } }
        .rm-think-jump .rm-arm-left { animation: rm-jump-arm-l 0.7s ease-in-out infinite; }
        .rm-think-jump .rm-arm-right { animation: rm-jump-arm-r 0.7s ease-in-out infinite; }
        @keyframes rm-jump-arm-l { 45% { transform: rotate(-50deg) translate(4px,-8px); } }
        @keyframes rm-jump-arm-r { 45% { transform: rotate(50deg) translate(-4px,-8px); } }

        /* dance: hips sway side to side with a matching arm swing */
        .rm-think-dance .rm-bob { animation: rm-dance 0.55s ease-in-out infinite; }
        @keyframes rm-dance {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-9px) rotate(-7deg); }
          75% { transform: translateX(9px) rotate(7deg); }
        }
        .rm-think-dance .rm-arm-left { animation: rm-dance-arm-l 0.55s ease-in-out infinite; }
        .rm-think-dance .rm-arm-right { animation: rm-dance-arm-r 0.55s ease-in-out infinite; }
        @keyframes rm-dance-arm-l { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-38deg) translate(5px,-6px); } }
        @keyframes rm-dance-arm-r { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(38deg) translate(-5px,-6px); } }
        .rm-think-dance .rm-antenna { animation: rm-antenna-sway 0.4s ease-in-out infinite; }

        /* wiggle: a full comedic shimmy — rock side to side with a pulse */
        .rm-think-wiggle .rm-bob { animation: rm-wiggle 0.32s ease-in-out infinite; }
        @keyframes rm-wiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-11deg) scale(1.03); }
          75% { transform: rotate(11deg) scale(1.03); }
        }
        .rm-think-wiggle .rm-antenna { animation: rm-antenna-sway 0.3s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .rm-root * { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
