"use client"

import { useEffect, useState } from "react"
import { NatureBackground } from "./NatureBackground"
import { getPersonalBackground } from "./personalStore"

export default function GlobalBackground() {
  const [bgId, setBgId] = useState("")

  useEffect(() => {
    setBgId(getPersonalBackground())
    const handler = (e: Event) => setBgId((e as CustomEvent).detail ?? getPersonalBackground())
    window.addEventListener("bg-changed", handler)
    return () => window.removeEventListener("bg-changed", handler)
  }, [])

  return (
    <div className="fixed -z-10" style={{ top: 0, right: 0, left: 0, bottom: "calc(-1 * env(safe-area-inset-bottom, 0px))" }}>
      <NatureBackground bgId={bgId} />
    </div>
  )
}
