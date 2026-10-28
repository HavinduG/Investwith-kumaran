"use client"

import { useEffect, useRef, useSyncExternalStore } from "react"
import dynamic from "next/dynamic"
import { useReducedMotion } from "framer-motion"

import { useTheme } from "@/components/theme/theme-provider"

const SkylineScene = dynamic(() => import("./skyline-scene"), { ssr: false })

let webglSupport: boolean | undefined

function supportsWebGL() {
  if (webglSupport === undefined) {
    try {
      const canvas = document.createElement("canvas")
      webglSupport = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
    } catch {
      webglSupport = false
    }
  }
  return webglSupport
}

const noopSubscribe = () => () => {}

/**
 * Sticky full-screen backdrop behind the hero: aurora light, the 3D skyline
 * and readability gradients. `progress` (0–1) drives the camera fly-through.
 */
export function HeroBackdrop({ progress }: { progress: React.RefObject<number> }) {
  const { theme } = useTheme()
  const reduceMotion = Boolean(useReducedMotion())
  const pointer = useRef({ x: 0, y: 0 })
  const webgl = useSyncExternalStore(noopSubscribe, supportsWebGL, () => false)

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = -((event.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="sticky top-0 h-svh w-full overflow-hidden">
        {/* Aurora */}
        <div className="absolute -top-1/4 -left-1/4 size-[70vmax] animate-aurora rounded-full bg-[radial-gradient(closest-side,var(--emerald),transparent)] opacity-30 blur-3xl dark:opacity-35" />
        <div className="absolute -right-1/4 -bottom-1/3 size-[60vmax] animate-aurora rounded-full bg-[radial-gradient(closest-side,var(--gold),transparent)] opacity-20 blur-3xl [animation-delay:-9s]" />

        {webgl && <SkylineScene theme={theme} progress={progress} pointer={pointer} reduceMotion={reduceMotion} />}

        {/* Readability + depth */}
        <div className="absolute inset-0 bg-background/45 lg:hidden" />
        <div className="absolute inset-0 bg-linear-to-b from-background via-background/30 to-background/10" />
        <div className="absolute inset-0 hidden bg-linear-to-r from-background/85 via-background/35 to-transparent lg:block" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background to-transparent" />
        <div className="bg-grid absolute inset-0 opacity-50 mask-[radial-gradient(ellipse_70%_60%_at_50%_30%,black,transparent)]" />
      </div>
    </div>
  )
}
