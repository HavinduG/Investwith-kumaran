"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useReducedMotion } from "framer-motion"
import { ArrowUpRight, Building2, MapPin, MessageCircle, Sparkles } from "lucide-react"

import { categoryLabel, FactIcon } from "@/components/properties/fact-icon"
import { Button } from "@/components/ui/button"
import { projectHref } from "@/lib/routes"
import { cn, externalLinkProps } from "@/lib/utils"
import { withWhatsAppMessage } from "@/lib/whatsapp"
import type { CmsLink, ProjectSummary } from "@/lib/wordpress"

const pad = (n: number) => String(n).padStart(2, "0")

// Photos advance on their own at this pace until a thumbnail is picked
const AUTOPLAY_MS = 5000
const THUMBS = 4

/** Large spotlight card for one property: photo gallery on the left, details on the right. */
export function FeaturedProject({
  project,
  whatsappCta,
}: {
  project: ProjectSummary
  whatsappCta: CmsLink | null
}) {
  const reduceMotion = useReducedMotion()
  const [active, setActive] = useState(0)
  const [auto, setAuto] = useState(true)
  const [hovered, setHovered] = useState(false)
  const { images } = project
  const href = projectHref(project.slug)
  const extra = images.length - THUMBS

  useEffect(() => {
    if (!auto || hovered || reduceMotion || images.length < 2) return
    const timer = window.setTimeout(() => setActive((a) => (a + 1) % images.length), AUTOPLAY_MS)
    return () => window.clearTimeout(timer)
  }, [active, auto, hovered, reduceMotion, images.length])

  const pick = (i: number) => {
    setActive(i)
    setAuto(false)
  }

  // Soft light that follows the cursor across the card
  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`)
  }

  return (
    <article
      data-featured
      aria-labelledby="featured-project-title"
      onPointerMove={onPointerMove}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className="group/featured relative isolate grid grid-cols-1 overflow-hidden rounded-[1.5rem] border border-gold/25 bg-card shadow-[0_50px_120px_-60px_color-mix(in_oklab,var(--gold)_55%,transparent)] [--mx:75%] [--my:20%] sm:rounded-[2rem] lg:grid-cols-12"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(520px_circle_at_var(--mx)_var(--my),color-mix(in_oklab,var(--gold)_10%,transparent),transparent_70%)] opacity-0 transition-opacity duration-700 group-hover/featured:opacity-100"
      />

      {/* -------------------------------- Gallery -------------------------------- */}
      <div className="relative aspect-4/3 min-w-0 overflow-hidden bg-muted sm:aspect-16/10 lg:col-span-7 lg:aspect-auto lg:min-h-136">
        <div data-featured-parallax className="absolute inset-x-0 inset-y-[-6%]">
          {images.length ? (
            images.map((image, i) => (
              <Image
                key={image.src}
                src={image.src}
                alt={i === active ? image.alt : ""}
                fill
                preload={i === 0}
                sizes="(min-width: 1280px) 760px, (min-width: 1024px) 58vw, 100vw"
                className={cn(
                  "object-cover transition-[opacity,scale] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  i === active ? "scale-100 opacity-100 duration-[1.4s]" : "scale-110 opacity-0 duration-1000"
                )}
              />
            ))
          ) : (
            <div className="grid size-full place-items-center bg-linear-to-b from-muted to-card">
              <Building2 className="size-20 text-gold/40" strokeWidth={1} />
            </div>
          )}
        </div>

        {/* Shade only at the edges, behind the badges and thumbnails */}
        <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/50 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-linear-to-t from-black/60 to-transparent" />

        <div className="absolute inset-x-4 top-4 flex flex-wrap items-center gap-2 sm:inset-x-5 sm:top-5">
          <span className="flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 font-mono text-[0.6rem] font-medium tracking-[0.2em] text-gold-foreground uppercase shadow-[0_6px_24px_-6px_var(--gold)]">
            <Sparkles className="size-3" />
            Featured
          </span>
          {project.category && (
            <span className="rounded-full border border-emerald/50 bg-black/35 px-3 py-1 font-mono text-[0.6rem] tracking-[0.2em] text-white uppercase backdrop-blur-md">
              <span className="mr-1.5 inline-block size-1.5 rounded-full bg-emerald align-middle shadow-[0_0_8px_var(--emerald)]" />
              {categoryLabel(project.category)}
            </span>
          )}
          {images.length > 1 && (
            <span className="ml-auto rounded-full border border-white/20 bg-black/35 px-3 py-1 font-mono text-[0.62rem] text-white tabular-nums backdrop-blur-md">
              {pad(active + 1)} / {pad(images.length)}
            </span>
          )}
        </div>

        {images.length > 1 && (
          <div className="absolute inset-x-4 bottom-4 flex items-end gap-1.5 sm:inset-x-5 sm:bottom-5 sm:gap-2">
            {images.slice(0, THUMBS).map((image, i) => (
              <button
                key={image.src}
                type="button"
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === active}
                onClick={() => pick(i)}
                className={cn(
                  // Thumbnails share the strip on small screens, capped at their desktop size
                  "relative aspect-4/3 max-w-20 min-w-0 flex-1 overflow-hidden rounded-lg border-2 outline-none transition-all duration-500 focus-visible:ring-2 focus-visible:ring-gold",
                  i === active
                    ? "-translate-y-1 border-gold shadow-[0_8px_24px_-6px_var(--gold)]"
                    : "border-white/20 opacity-75 hover:-translate-y-0.5 hover:border-white/50 hover:opacity-100"
                )}
              >
                <Image src={image.src} alt="" fill sizes="80px" className="object-cover" />
                {/* Time until the next photo */}
                {i === active && auto && !reduceMotion && (
                  <span
                    key={active}
                    className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gold"
                    style={{
                      animation: `progress ${AUTOPLAY_MS}ms linear forwards`,
                      animationPlayState: hovered ? "paused" : "running",
                    }}
                  />
                )}
              </button>
            ))}
            {extra > 0 && (
              <Link
                href={href}
                aria-label={`See all ${images.length} photos`}
                className="grid aspect-4/3 max-w-20 min-w-0 flex-1 place-items-center rounded-lg border-2 border-white/20 bg-black/45 font-mono text-xs text-white backdrop-blur-md transition-colors hover:border-gold hover:text-gold-light"
              >
                +{extra}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* -------------------------------- Details -------------------------------- */}
      <div className="relative flex min-w-0 flex-col p-5 sm:p-8 lg:col-span-5 lg:p-10">
        <div
          aria-hidden
          className="absolute -top-28 -right-28 -z-10 size-72 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--emerald)_22%,transparent),transparent)]"
        />

        {project.location && (
          <p data-featured-item className="flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.25em] text-gold-ink uppercase">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{project.location}</span>
          </p>
        )}

        <h3
          id="featured-project-title"
          data-featured-item
          className="mt-4 font-display text-[clamp(1.75rem,3.4vw,3rem)] leading-[1.06] font-light tracking-[-0.03em] text-balance wrap-break-word"
        >
          <Link href={href} className="outline-none hover:text-gold-ink focus-visible:text-gold-ink">
            {project.title}
          </Link>
        </h3>

        {project.summary && (
          <p data-featured-item className="mt-4 line-clamp-3 text-[0.93rem] leading-relaxed text-foreground/75">
            {project.summary}
          </p>
        )}

        <p
          data-featured-item
          className="text-gold-gradient mt-5 font-display text-[clamp(1.7rem,3vw,2.6rem)] leading-none wrap-break-word sm:mt-6"
        >
          {project.price || "Price on request"}
        </p>

        {project.facts.length > 0 && (
          <ul data-featured-item className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-3 sm:gap-2.5">
            {project.facts.slice(0, 3).map((fact) => (
              <li
                key={fact.label}
                className="min-w-0 rounded-xl border border-border bg-background/40 px-3 py-2.5 transition-colors duration-500 last:odd:col-span-2 hover:border-gold/40 sm:px-3.5 sm:py-3 sm:last:odd:col-span-1"
              >
                <p className="flex items-center gap-1.5 font-mono text-[0.56rem] tracking-[0.2em] text-muted-foreground uppercase">
                  <FactIcon label={fact.label} className="size-3 text-gold-ink" />
                  {fact.label}
                </p>
                <p className="mt-1.5 text-sm leading-snug font-medium wrap-break-word">{fact.value}</p>
              </li>
            ))}
          </ul>
        )}

        <div className="min-h-6 flex-1" />

        <div
          data-featured-item
          className="grid grid-cols-1 gap-2.5 border-t border-border pt-5 sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:pt-6"
        >
          {whatsappCta && (
            <Button
              asChild
              size="xl"
              className="w-full bg-emerald text-white shadow-[0_10px_40px_-12px_var(--emerald)] hover:bg-emerald/90 sm:w-auto"
            >
              <Link
                href={withWhatsAppMessage(whatsappCta.href, `Hi Kamran, I'm interested in ${project.title}. Could you share more details?`)}
                {...externalLinkProps(whatsappCta.href)}
              >
                <MessageCircle />
                {whatsappCta.label}
              </Link>
            </Button>
          )}
          <Button asChild variant="glass" size="xl" className="w-full sm:w-auto">
            <Link href={href}>
              View project
              <ArrowUpRight className="transition-transform duration-300 group-hover/button:rotate-45" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
