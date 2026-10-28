"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion"
import { ArrowLeft, ArrowRight, ArrowUpRight, Award, Gem, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"
import type { Reward } from "@/lib/wordpress"

const pad = (n: number) => String(n).padStart(2, "0")

// How long each reward stays in the spotlight while the section cycles on its own
const AUTOPLAY_MS = 6500
const EASE = [0.22, 1, 0.36, 1] as const

// Fixed positions so server and client render the same sparkles
const SPARKLES = [
  { top: "14%", left: "18%", size: 3, delay: "0s" },
  { top: "22%", left: "80%", size: 2, delay: "-1.1s" },
  { top: "38%", left: "10%", size: 2, delay: "-2.3s" },
  { top: "46%", left: "88%", size: 3, delay: "-0.6s" },
  { top: "64%", left: "16%", size: 2, delay: "-1.8s" },
  { top: "70%", left: "84%", size: 2, delay: "-2.7s" },
  { top: "8%", left: "56%", size: 2, delay: "-1.4s" },
]

/** Splits the heading roughly in half; the second half is the gold, italic accent. */
function accentHalf(title: string) {
  const words = title.split(" ")
  if (words.length < 3) return { lead: "", accent: title }
  const cut = Math.floor(words.length / 2)
  return { lead: words.slice(0, cut).join(" "), accent: words.slice(cut).join(" ") }
}

/** Drops a trailing "(2025)" since the year is shown as its own badge. */
const displayTitle = (reward: Reward) => reward.title.replace(/\s*\(\s*(?:19|20)\d{2}\s*\)\s*$/, "")

function RewardTitle({ reward }: { reward: Reward }) {
  const title = displayTitle(reward)
  const index = title.lastIndexOf(" ")
  if (index === -1) return <span className="text-gold-gradient italic">{title}</span>
  return (
    <>
      {title.slice(0, index)}{" "}
      <span className="text-gold-gradient pr-[0.08em] italic">{title.slice(index + 1)}</span>
    </>
  )
}

const KindIcon = ({ reward, className }: { reward: Reward; className?: string }) =>
  reward.kind === "Award" ? <Trophy className={className} /> : <Gem className={className} />

export function RewardsSection({ title, rewards }: { title: string; rewards: Reward[] }) {
  const root = useRef<HTMLElement>(null)
  const rail = useRef<HTMLUListElement>(null)
  const reduceMotion = useReducedMotion()
  const { lead, accent } = accentHalf(title || "Recognised by the developers we work with")

  const [active, setActive] = useState(0)
  // Cycles until the visitor picks a reward themselves
  const [auto, setAuto] = useState(true)
  const [inView, setInView] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [storyOpen, setStoryOpen] = useState(false)

  const autoplay = auto && !reduceMotion && rewards.length > 1
  const playing = autoplay && inView && !hovering && !storyOpen
  const current = rewards[active]

  const choose = (i: number) => {
    setActive((i + rewards.length) % rewards.length)
    setAuto(false)
  }

  // Keep the active card visible in the selector rail without moving the page
  useEffect(() => {
    const el = rail.current
    const card = el?.children[active] as HTMLElement | undefined
    if (!el || !card) return
    const target = card.offsetLeft - (el.clientWidth - card.offsetWidth) / 2
    el.scrollTo({ left: Math.max(0, target), behavior: reduceMotion ? "auto" : "smooth" })
  }, [active, reduceMotion])

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
          .fromTo(q("[data-reveal='lede']"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0 }, "-=0.9")
          .fromTo(
            q("[data-reveal='showcase']"),
            { autoAlpha: 1, y: 80, clipPath: "inset(14% 8% 14% 8% round 2rem)" },
            {
              y: 0,
              clipPath: "inset(0% 0% 0% 0% round 2rem)",
              duration: 1.6,
              ease: "expo.inOut",
              clearProps: "clipPath",
            },
            "-=0.9"
          )
          .fromTo(
            q("[data-reveal='beam']"),
            { autoAlpha: 0, scaleY: 0, transformOrigin: "50% 0%" },
            { autoAlpha: 1, scaleY: 1, duration: 1.8 },
            "-=0.8"
          )
          .fromTo(
            q("[data-reveal='pick']"),
            { autoAlpha: 0, y: 40 },
            { autoAlpha: 1, y: 0, duration: 1, stagger: 0.06 },
            "-=1.4"
          )
      })

      return () => mm.revert()
    },
    { scope: root, dependencies: [rewards.length] }
  )

  if (!current) return null

  return (
    <section
      ref={root}
      id="recognition"
      aria-labelledby="recognition-title"
      data-anim-root
      className="relative overflow-x-clip py-16 lg:py-24"
    >
      {/* --------------------------------- Header --------------------------------- */}
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p
            data-reveal="eyebrow"
            className="flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.3em] text-gold-ink uppercase"
          >
            <span>05</span>
            <span className="h-px w-12 bg-gold/60" />
            Rewards &amp; recognition
          </p>
          <h2
            id="recognition-title"
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

        <div data-reveal="lede" className="flex items-end gap-3 lg:col-span-4 lg:justify-self-end lg:pb-2">
          <span className="text-outline font-display text-[clamp(3rem,6vw,4.5rem)] leading-[0.8] font-light italic">
            {pad(rewards.length)}
          </span>
          <span className="pb-1 font-mono text-[0.6rem] leading-relaxed tracking-[0.25em] text-muted-foreground uppercase">
            Awards &amp;
            <br />
            keepsakes
          </span>
        </div>
      </div>

      <div
        className="mx-auto mt-10 w-full max-w-7xl px-5 sm:px-8 lg:mt-14"
        onPointerEnter={() => setHovering(true)}
        onPointerLeave={() => setHovering(false)}
      >
        {/* -------------------------------- Showcase -------------------------------- */}
        <article
          data-reveal="showcase"
          aria-live="polite"
          aria-labelledby="recognition-active-title"
          className="relative isolate grid overflow-hidden rounded-[2rem] border border-gold/25 bg-card shadow-[0_50px_120px_-60px_color-mix(in_oklab,var(--gold)_55%,transparent)] lg:grid-cols-12"
        >
          <Stage reward={current} index={active} />

          <div className="relative flex flex-col p-6 sm:p-8 lg:col-span-7 lg:p-12">
            <div
              aria-hidden
              className="absolute -top-32 -right-32 -z-10 size-80 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--emerald)_20%,transparent),transparent)]"
            />

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current.id}
                initial="hidden"
                animate="shown"
                exit="gone"
                variants={{
                  hidden: {},
                  shown: { transition: { staggerChildren: reduceMotion ? 0 : 0.07 } },
                  gone: { opacity: 0, y: reduceMotion ? 0 : -16, transition: { duration: 0.3 } },
                }}
                className="flex flex-1 flex-col"
              >
                <Line className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-mono text-[0.6rem] tracking-[0.2em] text-gold-ink uppercase">
                    <KindIcon reward={current} className="size-3" />
                    {current.kind}
                  </span>
                  {current.year && (
                    <span className="rounded-full border border-emerald/40 bg-emerald/10 px-3 py-1 font-mono text-[0.6rem] tracking-[0.2em] text-foreground/90">
                      {current.year}
                    </span>
                  )}
                  <span className="ml-auto font-mono text-[0.68rem] tracking-[0.2em] text-muted-foreground tabular-nums">
                    <span className="text-gold-ink">{pad(active + 1)}</span> / {pad(rewards.length)}
                  </span>
                </Line>

                <Line>
                  <h3
                    id="recognition-active-title"
                    className="mt-6 font-display text-[clamp(2rem,3.6vw,3.2rem)] leading-[1.04] font-light tracking-[-0.03em] text-balance"
                  >
                    <RewardTitle reward={current} />
                  </h3>
                </Line>

                {current.summary && (
                  <Line>
                    <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-foreground/85">{current.summary}</p>
                  </Line>
                )}

                {current.description[0] && (
                  <Line>
                    <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                      {current.description[0]}
                    </p>
                  </Line>
                )}

                <div className="min-h-8 flex-1" />

                <Line className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
                  <Button variant="gold" size="xl" onClick={() => setStoryOpen(true)}>
                    Read the story
                    <ArrowUpRight className="transition-transform duration-300 group-hover/button:rotate-45" />
                  </Button>
                  {rewards.length > 1 && (
                    <div className="ml-auto flex gap-2">
                      <Button
                        variant="glass"
                        size="icon-lg"
                        className="rounded-full"
                        aria-label="Previous reward"
                        onClick={() => choose(active - 1)}
                      >
                        <ArrowLeft />
                      </Button>
                      <Button
                        variant="glass"
                        size="icon-lg"
                        className="rounded-full"
                        aria-label="Next reward"
                        onClick={() => choose(active + 1)}
                      >
                        <ArrowRight />
                      </Button>
                    </div>
                  )}
                </Line>
              </motion.div>
            </AnimatePresence>
          </div>
        </article>

        {/* --------------------------------- Selector --------------------------------- */}
        {rewards.length > 1 && (
          <ul
            ref={rail}
            className="-mx-5 mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pt-1 pb-3 [scrollbar-width:none] sm:-mx-8 sm:px-8 [&::-webkit-scrollbar]:hidden"
          >
            {rewards.map((reward, i) => {
              const isActive = i === active
              return (
                <li key={reward.id} data-reveal="pick" className="shrink-0 snap-start">
                  <button
                    type="button"
                    aria-label={`Show ${reward.title}`}
                    aria-current={isActive}
                    onClick={() => choose(i)}
                    className={cn(
                      "group/pick relative flex w-[17rem] items-center gap-4 overflow-hidden rounded-2xl border p-3 pr-4 text-left outline-none transition-all duration-500 focus-visible:ring-2 focus-visible:ring-gold/50",
                      isActive
                        ? "border-gold/50 bg-gold/8 shadow-[0_20px_50px_-30px_var(--gold)]"
                        : "border-border bg-card hover:-translate-y-0.5 hover:border-gold/30"
                    )}
                  >
                    <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {reward.image ? (
                        <Image
                          src={reward.image.src}
                          alt=""
                          fill
                          sizes="64px"
                          className={cn(
                            "object-cover transition-[scale,filter] duration-700",
                            isActive ? "scale-105" : "grayscale-[0.6] group-hover/pick:grayscale-0"
                          )}
                        />
                      ) : (
                        <Award className="absolute inset-0 m-auto size-6 text-gold/50" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-mono text-[0.56rem] tracking-[0.2em] text-gold-ink uppercase">
                        <KindIcon reward={reward} className="size-3" />
                        {reward.year || reward.kind}
                      </span>
                      <span
                        className={cn(
                          "mt-1 line-clamp-2 text-[0.85rem] leading-snug transition-colors",
                          isActive ? "text-foreground" : "text-foreground/75 group-hover/pick:text-foreground"
                        )}
                      >
                        {displayTitle(reward)}
                      </span>
                    </span>

                    {/* Time left in the spotlight */}
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-transparent">
                      {isActive && (
                        <span
                          key={active}
                          className="absolute inset-0 origin-left bg-linear-to-r from-emerald via-gold to-gold-light"
                          style={
                            autoplay
                              ? {
                                  animation: `progress ${AUTOPLAY_MS}ms linear forwards`,
                                  animationPlayState: playing ? "running" : "paused",
                                }
                              : undefined
                          }
                          onAnimationEnd={() => setActive((a) => (a + 1) % rewards.length)}
                        />
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* ---------------------------------- Story ---------------------------------- */}
      <Sheet open={storyOpen} onOpenChange={setStoryOpen}>
        <SheetContent
          side="right"
          className="gap-0 border-gold/20 bg-card p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        >
          <div data-lenis-prevent className="h-full overflow-y-auto overscroll-contain">
            {current.image && (
              <div className="relative aspect-4/3 overflow-hidden bg-muted">
                <Image
                  src={current.image.src}
                  alt={current.image.alt}
                  fill
                  sizes="(min-width: 640px) 576px, 100vw"
                  className="object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-card to-transparent" />
              </div>
            )}
            <div className="px-6 pt-6 pb-10 sm:px-9">
              <p className="flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.3em] text-gold-ink uppercase">
                <KindIcon reward={current} className="size-3.5" />
                {current.kind}
                {current.year && <> · {current.year}</>}
              </p>
              <SheetTitle className="mt-3 font-display text-[2.2rem] leading-[1.05] font-light tracking-[-0.03em]">
                <RewardTitle reward={current} />
              </SheetTitle>
              {current.summary && (
                <SheetDescription className="mt-4 text-[1rem] leading-relaxed text-foreground/85">
                  {current.summary}
                </SheetDescription>
              )}
              <div className="mt-6 space-y-4 border-t border-border pt-6">
                {current.description.map((paragraph, i) => (
                  <p key={i} className="text-[0.95rem] leading-relaxed text-muted-foreground">
                    {paragraph}
                  </p>
                ))}
              </div>
              {current.gallery.length > 0 && (
                <ul className="mt-8 grid grid-cols-2 gap-3">
                  {current.gallery.map((photo) => (
                    <li key={photo.src} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                      <Image src={photo.src} alt={photo.alt} fill sizes="280px" className="object-cover" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </section>
  )
}

/** One line of the details panel; fades up in sequence when the reward changes. */
function Line({ className, children }: { className?: string; children: React.ReactNode }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: reduceMotion ? 0 : 22 },
        shown: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Spotlit display case for the current reward photo, tilting toward the cursor. */
function Stage({ reward, index }: { reward: Reward; index: number }) {
  const reduceMotion = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const spring = { stiffness: 140, damping: 18, mass: 0.6 }
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), spring)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), spring)

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    mx.set((event.clientX - rect.left) / rect.width - 0.5)
    my.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  return (
    <div
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        mx.set(0)
        my.set(0)
      }}
      className="relative isolate grid min-h-[26rem] place-items-center overflow-hidden bg-[radial-gradient(90%_70%_at_50%_0%,color-mix(in_oklab,var(--gold)_22%,transparent),transparent_70%),linear-gradient(to_bottom,color-mix(in_oklab,var(--background)_60%,black),var(--background))] px-6 py-12 lg:col-span-5 lg:min-h-[36rem]"
      style={{ perspective: 1200 }}
    >
      {/* Light beam from above */}
      <div
        aria-hidden
        data-reveal="beam"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full"
      >
        <div className="mx-auto h-full w-[70%] animate-beam bg-linear-to-b from-gold/35 via-gold/10 to-transparent [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)]" />
      </div>

      {SPARKLES.map((sparkle, i) => (
        <span
          key={i}
          aria-hidden
          className="pointer-events-none absolute -z-10 animate-twinkle rounded-full bg-gold-light shadow-[0_0_10px_2px_var(--gold)]"
          style={{
            top: sparkle.top,
            left: sparkle.left,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: sparkle.delay,
          }}
        />
      ))}

      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="relative w-[min(74%,20rem)]">
        {/* Plinth glow under the frame */}
        <div
          aria-hidden
          className="absolute -bottom-10 left-1/2 h-10 w-[120%] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--gold)_45%,transparent),transparent)] blur-md"
        />
        <div
          aria-hidden
          className="absolute -bottom-7 left-1/2 h-5 w-[105%] -translate-x-1/2 rounded-[100%] border border-gold/40"
        />

        <div className="relative aspect-4/5 overflow-hidden rounded-[1.5rem] border border-gold/35 bg-muted shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)]">
          <AnimatePresence initial={false}>
            <motion.div
              key={reward.id}
              initial={reduceMotion ? { opacity: 0 } : { clipPath: "inset(100% 0% 0% 0%)", scale: 1.2 }}
              animate={reduceMotion ? { opacity: 1 } : { clipPath: "inset(0% 0% 0% 0%)", scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
              transition={{ duration: 1.1, ease: EASE }}
              className="absolute inset-0"
            >
              {reward.image ? (
                <Image
                  src={reward.image.src}
                  alt={reward.image.alt}
                  fill
                  sizes="(min-width: 1024px) 320px, 74vw"
                  className="object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center bg-linear-to-b from-muted to-card">
                  <Trophy className="size-20 text-gold/40" strokeWidth={1} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          {/* Glass sheen */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-transparent via-white/8 to-transparent" />
        </div>

        <span
          aria-hidden
          className="text-gold-gradient absolute -top-6 -left-5 font-display text-6xl leading-none font-light italic drop-shadow-[0_6px_20px_rgb(0_0_0/0.6)]"
          style={{ transform: "translateZ(60px)" }}
        >
          {pad(index + 1)}
        </span>
      </motion.div>
    </div>
  )
}
