"use client"

import { useRef } from "react"
import Image from "next/image"

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"
import type { CmsImage, PartnersContent } from "@/lib/wordpress"

// Each half of a looping row repeats its logos until it holds at least this many
const MIN_PER_HALF = 8
// Seconds a single logo takes to travel its own width at rest
const SECONDS_PER_LOGO = 3.2
// Below this many logos everything stays in one row
const TWO_ROW_MIN = 6

/** The last two words of the heading are set as the gold, italic accent. */
function accentTail(title: string) {
  const words = title.split(" ")
  if (words.length < 3) return { lead: "", accent: title }
  return { lead: words.slice(0, -2).join(" "), accent: words.slice(-2).join(" ") }
}

export function PartnersSection({ partners }: { partners: PartnersContent }) {
  const root = useRef<HTMLElement>(null)
  const { lead, accent } = accentTail(partners.title || "Developer & finance partners")
  const { logos } = partners

  // Alternate logos between two rows that travel in opposite directions
  const rows =
    logos.length >= TWO_ROW_MIN
      ? [logos.filter((_, i) => i % 2 === 0), logos.filter((_, i) => i % 2 === 1)]
      : [logos]

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
          .timeline({
            defaults: { ease: "expo.out", duration: 1.2 },
            scrollTrigger: { trigger: el, start: "top 75%", once: true },
          })
          .fromTo(q("[data-reveal='eyebrow']"), { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0 })
          .fromTo(
            q("[data-reveal='title']"),
            { autoAlpha: 0, y: 50, filter: "blur(10px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1.3, stagger: 0.15 },
            "-=0.85"
          )
          .fromTo(q("[data-reveal='lede']"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.1 }, "-=0.9")
          .fromTo(
            q("[data-reveal='row']"),
            { autoAlpha: 0, x: (i) => (i % 2 ? -160 : 160) },
            { autoAlpha: 1, x: 0, duration: 1.6, stagger: 0.12 },
            "-=1"
          )

        /* ---------------------------- Looping rows ---------------------------- */
        q<HTMLElement>("[data-marquee]").forEach((row) => {
          const track = row.querySelector<HTMLElement>("[data-marquee-track]")!
          const direction = Number(row.dataset.direction) || 1
          const count = Number(row.dataset.count) || 1

          const loop = gsap.to(track, {
            xPercent: -50,
            ease: "none",
            duration: count * SECONDS_PER_LOGO,
            repeat: -1,
          })
          // Start deep in the timeline so reversing never reaches the beginning
          loop.totalTime(loop.duration() * 200)
          loop.timeScale(direction)

          let hovered = false
          let scrollDirection = 1
          const cruise = () => direction * scrollDirection

          // Hovering a row eases it to a near stop so logos can be read
          row.addEventListener("pointerenter", () => {
            hovered = true
            gsap.to(loop, { timeScale: cruise() * 0.12, duration: 0.6, ease: "power2.out", overwrite: true })
          })
          row.addEventListener("pointerleave", () => {
            hovered = false
            gsap.to(loop, { timeScale: cruise(), duration: 0.8, ease: "power2.inOut", overwrite: true })
          })

          // Scrolling speeds the rows up and flips them with the scroll direction
          ScrollTrigger.create({
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            onUpdate(self) {
              scrollDirection = self.direction
              if (hovered) return
              const boost = gsap.utils.clamp(1, 7, Math.abs(self.getVelocity()) / 200)
              gsap
                .timeline({ overwrite: true })
                .to(loop, { timeScale: cruise() * boost, duration: 0.2 })
                .to(loop, { timeScale: cruise(), duration: 1.4, ease: "power2.out" }, "+=0.15")
            },
          })
        })

        // The rows drift apart slightly as the section crosses the screen
        q<HTMLElement>("[data-marquee]").forEach((row, i) => {
          gsap.fromTo(
            row,
            { x: i % 2 ? -40 : 40 },
            {
              x: i % 2 ? 40 : -40,
              ease: "none",
              scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
            }
          )
        })
      })

      return () => mm.revert()
    },
    { scope: root, dependencies: [logos.length] }
  )

  return (
    <section
      ref={root}
      id="partners"
      aria-labelledby="partners-title"
      data-anim-root
      className="relative overflow-x-clip py-16 lg:py-24"
    >
      {/* Ambient light behind the rows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-80 bg-[radial-gradient(50%_50%_at_50%_50%,color-mix(in_oklab,var(--gold)_9%,transparent),transparent)]"
      />

      {/* --------------------------------- Header --------------------------------- */}
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p
            data-reveal="eyebrow"
            className="flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.3em] text-gold-ink uppercase"
          >
            <span>04</span>
            <span className="h-px w-12 bg-gold/60" />
            Partners
          </p>
          <h2
            id="partners-title"
            className="mt-6 font-display text-[clamp(2.4rem,4.6vw,4rem)] leading-[1.02] font-light tracking-[-0.03em] text-balance"
          >
            {lead && (
              <>
                <span data-reveal="title" className="inline-block">
                  {lead}
                </span>{" "}
              </>
            )}
            <span data-reveal="title" className="text-gold-gradient inline-block pr-[0.08em] italic">
              {accent}
            </span>
          </h2>
        </div>

        <div className="flex items-end justify-between gap-8 lg:col-span-5 lg:flex-col lg:items-end lg:pb-2">
          {partners.description && (
            <p
              data-reveal="lede"
              className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem] lg:text-right"
            >
              {partners.description}
            </p>
          )}
          <div data-reveal="lede" className="flex shrink-0 items-end gap-3">
            <span className="text-outline font-display text-[clamp(3rem,6vw,4.5rem)] leading-[0.8] font-light italic">
              {String(logos.length).padStart(2, "0")}
            </span>
            <span className="pb-1 font-mono text-[0.6rem] leading-relaxed tracking-[0.25em] text-muted-foreground uppercase">
              Trusted
              <br />
              partners
            </span>
          </div>
        </div>
      </div>

      {/* ---------------------------------- Rows ---------------------------------- */}
      <ul className="sr-only">
        {logos.map((logo) => (
          <li key={logo.src}>{logo.alt}</li>
        ))}
      </ul>

      <div aria-hidden className="mt-12 space-y-4 sm:space-y-5 lg:mt-16">
        {rows.map((row, i) => (
          <LogoRow key={i} logos={row} direction={i % 2 ? -1 : 1} />
        ))}
      </div>
    </section>
  )
}

