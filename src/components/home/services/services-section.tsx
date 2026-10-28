"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useReducedMotion } from "framer-motion"
import { ArrowLeft, ArrowRight, ArrowUpRight, Building2, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap"
import { cn, splitTitle } from "@/lib/utils"
import type { ServiceItem, ServicesContent } from "@/lib/wordpress"

const pad = (n: number) => String(n).padStart(2, "0")

// How long each service stays open while the section cycles on its own
const AUTOPLAY_MS = 6500
const HOVER_INTENT_MS = 110

/** The last word of a service title is set as the gold, italic accent. */
function accentLastWord(title: string) {
  const index = title.lastIndexOf(" ")
  return index === -1 ? { lead: "", accent: title } : { lead: title.slice(0, index), accent: title.slice(index + 1) }
}

function ServiceTitle({ title }: { title: string }) {
  const { lead, accent } = accentLastWord(title)
  return (
    <>
      {lead && <>{lead} </>}
      <span className="text-gold-gradient pr-[0.08em] italic">{accent}</span>
    </>
  )
}

export function ServicesSection({
  services,
  enquiryHref,
}: {
  services: ServicesContent
  enquiryHref?: string
}) {
  const root = useRef<HTMLElement>(null)
  const hoverTimer = useRef<number>(undefined)
  const reduceMotion = useReducedMotion()
  const { lead, accent } = splitTitle(services.title)
  const { items } = services

  const [active, setActive] = useState(0)
  // Cycles through services until the visitor picks one
  const [auto, setAuto] = useState(true)
  const [inView, setInView] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [detail, setDetail] = useState(0)
  const [sheetOpen, setSheetOpen] = useState(false)

  const autoplay = auto && !reduceMotion && items.length > 1
  const playing = autoplay && inView && !hovering && !sheetOpen

  const choose = (i: number) => {
    setActive((i + items.length) % items.length)
    setAuto(false)
  }

  const openDetails = (i: number) => {
    setDetail(i)
    setSheetOpen(true)
    setAuto(false)
  }

  const onCardEnter = (i: number, event: React.PointerEvent) => {
    if (event.pointerType !== "mouse") return
    window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => setActive(i), HOVER_INTENT_MS)
  }

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const mm = gsap.matchMedia()

      // Autoplay only runs while the section is on screen
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
            q("[data-reveal='card']"),
            { autoAlpha: 1, y: 80, clipPath: "inset(100% 0% 0% 0% round 1.75rem)" },
            {
              y: 0,
              clipPath: "inset(0% 0% 0% 0% round 1.75rem)",
              duration: 1.4,
              ease: "expo.inOut",
              stagger: 0.08,
              clearProps: "clipPath,transform",
            },
            "-=1.1"
          )
          .fromTo(q("[data-reveal='controls']"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0 }, "-=0.6")
      })

      return () => mm.revert()
    },
    { scope: root }
  )

  const current = items[detail]

  return (
    <section
      ref={root}
      id="services"
      aria-labelledby="services-title"
      data-anim-root
      className="relative flex flex-col justify-center overflow-x-clip py-16 lg:min-h-svh lg:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        {/* ------------------------------ Header ------------------------------ */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p
              data-reveal="eyebrow"
              className="flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.3em] text-gold-ink uppercase"
            >
              <span>02</span>
              <span className="h-px w-12 bg-gold/60" />
              Services
            </p>
            {services.title && (
              <h2
                id="services-title"
                className="mt-6 font-display text-[clamp(2.4rem,4.6vw,4rem)] leading-[1.02] font-light tracking-[-0.03em] text-balance"
              >
                <span data-reveal="title" className="inline-block">
                  {lead}
                </span>{" "}
                {accent && (
                  <span data-reveal="title" className="text-gold-gradient inline-block pr-[0.08em] italic">
                    {accent}
                  </span>
                )}
              </h2>
            )}
          </div>
          {services.description && (
            <p
              data-reveal="lede"
              className="max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem] lg:col-span-4 lg:justify-self-end lg:pb-2 lg:text-right"
            >
              {services.description}
            </p>
          )}
        </div>

        {/* --------------------------- Expanding cards --------------------------- */}
        <ul
          className="mt-10 flex h-[50rem] flex-col gap-3 sm:h-[46rem] lg:mt-12 lg:h-[clamp(30rem,calc(100svh-18rem),36rem)] lg:flex-row"
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => {
            window.clearTimeout(hoverTimer.current)
            setHovering(false)
          }}
        >
          {items.map((item, i) => (
            <ServiceCard
              key={`${i}-${item.title}`}
              item={item}
              index={i}
              total={items.length}
              isActive={active === i}
              enquiryHref={enquiryHref}
              onSelect={() => choose(i)}
              onDetails={() => openDetails(i)}
              onPointerEnter={(event) => onCardEnter(i, event)}
            />
          ))}
        </ul>

        {/* ------------------------------ Controls ------------------------------ */}
        {items.length > 1 && (
          <div data-reveal="controls" className="mt-6 flex items-center gap-5">
            <span className="font-mono text-[0.68rem] tracking-[0.2em] text-muted-foreground tabular-nums">
              <span className="text-gold-ink">{pad(active + 1)}</span> / {pad(items.length)}
            </span>

            <div className="flex flex-1 gap-1.5">
              {items.map((item, i) => (
                <button
                  key={`${i}-${item.title}`}
                  type="button"
                  aria-label={`Show ${item.title}`}
                  aria-current={active === i}
                  onClick={() => choose(i)}
                  className="group flex h-5 flex-1 items-center outline-none"
                >
                  <span className="relative h-0.5 w-full overflow-hidden rounded-full bg-border transition-colors group-hover:bg-gold/30 group-focus-visible:bg-gold/50">
                    {i < active && <span className="absolute inset-0 bg-gold/45" />}
                    {i === active && (
                      <span
                        // Remount restarts the fill each time a service opens
                        key={active}
                        className="absolute inset-0 origin-left bg-gold"
                        style={
                          autoplay
                            ? {
                                animation: `progress ${AUTOPLAY_MS}ms linear forwards`,
                                animationPlayState: playing ? "running" : "paused",
                              }
                            : undefined
                        }
                        onAnimationEnd={() => setActive((a) => (a + 1) % items.length)}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="glass" size="icon-lg" className="rounded-full" aria-label="Previous service" onClick={() => choose(active - 1)}>
                <ArrowLeft />
              </Button>
              <Button variant="glass" size="icon-lg" className="rounded-full" aria-label="Next service" onClick={() => choose(active + 1)}>
                <ArrowRight />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------- Full details ---------------------------- */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="gap-0 border-gold/20 bg-card p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-xl"
        >
          {current && (
            <div data-lenis-prevent className="h-full overflow-y-auto overscroll-contain">
              <div className="relative aspect-16/10 overflow-hidden">
                {current.image ? (
                  <Image src={current.image.src} alt={current.image.alt} fill sizes="(min-width: 640px) 576px, 100vw" className="object-cover" />
                ) : (
                  <div className="grid size-full place-items-center bg-linear-to-b from-muted to-card">
                    <Building2 className="size-20 text-gold/40" strokeWidth={1} />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-card via-card/30 to-transparent" />
                <span
                  aria-hidden
                  className="text-gold-gradient absolute bottom-2 left-6 font-display text-[6.5rem] leading-[0.85] font-light italic sm:left-9"
                >
                  {pad(detail + 1)}
                </span>
              </div>

              <div className="px-6 pt-4 pb-10 sm:px-9">
                <p className="font-mono text-[0.62rem] tracking-[0.3em] text-gold-ink uppercase">
                  Service {pad(detail + 1)} / {pad(items.length)}
                </p>
                <SheetTitle className="mt-3 font-display text-[2.4rem] leading-[1.05] font-light tracking-[-0.03em]">
                  <ServiceTitle title={current.title} />
                </SheetTitle>

                {current.intro.map((paragraph, k) =>
                  k === 0 ? (
                    <SheetDescription key={k} className="mt-4 text-[0.95rem] leading-relaxed">
                      {paragraph}
                    </SheetDescription>
                  ) : (
                    <p key={k} className="mt-3 text-[0.95rem] leading-relaxed text-muted-foreground">
                      {paragraph}
                    </p>
                  )
                )}

                {current.points.length > 0 && (
                  <ol className="mt-8 border-b border-border">
                    {current.points.map((point, k) => (
                      <li key={`${k}-${point.heading}`} className="flex gap-5 border-t border-border py-5">
                        <span className="pt-0.5 font-mono text-[0.62rem] tracking-[0.15em] text-gold-ink">
                          {pad(detail + 1)}.{k + 1}
                        </span>
                        <div>
                          {point.heading && <p className="text-[0.95rem] leading-snug font-medium">{point.heading}</p>}
                          {point.body && (
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{point.body}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}

                {enquiryHref && (
                  <Button asChild variant="gold" size="xl" className="mt-8">
                    <Link href={enquiryHref} onClick={() => setSheetOpen(false)}>
                      Ask about {current.title.toLowerCase()}
                      <ArrowUpRight className="transition-transform duration-300 group-hover/button:rotate-45" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </section>
  )
}

function ServiceCard({
  item,
  index,
  total,
  isActive,
  enquiryHref,
  onSelect,
  onDetails,
  onPointerEnter,
}: {
  item: ServiceItem
  index: number
  total: number
  isActive: boolean
  enquiryHref?: string
  onSelect: () => void
  onDetails: () => void
  onPointerEnter: (event: React.PointerEvent) => void
}) {
  const panelId = `service-panel-${index}`
  const headings = item.points.map((point) => point.heading).filter(Boolean)

  // Each line of the open card fades up in turn
  const fade = cn(
    "transition-[opacity,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
    isActive ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
  )
  const delay = (step: number) => ({ transitionDelay: isActive ? `${260 + step * 80}ms` : "0ms" })

  return (
    <li
      data-reveal="card"
      onPointerEnter={onPointerEnter}
      className={cn(
        "group/card relative isolate min-h-17 min-w-0 basis-0 overflow-hidden rounded-[1.75rem] border bg-card transition-[flex-grow,border-color,box-shadow] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] lg:min-h-0 lg:min-w-18",
        // Width of the text panel beside the image in the open card
        "lg:[--panel:clamp(21rem,31vw,27rem)]",
        isActive
          ? "grow-[8] border-gold/40 shadow-[0_30px_90px_-30px_color-mix(in_oklab,var(--gold)_35%,transparent)]"
          : "grow border-border hover:border-gold/30"
      )}
    >
      {/* ------------------------------- Image -------------------------------
          Fills the closed strip; when open it gives way to the text panel
          (below it on mobile, beside it on desktop) so nothing covers the photo. */}
      <div
        className={cn(
          "absolute inset-0 overflow-hidden transition-[right,bottom] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
          isActive && "bottom-[56%] lg:right-(--panel) lg:bottom-0"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 transition-[scale,filter] duration-[1.4s] ease-[cubic-bezier(0.22,1,0.36,1)]",
            isActive
              ? "scale-100 group-hover/card:scale-[1.04]"
              : "scale-115 brightness-[0.45] saturate-[0.35] group-hover/card:brightness-[0.65]"
          )}
        >
          {item.image ? (
            <Image
              src={item.image.src}
              alt={item.image.alt}
              fill
              sizes="(min-width: 1280px) 560px, (min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="grid size-full place-items-center bg-linear-to-b from-muted to-card">
              <Building2 className="size-16 text-gold/40" strokeWidth={1} />
            </div>
          )}
        </div>

        {/* Light shading only at the bottom, behind the numeral */}
        <div
          className={cn(
            "absolute inset-0 bg-linear-to-t from-black/55 via-black/0 to-black/0 transition-opacity duration-700",
            isActive ? "opacity-100" : "opacity-0"
          )}
        />

        <span
          aria-hidden
          className={cn(
            "absolute top-4 left-4 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 font-mono text-[0.6rem] tracking-[0.25em] text-white uppercase backdrop-blur-md transition-opacity duration-500",
            isActive ? "opacity-100 delay-300" : "opacity-0"
          )}
        >
          {pad(index + 1)} / {pad(total)}
        </span>

        <div aria-hidden className="absolute bottom-1 left-5 overflow-hidden pr-3">
          <span
            className={cn(
              "text-gold-gradient block font-display text-[clamp(4rem,7vw,6.5rem)] leading-[0.9] font-light tracking-[-0.05em] italic transition-[opacity,translate] duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]",
              isActive ? "translate-y-0 opacity-100 delay-300" : "translate-y-full opacity-0"
            )}
          >
            {pad(index + 1)}
          </span>
        </div>
      </div>

      {/* Whole-card trigger; stays mounted so keyboard focus is never lost */}
      <button
        type="button"
        aria-expanded={isActive}
        aria-controls={panelId}
        aria-label={item.title}
        onClick={onSelect}
        className="absolute inset-0 z-[1] rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-inset"
      />

      {/* --------------------------- Closed label --------------------------- */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-[2] flex items-center gap-4 bg-linear-to-r from-black/45 to-transparent px-5 transition-opacity duration-500 lg:flex-col lg:justify-between lg:bg-linear-to-t lg:px-0 lg:py-6",
          isActive ? "opacity-0" : "opacity-100 delay-300"
        )}
      >
        <span className="font-mono text-[0.7rem] tracking-[0.15em] text-gold-light">{pad(index + 1)}</span>
        <span className="flex-1 truncate font-display text-xl text-white drop-shadow-[0_2px_10px_rgb(0_0_0/0.6)] lg:flex-none lg:rotate-180 lg:text-[1.6rem] lg:[writing-mode:vertical-rl]">
          {item.title}
        </span>
        <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-sm transition-all duration-500 group-hover/card:rotate-90 group-hover/card:border-gold/60 group-hover/card:text-gold-light">
          <Plus className="size-3.5" />
        </span>
      </div>

      {/* ----------------------------- Text panel ----------------------------- */}
      <div
        id={panelId}
        inert={!isActive}
        className={cn(
          "pointer-events-none absolute inset-x-0 top-[44%] bottom-0 z-[2] flex flex-col justify-center overflow-hidden bg-card p-5 transition-opacity duration-500 sm:p-7 lg:top-0 lg:left-auto lg:w-(--panel) lg:border-l lg:border-gold/15 lg:p-8 xl:p-9",
          isActive ? "opacity-100 delay-200" : "opacity-0"
        )}
      >
        {/* Soft glow in the panel corner */}
        <div
          aria-hidden
          className="absolute -top-24 -right-24 size-64 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--emerald)_20%,transparent),transparent)]"
        />

        <div className="relative">
          <p className={fade} style={delay(0)}>
            <span className="flex items-center gap-3 font-mono text-[0.62rem] tracking-[0.3em] text-gold-ink uppercase">
              <span className="relative grid size-3 place-items-center">
                <span className="absolute inset-0 animate-ping-slow rounded-full bg-gold/40" />
                <span className="size-1.5 rounded-full bg-gold" />
              </span>
              Service {pad(index + 1)}
            </span>
          </p>

          <h3
            style={delay(1)}
            className={cn(
              fade,
              "mt-3 font-display text-[clamp(1.85rem,2.5vw,2.5rem)] leading-[1.05] font-light tracking-[-0.03em] text-foreground"
            )}
          >
            <ServiceTitle title={item.title} />
          </h3>

          {item.intro[0] && (
            <p
              style={delay(2)}
              className={cn(fade, "mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/75 sm:text-[0.93rem]")}
            >
              {item.intro[0]}
            </p>
          )}

          {headings.length > 0 && (
            <ul className="mt-5 hidden gap-2.5 border-t border-border pt-5 lg:grid">
              {headings.map((heading, k) => (
                <li
                  key={`${k}-${heading}`}
                  style={delay(3 + k)}
                  className={cn(fade, "flex items-start gap-3 text-[0.85rem] leading-snug text-foreground")}
                >
                  <span className="relative mt-[0.4em] grid size-2 shrink-0 place-items-center">
                    <span className="absolute inset-0 rounded-full bg-emerald/50 blur-[3px]" />
                    <span className="size-1.5 rounded-full bg-emerald" />
                  </span>
                  {heading}
                </li>
              ))}
            </ul>
          )}

          <div
            style={delay(3 + headings.length)}
            className={cn(fade, "pointer-events-auto mt-6 flex items-center gap-3")}
          >
            <Button variant="gold" size="xl" onClick={onDetails}>
              View details
              <ArrowUpRight className="transition-transform duration-300 group-hover/button:rotate-45" />
            </Button>
            {enquiryHref && (
              <Link
                href={enquiryHref}
                aria-label={`Ask about ${item.title}`}
                className="grid size-12 place-items-center rounded-full border border-border bg-background/50 transition-all duration-500 hover:rotate-45 hover:border-gold/60 hover:text-gold-ink"
              >
                <ArrowUpRight className="size-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
