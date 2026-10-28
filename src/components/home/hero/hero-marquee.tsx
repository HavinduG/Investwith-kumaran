"use client"

import { useRef } from "react"
import { Sparkle } from "lucide-react"

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"

const VARIANTS = {
  ticker: {
    root: "border-y border-border bg-background/40 py-4 backdrop-blur-md",
    item: "gap-6 pr-6 font-mono text-xs tracking-[0.22em] uppercase sm:text-[0.8rem]",
    icon: "size-3.5",
  },
  display: {
    root: "py-6",
    item: "gap-8 pr-8 font-display text-[clamp(2rem,5vw,3.75rem)] leading-tight font-light italic sm:gap-12 sm:pr-12",
    icon: "size-4 sm:size-5",
  },
}

/** Infinite ticker that speeds up and flips direction with scroll velocity. */
export function HeroMarquee({
  items,
  variant = "ticker",
}: {
  items: string[]
  variant?: keyof typeof VARIANTS
}) {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const loop = gsap.to(track.current, {
          xPercent: -50,
          ease: "none",
          duration: Math.max(items.length * 4.5, 24),
          repeat: -1,
        })
        // Start far into the timeline so reversing never hits the beginning
        loop.totalTime(loop.duration() * 200)

        ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate(self) {
            const boost = gsap.utils.clamp(1, 6, Math.abs(self.getVelocity()) / 220)
            gsap
              .timeline({ overwrite: true })
              .to(loop, { timeScale: self.direction * boost, duration: 0.2 })
              .to(loop, { timeScale: self.direction, duration: 1.4, ease: "power2.out" }, "+=0.15")
          },
        })
      })
      return () => mm.revert()
    },
    { scope: root, dependencies: [items.length] }
  )

  if (!items.length) return null

  // Two identical halves make the -50% loop seamless
  const sequence = [...items, ...items, ...items]
  const styles = VARIANTS[variant]

  return (
    <div
      ref={root}
      data-reveal="marquee"
      className={cn("relative overflow-hidden mask-x-from-90% mask-x-to-100%", styles.root)}
    >
      <div ref={track} className="flex w-max will-change-transform">
        {[0, 1].map((half) => (
          <ul key={half} aria-hidden={half === 1} className="flex shrink-0 items-center">
            {sequence.map((item, i) => (
              <li
                key={`${half}-${i}`}
                className={cn("flex items-center whitespace-nowrap text-muted-foreground", styles.item)}
              >
                <span className="transition-colors hover:text-foreground">{item}</span>
                <Sparkle className={cn("fill-gold text-gold", styles.icon)} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