function LogoRow({ logos, direction }: { logos: CmsImage[]; direction: 1 | -1 }) {
  const repeat = Math.max(1, Math.ceil(MIN_PER_HALF / logos.length))
  const half = Array.from({ length: repeat }, () => logos).flat()

  return (
    <div
      data-reveal="row"
      data-marquee
      data-direction={direction}
      data-count={half.length}
      className="group/row relative overflow-hidden py-2 mask-x-from-85% mask-x-to-100%"
    >
      <div data-marquee-track className="flex w-max will-change-transform">
        {/* Two identical halves make the -50% loop seamless */}
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5">
            {half.map((logo, k) => (
              <li key={`${copy}-${k}`}>
                <LogoTile logo={logo} />
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}

function LogoTile({ logo }: { logo: CmsImage }) {
  // Spotlight that follows the cursor inside the tile
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`)
  }

  return (
    <div
      onPointerMove={onPointerMove}
      className={cn(
        "group/tile relative grid h-24 w-44 place-items-center overflow-hidden rounded-2xl border border-border bg-card px-6 sm:h-28 sm:w-52",
        "transition-[translate,border-color,box-shadow,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        // Hovering a row dims the other tiles so the one under the cursor stands out
        "group-hover/row:opacity-60 hover:!opacity-100 hover:-translate-y-1 hover:border-gold/45 hover:shadow-[0_24px_50px_-24px_color-mix(in_oklab,var(--gold)_60%,transparent)]",
        "[--mx:50%] [--my:50%]"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(160px_circle_at_var(--mx)_var(--my),color-mix(in_oklab,var(--gold)_16%,transparent),transparent_70%)] opacity-0 transition-opacity duration-500 group-hover/tile:opacity-100" />
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-linear-to-r from-transparent via-gold to-transparent transition-transform duration-700 group-hover/tile:scale-x-100" />

      {/* Logos are dark marks on off-white screenshots. Brightness/contrast push the
          background to pure white; multiply then hides it in light mode, and
          invert + screen turns the logos into light marks on the dark tile. */}
      <div className="relative h-full w-full">
        <Image
          src={logo.src}
          alt=""
          fill
          sizes="(min-width: 640px) 160px, 128px"
          draggable={false}
          className="scale-[0.82] object-contain opacity-75 mix-blend-multiply brightness-110 contrast-125 grayscale transition-[opacity,scale] duration-500 group-hover/tile:scale-90 group-hover/tile:opacity-100 dark:mix-blend-screen dark:invert"
        />
      </div>
    </div>
  )
}
