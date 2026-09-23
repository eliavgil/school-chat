"use client"

import { useEffect, useState } from "react"

export type MascotState = "idle" | "thinking" | "confused" | "talking"

const THINKING_VARIANTS = ["scratch", "spin-eyes", "dizzy", "steam", "watch", "brow", "jump", "dance", "wiggle"] as const
type ThinkingVariant = (typeof THINKING_VARIANTS)[number]

// מיסטר פקפקובי — an old tin-toy robot: oversized round head on a tiny body,
// one expressive camera-lens eye instead of two (reads as "device," not
// "person," and is far easier to animate for personality than a face).
// Copper/brass palette instead of the sleek AI-orb look every chatbot
// defaults to. All animation is plain CSS keyframes scoped to this file —
// no Lottie assets available, so this is drawn and rigged entirely in SVG.
export default function RobotMascot({ state = "idle", size = 160 }: { state?: MascotState; size?: number }) {
  const [thinkingVariant, setThinkingVariant] = useState<ThinkingVariant>("scratch")

  useEffect(() => {
    if (state === "thinking") {
      setThinkingVariant(THINKING_VARIANTS[Math.floor(Math.random() * THINKING_VARIANTS.length)])
    }
  }, [state])

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
            <stop offset="0%" stopColor="#FFE8B8" />
            <stop offset="45%" stopColor="#FFD37A" />
            <stop offset="100%" stopColor="#B8791F" />
          </radialGradient>
          <linearGradient id="rm-body-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#D4924F" />
            <stop offset="100%" stopColor="#9C5A2E" />
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
        <text className="rm-qmark" x="152" y="38" fontSize="26" fontWeight="700" fill="#FFD37A" fontFamily="system-ui">?</text>

        <g className="rm-bob">
          {/* body */}
          <g className="rm-arm-left">
            <path d="M62 150 Q40 158 36 178" stroke="#9C5A2E" strokeWidth="9" fill="none" strokeLinecap="round" />
            <circle cx="35" cy="181" r="8" fill="#C9793F" stroke="#8B4F2A" strokeWidth="2" />
          </g>
          <g className="rm-arm-right">
            <path d="M138 150 Q160 158 164 178" stroke="#9C5A2E" strokeWidth="9" fill="none" strokeLinecap="round" />
            <circle cx="165" cy="181" r="8" fill="#C9793F" stroke="#8B4F2A" strokeWidth="2" />
          </g>

          <rect x="68" y="140" width="64" height="56" rx="14" fill="url(#rm-body-grad)" stroke="#7A4523" strokeWidth="2.5" />
          <circle cx="100" cy="166" r="9" fill="#6FCF97" opacity="0.9" />
          <circle cx="100" cy="166" r="4" fill="#2E7D53" />
          <rect x="80" y="184" width="14" height="6" rx="3" fill="#7A4523" opacity="0.6" />
          <rect x="106" y="184" width="14" height="6" rx="3" fill="#7A4523" opacity="0.6" />

          {/* neck */}
          <rect x="88" y="128" width="24" height="18" rx="6" fill="#8B4F2A" />

          {/* head */}
          <g className="rm-head">
            {/* antenna */}
            <g className="rm-antenna">
              <path d="M118 40 Q132 18 126 4" stroke="#8B4F2A" strokeWidth="6" fill="none" strokeLinecap="round" />
              <circle cx="126" cy="4" r="7" fill="#6FCF97" stroke="#2E7D53" strokeWidth="2" />
            </g>

            <circle cx="100" cy="82" r="72" fill="url(#rm-head-grad)" stroke="#7A4523" strokeWidth="3" />
            {/* rivets */}
            <circle cx="46" cy="55" r="3.2" fill="#7A4523" opacity="0.55" />
            <circle cx="154" cy="55" r="3.2" fill="#7A4523" opacity="0.55" />
            <circle cx="38" cy="90" r="3.2" fill="#7A4523" opacity="0.55" />
            <circle cx="162" cy="90" r="3.2" fill="#7A4523" opacity="0.55" />

            {/* ear discs */}
            <circle cx="30" cy="82" r="10" fill="#B8703B" stroke="#7A4523" strokeWidth="2" />
            <circle cx="170" cy="82" r="10" fill="#B8703B" stroke="#7A4523" strokeWidth="2" />

            {/* eye housing */}
            <circle cx="100" cy="88" r="42" fill="#3A2517" />
            <circle cx="100" cy="88" r="37" fill="#1C130B" />
            <g className="rm-eye">
              <circle cx="100" cy="88" r="30" fill="url(#rm-eye-grad)" />
              <circle className="rm-pupil" cx="100" cy="88" r="12" fill="#3A2211" />
              <circle cx="94" cy="80" r="4.5" fill="#FFF7E6" opacity="0.85" />
            </g>
            {/* eyelid for blinking */}
            <rect className="rm-eyelid" x="58" y="46" width="84" height="0" fill="#C9793F" />

            {/* mouth */}
            <rect className="rm-mouth" x="78" y="122" width="44" height="8" rx="4" fill="#6FCF97" opacity="0.9" />
          </g>
        </g>
      </svg>

      <style jsx>{`
        .rm-root { position: relative; display: inline-block; }
        .rm-bob { transform-origin: 100px 196px; animation: rm-bob 3.2s ease-in-out infinite; }
        .rm-head { transform-origin: 100px 128px; }
        .rm-eye { transform-origin: 100px 88px; }
        .rm-pupil { transform-origin: 100px 88px; }
        .rm-antenna { transform-origin: 118px 40px; animation: rm-antenna-sway 2.6s ease-in-out infinite; }
        .rm-eyelid { transform-origin: 100px 46px; }
        .rm-arm-left, .rm-arm-right { transform-origin: 62px 150px; }
        .rm-arm-right { transform-origin: 138px 150px; }
        .rm-steam circle { fill: #cfe8ff; opacity: 0; }
        .rm-qmark { opacity: 0; transform-origin: 152px 30px; }
        .rm-shadow { transform-origin: 100px 205px; }

        @keyframes rm-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes rm-antenna-sway { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(4deg); } }
        @keyframes rm-blink { 0%, 88%, 100% { height: 0; } 92%, 96% { height: 84px; } }

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
