"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import Lenis from "lenis"

import { gsap, ScrollTrigger } from "@/lib/gsap"
import { registerLenis, scrollToHash } from "@/lib/section-scroll"

// Time for sections (and their scroll-driven layouts) to settle before jumping to a hash
const HASH_SETTLE_MS = 250

/** Inertia scrolling (Lenis) kept in sync with GSAP ScrollTrigger. */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const lenis = new Lenis({ duration: 1.15, anchors: true, autoRaf: false })
    lenis.on("scroll", ScrollTrigger.update)
    registerLenis(lenis)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(tick)
      registerLenis(null)
      lenis.destroy()
    }
  }, [])

  // Arriving on a page with a section hash (e.g. /#about from another page)
  useEffect(() => {
    const { hash } = window.location
    if (!hash) return
    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh()
      scrollToHash(hash)
    }, HASH_SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [pathname])

  return children
}
