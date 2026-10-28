"use client"

import { useRef } from "react"

import { gsap, useGSAP } from "@/lib/gsap"

/** Decorative divider between sections: two hairlines draw out from a spinning emblem. */
export function SectionBreak() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(q("[data-reveal]"), { autoAlpha: 1 })
        el.setAttribute("data-anim-ready", "")
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(q("[data-reveal]"), { autoAlpha: 0 })
        el.setAttribute("data-anim-ready", "")

        gsap
          .timeline({ scrollTrigger: { trigger: el, start: "top 88%", once: true } })
          .fromTo(
            q("[data-reveal='emblem']"),
            { autoAlpha: 0, scale: 0, rotate: -180 },
            { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.2, ease: "back.out(1.6)" }
          )
          .fromTo(
            q("[data-reveal='line']"),
            { autoAlpha: 1, scaleX: 0 },
            { scaleX: 1, duration: 1.6, ease: "expo.inOut" },
            0.15
          )

        // The emblem keeps turning slowly as the page scrolls past
        gsap.to(q("[data-emblem-ring]"), {
          rotate: 220,
          ease: "none",
          scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
        })
      })

      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <div
      ref={root}
      aria-hidden
      data-anim-root
      className="relative mx-auto flex w-full max-w-7xl items-center gap-4 px-5 py-10 sm:gap-6 sm:px-8 lg:py-14"
    >
      {/* Soft glow behind the emblem */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-32 w-[min(36rem,80%)] -translate-1/2 bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--gold)_14%,transparent),transparent)]" />

      <span
        data-reveal="line"
        className="relative h-px flex-1 origin-right overflow-hidden bg-linear-to-r from-transparent via-border to-gold/60"
      >
        <span className="absolute inset-y-0 w-24 animate-streak bg-linear-to-r from-transparent via-gold-light to-transparent" />
      </span>

      <span data-reveal="emblem" className="relative grid size-14 shrink-0 place-items-center">
        <svg data-emblem-ring viewBox="0 0 56 56" className="absolute inset-0 size-full">
          <circle cx="28" cy="28" r="27" fill="none" stroke="var(--gold)" strokeOpacity="0.45" strokeWidth="0.75" strokeDasharray="2 4" />
          <circle cx="28" cy="1" r="1.6" fill="var(--gold)" />
        </svg>
        <span className="absolute inset-2.5 rounded-full border border-border bg-background/60 backdrop-blur-sm" />
        <span className="relative size-2.5 rotate-45 bg-gold shadow-[0_0_18px_2px_var(--gold)]" />
      </span>

      <span
        data-reveal="line"
        className="relative h-px flex-1 origin-left overflow-hidden bg-linear-to-l from-transparent via-border to-gold/60"
      >
        <span className="absolute inset-y-0 w-24 animate-streak bg-linear-to-r from-transparent via-gold-light to-transparent [animation-delay:-2.5s]" />
      </span>
    </div>
  )
}
