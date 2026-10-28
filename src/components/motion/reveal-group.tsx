"use client"

import { useRef } from "react"

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap"

/**
 * Animates every [data-reveal] descendant into view as it scrolls in, in
 * small staggered batches. Lets server-rendered pages share the site's motion.
 */
export function RevealGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = root.current!
      const targets = gsap.utils.toArray<HTMLElement>("[data-reveal]", el)
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(targets, { autoAlpha: 1 })
        el.setAttribute("data-anim-ready", "")
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(targets, { autoAlpha: 0, y: 40 })
        el.setAttribute("data-anim-ready", "")

        ScrollTrigger.batch(targets, {
          start: "top 90%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 1.1,
              ease: "expo.out",
              stagger: 0.09,
              overwrite: true,
            }),
        })
      })

      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <div ref={root} data-anim-root className={className}>
      {children}
    </div>
  )
}
