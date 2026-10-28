"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { AnimatePresence, motion, type PanInfo, useReducedMotion } from "framer-motion"
import { ArrowLeft, ArrowRight, Quote, Star, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"
import type { Testimonial, TestimonialsContent } from "@/lib/wordpress"

const pad = (n: number) => String(n).padStart(2, "0")

// How long each testimonial stays up while the section cycles on its own
const AUTOPLAY_MS = 7000
// Horizontal drag (px) or flick speed needed to change testimonial on touch
const SWIPE_DISTANCE = 80
const SWIPE_VELOCITY = 500
const EASE = [0.22, 1, 0.36, 1] as const

/** The last word of the heading is set as the gold, italic accent. */
function accentLast(title: string) {
  const index = title.lastIndexOf(" ")
  return index === -1 ? { lead: "", accent: title } : { lead: title.slice(0, index), accent: title.slice(index + 1) }
}

export function TestimonialsSection({ testimonials }: { testimonials: TestimonialsContent }) {
  const root = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const { items } = testimonials
  const { lead, accent } = accentLast(testimonials.title || "What clients say")

  const [active, setActive] = useState(0)
  // Direction of the last change, so cards slide the matching way
  const [direction, setDirection] = useState<1 | -1>(1)
  // Cycles until the visitor picks a testimonial themselves
  const [auto, setAuto] = useState(true)
  const [inView, setInView] = useState(false)
  const [hovering, setHovering] = useState(false)

  const autoplay = auto && !reduceMotion && items.length > 1
  const playing = autoplay && inView && !hovering
  const current = items[active]

  const rated = items.filter((item) => item.rating > 0)
  const average = rated.length ? rated.reduce((sum, item) => sum + item.rating, 0) / rated.length : 0

  const go = (i: number, manual = true) => {
    const next = (i + items.length) % items.length
    setDirection(i > active ? 1 : -1)
    setActive(next)
    if (manual) setAuto(false)
  }

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) go(active + 1)
    else if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) go(active - 1)
  }

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const mm = gsap.matchMedia()

      ScrollTrigger.create({
        trigger: el,
        start: "top 70%",
        end: "bottom 30%",
        onToggle: (self) => setInView(self.isActive),
      })

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
          .fromTo(q("[data-reveal='score']"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0 }, "-=0.9")
          .fromTo(
            q("[data-reveal='person']"),
            { autoAlpha: 0, x: -40 },
            { autoAlpha: 1, x: 0, stagger: 0.08 },
            "-=0.9"
          )
          .fromTo(
            q("[data-reveal='deck']"),
            { autoAlpha: 0, y: 80, rotate: 4, scale: 0.94 },
            { autoAlpha: 1, y: 0, rotate: 0, scale: 1, duration: 1.5, clearProps: "transform" },
            "-=1.2"
          )

        // Headline ribbon behind the section drifts with scroll
        gsap.fromTo(
          q("[data-ribbon]"),
          { xPercent: 4 },
          {
            xPercent: -4,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 1 },
          }
        )
      })

      return () => mm.revert()
    },
    { scope: root, dependencies: [items.length] }
  )

  if (!current) return null

  const ribbon = items.map((item) => item.headline).filter(Boolean)

  return (
    <section
      ref={root}
      id="testimonials"
      aria-labelledby="testimonials-title"
      data-anim-root
      className="relative overflow-x-clip py-16 lg:py-24"
    >
      {/* Oversized headlines scrolling behind the content */}
      {ribbon.length > 0 && (
        <div
          aria-hidden
          data-ribbon
          className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 overflow-hidden opacity-60 mask-x-from-70% mask-x-to-100%"
        >
          <div className="flex w-max animate-marquee motion-reduce:animate-none">
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="text-outline flex shrink-0 items-center font-display text-[clamp(5rem,13vw,11rem)] leading-none font-light whitespace-nowrap italic"
              >
                {[...ribbon, ...ribbon].map((headline, i) => (
                  <span key={i} className="flex items-center">
                    {headline}
                    <Star className="mx-[0.3em] size-[0.28em] fill-gold/30 text-gold/40" strokeWidth={1} />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
        {/* ------------------------------- Left column ------------------------------- */}
        <div className="lg:col-span-5">
          <p
            data-reveal="eyebrow"
            className="flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.3em] text-gold-ink uppercase"
          >
            <span>06</span>
            <span className="h-px w-12 bg-gold/60" />
            Testimonials
          </p>
          <h2
            id="testimonials-title"
            className="mt-6 font-display text-[clamp(2.4rem,4.6vw,4rem)] leading-[1.02] font-light tracking-[-0.03em]"
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

          {average > 0 && (
            <div data-reveal="score" className="mt-8 flex items-center gap-5">
              <span className="font-display text-6xl leading-none font-light tabular-nums">
                {average.toFixed(1)}
              </span>
              <div>
                <Stars rating={Math.round(average)} label={`Average rating ${average.toFixed(1)} out of 5`} />
                <p className="mt-1.5 font-mono text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
                  From {rated.length} client {rated.length === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>
          )}

          {/* People: pick a testimonial; the active one shows a countdown ring */}
          {items.length > 1 && (
            <ul className="mt-10 space-y-2" onPointerEnter={() => setHovering(true)} onPointerLeave={() => setHovering(false)}>
              {items.map((item, i) => {
                const isActive = i === active
                return (
                  <li key={`${i}-${item.name}`} data-reveal="person">
                    <button
                      type="button"
                      aria-current={isActive}
                      aria-label={`Read ${item.name || "client"}'s testimonial`}
                      onClick={() => go(i)}
                      className={cn(
                        "group flex w-full items-center gap-4 rounded-2xl border px-3 py-2.5 text-left outline-none transition-all duration-500 focus-visible:ring-2 focus-visible:ring-gold/50",
                        isActive
                          ? "border-gold/40 bg-gold/8"
                          : "border-transparent hover:border-border hover:bg-card/60"
                      )}
                    >
                      <span className="relative grid size-12 shrink-0 place-items-center">
                        <Avatar item={item} className="size-10" muted={!isActive} />
                        <svg viewBox="0 0 48 48" className="absolute inset-0 size-full -rotate-90" aria-hidden>
                          <circle cx="24" cy="24" r="22.5" fill="none" stroke="var(--border)" strokeWidth="1.5" />
                          {isActive && (
                            <circle
                              key={active}
                              cx="24"
                              cy="24"
                              r="22.5"
                              fill="none"
                              stroke="var(--gold)"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              pathLength={100}
                              strokeDasharray="100"
                              strokeDashoffset={autoplay ? 100 : 0}
                              style={
                                autoplay
                                  ? {
                                      animation: `ring ${AUTOPLAY_MS}ms linear forwards`,
                                      animationPlayState: playing ? "running" : "paused",
                                    }
                                  : undefined
                              }
                              onAnimationEnd={() => go(active + 1, false)}
                            />
                          )}
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-sm font-medium transition-colors",
                            isActive ? "text-foreground" : "text-foreground/70 group-hover:text-foreground"
                          )}
                        >
                          {item.name}
                        </span>
                        {item.role && (
                          <span className="block truncate text-xs text-muted-foreground">{item.role}</span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "font-mono text-[0.62rem] tracking-[0.15em] transition-colors",
                          isActive ? "text-gold-ink" : "text-muted-foreground/60"
                        )}
                      >
                        {pad(i + 1)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* -------------------------------- Quote deck -------------------------------- */}
        <div
          data-reveal="deck"
          className="relative lg:col-span-7 lg:pt-6"
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => setHovering(false)}
        >
          {/* Cards stacked behind the active one */}
          <div aria-hidden className="absolute inset-x-6 top-10 bottom-0 rotate-2 rounded-[2rem] border border-border bg-card/40 lg:top-16" />
          <div aria-hidden className="absolute inset-x-3 top-8 bottom-2 -rotate-1 rounded-[2rem] border border-border bg-card/70 lg:top-14" />

          <div aria-live="polite" className="relative min-h-104 overflow-hidden rounded-[2rem] border border-gold/25 bg-card shadow-[0_50px_120px_-60px_color-mix(in_oklab,var(--gold)_55%,transparent)] sm:min-h-96">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 -left-24 size-80 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--gold)_16%,transparent),transparent)]"
            />
            <Quote
              aria-hidden
              className="pointer-events-none absolute top-6 right-7 size-24 fill-gold/10 text-gold/20 sm:size-32"
              strokeWidth={0.75}
            />

            <AnimatePresence mode="popLayout" initial={false} custom={direction}>
              <motion.figure
                key={active}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: reduceMotion ? 0 : d * 80, rotate: reduceMotion ? 0 : d * 2 }),
                  center: { opacity: 1, x: 0, rotate: 0 },
                  exit: (d: number) => ({ opacity: 0, x: reduceMotion ? 0 : d * -80, rotate: reduceMotion ? 0 : d * -2 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.7, ease: EASE }}
                drag={items.length > 1 && !reduceMotion ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.18}
                onDragStart={() => setHovering(true)}
                onDragEnd={(event, info) => {
                  setHovering(false)
                  onDragEnd(event, info)
                }}
                className="relative flex h-full min-h-104 cursor-grab flex-col p-7 active:cursor-grabbing sm:min-h-96 sm:p-10 lg:p-12"
              >
                {current.rating > 0 && <Stars rating={current.rating} label={`Rated ${current.rating} out of 5`} animate />}

                {current.headline && (
                  <p className="text-gold-gradient mt-6 font-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight italic">
                    {current.headline}
                  </p>
                )}

                <blockquote className="mt-4">
                  <WordReveal
                    text={current.quote}
                    className="font-display text-[clamp(1.25rem,2vw,1.6rem)] leading-snug font-light text-foreground/90"
                  />
                </blockquote>

                <div className="min-h-8 flex-1" />

                <figcaption className="flex items-center gap-4 border-t border-border pt-6">
                  <Avatar item={current} className="size-14" ring />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{current.name}</p>
                    {current.role && <p className="truncate text-sm text-muted-foreground">{current.role}</p>}
                  </div>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          {items.length > 1 && (
            <div className="relative mt-6 flex items-center gap-4">
              <span className="font-mono text-[0.68rem] tracking-[0.2em] text-muted-foreground tabular-nums">
                <span className="text-gold-ink">{pad(active + 1)}</span> / {pad(items.length)}
              </span>
              <span className="hidden font-mono text-[0.6rem] tracking-[0.2em] text-muted-foreground/70 uppercase sm:inline">
                Drag the card or use the arrows
              </span>
              <div className="ml-auto flex gap-2">
                <Button variant="glass" size="icon-lg" className="rounded-full" aria-label="Previous testimonial" onClick={() => go(active - 1)}>
                  <ArrowLeft />
                </Button>
                <Button variant="gold" size="icon-lg" className="rounded-full" aria-label="Next testimonial" onClick={() => go(active + 1)}>
                  <ArrowRight />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/** Quote text that resolves word by word from a soft blur. */
function WordReveal({ text, className }: { text: string; className?: string }) {
  const reduceMotion = useReducedMotion()
  const words = text.split(" ")
  if (reduceMotion) return <p className={className}>&ldquo;{text}&rdquo;</p>

  return (
    <p className={className} aria-label={`“${text}”`}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          aria-hidden
          initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.55, ease: EASE, delay: 0.15 + i * 0.025 }}
          className="inline-block whitespace-pre"
        >
          {i === 0 ? "“" : ""}
          {word}
          {i === words.length - 1 ? "”" : " "}
        </motion.span>
      ))}
    </p>
  )
}

function Stars({ rating, label, animate = false }: { rating: number; label: string; animate?: boolean }) {
  const reduceMotion = useReducedMotion()
  return (
    <div role="img" aria-label={label} className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < rating
        const star = (
          <Star className={cn("size-4", filled ? "fill-gold text-gold" : "fill-transparent text-border")} />
        )
        return animate && !reduceMotion ? (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.3, rotate: -40 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 16, delay: 0.1 + i * 0.07 }}
          >
            {star}
          </motion.span>
        ) : (
          <span key={i}>{star}</span>
        )
      })}
    </div>
  )
}

function Avatar({
  item,
  className,
  muted = false,
  ring = false,
}: {
  item: Testimonial
  className?: string
  muted?: boolean
  ring?: boolean
}) {
  return (
    <span
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-full bg-muted",
        ring && "ring-2 ring-gold/50 ring-offset-2 ring-offset-card",
        className
      )}
    >
      {item.image ? (
        <Image
          src={item.image.src}
          alt=""
          fill
          sizes="56px"
          className={cn("object-cover transition-[filter] duration-500", muted && "grayscale group-hover:grayscale-0")}
        />
      ) : (
        <UserRound className="absolute inset-0 m-auto size-1/2 text-gold/50" />
      )}
    </span>
  )
}
