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
    <div className="fixed inset-0 -z-10">
      <NatureBackground bgId={bgId} />
    </div>
  )
}
