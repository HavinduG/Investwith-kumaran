"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight, MoveHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/properties/project-card"
import { gsap, useGSAP } from "@/lib/gsap"
import type { CmsLink, ProjectSummary } from "@/lib/wordpress"
import { FeaturedProject } from "./featured-project"

const pad = (n: number) => String(n).padStart(2, "0")

// Pointer travel (px) after which a press on the rail counts as a drag, not a click
const DRAG_THRESHOLD = 6

/** The last two words of the heading are set as the gold, italic accent. */
function accentTail(title: string) {
  const words = title.split(" ")
  if (words.length < 3) return { lead: "", accent: title }
  return { lead: words.slice(0, -2).join(" "), accent: words.slice(-2).join(" ") }
}

export function ProjectsSection({
  title,
  description,
  projects,
  cta,
  whatsappCta,
}: {
  title: string
  description: string
  projects: ProjectSummary[]
  cta: CmsLink | null
  whatsappCta: CmsLink | null
}) {
  const root = useRef<HTMLElement>(null)
  const rail = useRef<HTMLDivElement>(null)
  const progress = useRef<HTMLSpanElement>(null)
  const drag = useRef({ active: false, moved: false, startX: 0, startScroll: 0 })
  const [current, setCurrent] = useState(0)
  const [edges, setEdges] = useState({ start: true, end: false })
  const { lead, accent } = accentTail(title || "Properties worth a closer look")

  const [featured, ...rest] = projects

  /* ------------------------------ Rail controls ------------------------------ */
  const cardStep = () => {
    const el = rail.current
    const item = el?.querySelector<HTMLElement>("[data-rail-item]")
    if (!el || !item) return 0
    return item.offsetWidth + parseFloat(getComputedStyle(item.parentElement!).columnGap || "0")
  }

  const onRailScroll = () => {
    const el = rail.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const ratio = max > 0 ? el.scrollLeft / max : 1
    if (progress.current) progress.current.style.transform = `scaleX(${Math.max(0.08, ratio)})`
    const step = cardStep()
    if (step) setCurrent(Math.min(rest.length - 1, Math.round(el.scrollLeft / step)))
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 })
  }

  const scrollByCards = (direction: 1 | -1) => {
    rail.current?.scrollBy({ left: direction * cardStep(), behavior: "smooth" })
  }

  // Click-and-drag scrolling for mouse users; touch keeps native swiping
  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return
    drag.current = { active: true, moved: false, startX: event.clientX, startScroll: event.currentTarget.scrollLeft }
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current
    if (!state.active) return
    const delta = event.clientX - state.startX
    if (!state.moved && Math.abs(delta) > DRAG_THRESHOLD) {
      state.moved = true
      event.currentTarget.setPointerCapture(event.pointerId)
      event.currentTarget.dataset.dragging = ""
    }
    if (state.moved) event.currentTarget.scrollLeft = state.startScroll - delta
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    drag.current.active = false
    delete event.currentTarget.dataset.dragging
  }

  // A drag ends with a click on whatever card is under the pointer; swallow it
  const onClickCapture = (event: React.MouseEvent) => {
    if (drag.current.moved) {
      event.preventDefault()
      event.stopPropagation()
      drag.current.moved = false
    }
  }

  /* -------------------------------- Animation -------------------------------- */
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
          .fromTo(q("[data-reveal='lede']"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0 }, "-=0.9")

        /* ----------------------------- Featured card ----------------------------- */
        const featuredCard = q("[data-featured]")[0]
        if (featuredCard) {
          gsap
            .timeline({
              defaults: { ease: "expo.out" },
              scrollTrigger: { trigger: featuredCard, start: "top 80%", once: true },
            })
            .fromTo(
              q("[data-reveal='featured']"),
              { autoAlpha: 1, y: 80, clipPath: "inset(18% 6% 18% 6% round 2rem)" },
              { y: 0, clipPath: "inset(0% 0% 0% 0% round 2rem)", duration: 1.6, ease: "expo.inOut", clearProps: "clipPath" }
            )
            .fromTo(q("[data-featured-parallax]"), { scale: 1.25 }, { scale: 1, duration: 2.2 }, 0.2)
            .fromTo(
              q("[data-featured-item]"),
              { autoAlpha: 0, x: 40 },
              { autoAlpha: 1, x: 0, duration: 1.1, stagger: 0.08 },
              0.7
            )

          // Photo drifts within its frame as the card moves up the screen
          gsap.fromTo(
            q("[data-featured-parallax]"),
            { yPercent: -4 },
            {
              yPercent: 4,
              ease: "none",
              scrollTrigger: { trigger: featuredCard, start: "top bottom", end: "bottom top", scrub: 0.8 },
            }
          )
        }

        /* ---------------------------------- Rail ---------------------------------- */
        const railEl = rail.current
        if (railEl) {
          gsap
            .timeline({
              defaults: { ease: "expo.out", duration: 1.2 },
              scrollTrigger: { trigger: railEl, start: "top 85%", once: true },
            })
            .fromTo(q("[data-reveal='rail-head']"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0 })
            .fromTo(
              q("[data-reveal='card']"),
              { autoAlpha: 0, x: 120, rotateY: -16, transformOrigin: "0% 50%" },
              { autoAlpha: 1, x: 0, rotateY: 0, duration: 1.4, stagger: 0.1, clearProps: "transform" },
              "-=0.9"
            )
            .fromTo(q("[data-reveal='rail-footer']"), { autoAlpha: 0 }, { autoAlpha: 1 }, "-=0.8")
        }
      })

      return () => mm.revert()
    },
    { scope: root, dependencies: [projects.length] }
  )

  if (!featured) return null

  return (
    <section
      ref={root}
      id="properties"
      aria-labelledby="properties-title"
      data-anim-root
      className="relative overflow-x-clip py-16 lg:py-24"
    >
      {/* --------------------------------- Header --------------------------------- */}
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 sm:px-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p
            data-reveal="eyebrow"
            className="flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.3em] text-gold-ink uppercase"
          >
            <span>03</span>
            <span className="h-px w-12 bg-gold/60" />
            Properties
          </p>
          <h2
            id="properties-title"
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
        {description && (
          <p
            data-reveal="lede"
            className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem] lg:col-span-5 lg:justify-self-end lg:pb-2 lg:text-right"
          >
            {description}
          </p>
        )}
      </div>

      {/* ------------------------------ Featured card ------------------------------ */}
      <div data-reveal="featured" className="mx-auto mt-10 w-full max-w-7xl px-5 sm:px-8 lg:mt-14">
        <FeaturedProject project={featured} whatsappCta={whatsappCta} />
      </div>

      {/* ------------------------------ More to explore ------------------------------ */}
      {(rest.length > 0 || cta) && (
        <div className="mt-16 lg:mt-20">
          <div
            data-reveal="rail-head"
            className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 sm:px-8"
          >
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h3 className="font-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight font-light tracking-[-0.02em]">
                More to <span className="text-gold-gradient italic">explore</span>
              </h3>
              <span className="flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.25em] text-muted-foreground uppercase">
                <MoveHorizontal className="size-3.5 text-gold-ink" />
                Swipe or drag
              </span>
            </div>

            {rest.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="font-mono text-[0.68rem] tracking-[0.2em] text-muted-foreground tabular-nums">
                  <span className="text-gold-ink">{pad(current + 1)}</span> / {pad(rest.length)}
                </span>
                <Button
                  variant="glass"
                  size="icon-lg"
                  className="rounded-full"
                  aria-label="Previous properties"
                  disabled={edges.start}
                  onClick={() => scrollByCards(-1)}
                >
                  <ArrowLeft />
                </Button>
                <Button
                  variant="gold"
                  size="icon-lg"
                  className="rounded-full"
                  aria-label="Next properties"
                  disabled={edges.end}
                  onClick={() => scrollByCards(1)}
                >
                  <ArrowRight />
                </Button>
              </div>
            )}
          </div>

          <div
            ref={rail}
            onScroll={onRailScroll}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={onClickCapture}
            onDragStart={(event) => event.preventDefault()}
            className="mt-8 snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] data-dragging:cursor-grabbing data-dragging:snap-none data-dragging:select-none [&::-webkit-scrollbar]:hidden"
          >
            <ul
              className="flex w-max gap-4 px-5 pt-2 pb-6 sm:gap-5 sm:px-8 xl:px-[calc((100vw-80rem)/2+2rem)]"
              style={{ perspective: 1400 }}
            >
              {rest.map((project, i) => (
                <li
                  key={project.id}
                  data-rail-item
                  data-reveal="card"
                  className="flex w-[min(82vw,21rem)] shrink-0 snap-start scroll-ml-5 sm:scroll-ml-8 xl:w-[22rem]"
                >
                  <ProjectCard project={project} index={i + 1} className="w-full" />
                </li>
              ))}

              {cta && (
                <li data-rail-item data-reveal="card" className="flex w-[min(82vw,19rem)] shrink-0 snap-start">
                  <Link
                    href={cta.href}
                    className="group/cta relative flex w-full flex-col justify-between overflow-hidden rounded-[1.75rem] border border-dashed border-gold/35 p-7 transition-colors duration-500 hover:border-solid hover:border-gold/60 hover:bg-gold/5"
                  >
                    <div
                      aria-hidden
                      className="absolute -right-20 -bottom-20 size-64 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--gold)_22%,transparent),transparent)] transition-transform duration-1000 group-hover/cta:scale-150"
                    />
                    <span className="relative font-mono text-[0.62rem] tracking-[0.3em] text-gold-ink uppercase">
                      Your brief
                    </span>
                    <div className="relative py-10">
                      <p className="font-display text-[1.9rem] leading-[1.1] font-light tracking-[-0.02em]">
                        Looking for something <span className="text-gold-gradient italic">specific?</span>
                      </p>
                      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        Share what you need and we&rsquo;ll shortlist options around it.
                      </p>
                    </div>
                    <span className="relative inline-flex items-center gap-3 text-sm font-medium">
                      <span className="grid size-11 place-items-center rounded-full bg-gold text-gold-foreground shadow-[0_0_30px_-6px_var(--gold)] transition-transform duration-500 group-hover/cta:rotate-45">
                        <ArrowUpRight className="size-4" />
                      </span>
                      {cta.label}
                    </span>
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div data-reveal="rail-footer" className="mx-auto w-full max-w-7xl px-5 sm:px-8">
            <span className="relative block h-px overflow-hidden bg-border">
              <span
                ref={progress}
                className="absolute inset-0 origin-left scale-x-[0.08] bg-linear-to-r from-emerald via-gold to-gold-light transition-transform duration-300"
              />
            </span>
          </div>
        </div>
      )}
    </section>
  )
}
