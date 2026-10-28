"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion"
import { ArrowUpRight, Building2, Images, MapPin } from "lucide-react"

import { categoryLabel, FactIcon } from "@/components/properties/fact-icon"
import { projectHref } from "@/lib/routes"
import { cn } from "@/lib/utils"
import type { ProjectSummary } from "@/lib/wordpress"

// Hovering a card flips through its photos at this pace
const SLIDE_MS = 1300
const MAX_SLIDES = 4

export function ProjectCard({
  project,
  index,
  className,
  imageClassName,
}: {
  project: ProjectSummary
  index: number
  className?: string
  /** Sizing for the photo area, e.g. a fixed height inside the scrolling rail. */
  imageClassName?: string
}) {
  const reduceMotion = useReducedMotion()
  const [hovered, setHovered] = useState(false)
  const [slide, setSlide] = useState(0)
  const slides = project.images.slice(0, MAX_SLIDES)

  // Cursor-following "View" bubble
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const bubbleX = useSpring(x, { stiffness: 260, damping: 24, mass: 0.5 })
  const bubbleY = useSpring(y, { stiffness: 260, damping: 24, mass: 0.5 })
  const media = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!hovered || reduceMotion || slides.length < 2) return
    const timer = window.setInterval(() => setSlide((s) => (s + 1) % slides.length), SLIDE_MS)
    return () => window.clearInterval(timer)
  }, [hovered, reduceMotion, slides.length])

  const onPointerMove = (event: React.PointerEvent) => {
    if (event.pointerType !== "mouse" || !media.current) return
    const rect = media.current.getBoundingClientRect()
    x.set(event.clientX - rect.left)
    y.set(event.clientY - rect.top)
  }

  return (
    <Link
      href={projectHref(project.slug)}
      data-project-card
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={() => {
        setHovered(false)
        setSlide(0)
      }}
      onPointerMove={onPointerMove}
      className={cn(
        "group/project relative flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card outline-none transition-[border-color,box-shadow,translate] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_40px_90px_-40px_color-mix(in_oklab,var(--gold)_45%,transparent)] focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/40",
        className
      )}
    >
      {/* -------------------------------- Photos -------------------------------- */}
      <div
        ref={media}
        className={cn("relative aspect-4/3 overflow-hidden bg-muted md:cursor-none", imageClassName)}
      >
        <div data-project-parallax className="absolute inset-y-0 -inset-x-[8%]">
          {slides.length ? (
            slides.map((image, i) => (
              <Image
                key={image.src}
                src={image.src}
                alt={i === 0 ? image.alt : ""}
                fill
                sizes="(min-width: 1024px) 460px, (min-width: 640px) 60vw, 88vw"
                className={cn(
                  "object-cover transition-[opacity,scale] duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  i === slide ? "opacity-100" : "opacity-0",
                  hovered ? "scale-[1.06]" : "scale-100"
                )}
              />
            ))
          ) : (
            <div className="grid size-full place-items-center bg-linear-to-b from-muted to-card">
              <Building2 className="size-16 text-gold/40" strokeWidth={1} />
            </div>
          )}
        </div>

        {/* Shade only along the top edge, behind the badges */}
        <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/45 to-transparent" />

        <div className="absolute inset-x-4 top-4 flex items-center justify-between gap-3">
          {project.category && (
            <span className="rounded-full bg-gold px-3 py-1 font-mono text-[0.6rem] font-medium tracking-[0.2em] text-gold-foreground uppercase shadow-[0_6px_20px_-6px_var(--gold)]">
              {categoryLabel(project.category)}
            </span>
          )}
          {project.images.length > 1 && (
            <span className="ml-auto flex items-center gap-1.5 rounded-full border border-white/20 bg-black/35 px-2.5 py-1 font-mono text-[0.6rem] text-white backdrop-blur-md">
              <Images className="size-3" />
              {project.images.length}
            </span>
          )}
        </div>

        {/* Slide indicators */}
        {slides.length > 1 && (
          <div className="absolute inset-x-4 bottom-4 flex gap-1.5 opacity-0 transition-opacity duration-500 group-hover/project:opacity-100">
            {slides.map((image, i) => (
              <span key={image.src} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
                <span
                  className={cn(
                    "block h-full origin-left bg-white transition-transform",
                    i < slide ? "scale-x-100 duration-0" : i === slide && hovered ? "scale-x-100 ease-linear" : "scale-x-0 duration-0"
                  )}
                  style={i === slide && hovered ? { transitionDuration: `${SLIDE_MS}ms` } : undefined}
                />
              </span>
            ))}
          </div>
        )}

        <AnimatePresence>
          {hovered && !reduceMotion && (
            <motion.span
              aria-hidden
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              style={{ x: bubbleX, y: bubbleY }}
              className="pointer-events-none absolute top-0 left-0 z-10 -mt-11 -ml-11 hidden size-22 place-items-center rounded-full bg-gold/90 text-[0.7rem] font-medium tracking-[0.15em] text-gold-foreground uppercase shadow-[0_10px_40px_-8px_var(--gold)] backdrop-blur-sm md:grid"
            >
              View
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* --------------------------------- Info --------------------------------- */}
      <div className="relative flex flex-1 flex-col p-5 sm:p-6">
        <span
          aria-hidden
          className="absolute top-4 right-5 font-display text-4xl leading-none font-light text-foreground/10 italic transition-colors duration-500 group-hover/project:text-gold/30"
        >
          {String(index + 1).padStart(2, "0")}
        </span>

        {project.location && (
          <p className="flex items-center gap-1.5 pr-12 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0 text-gold-ink" />
            <span className="truncate">{project.location}</span>
          </p>
        )}

        <h3 className="mt-2.5 pr-10 font-display text-[1.6rem] leading-[1.1] font-light tracking-[-0.02em] text-foreground">
          {project.title}
        </h3>

        {project.facts.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {project.facts.slice(0, 3).map((fact) => (
              <li
                key={fact.label}
                title={fact.label}
                className="flex items-center gap-1.5 rounded-full border border-border bg-background/40 px-2.5 py-1 text-[0.72rem] text-foreground/85"
              >
                <FactIcon label={fact.label} className="size-3.5 text-gold-ink" />
                <span className="sr-only">{fact.label}: </span>
                {fact.value}
              </li>
            ))}
          </ul>
        )}

        {/* Pins the price row to the bottom when cards share a height */}
        <div className="min-h-5 flex-1" />

        <div className="flex items-end justify-between gap-4 border-t border-border pt-4">
          <div className="min-w-0">
            <p className="font-mono text-[0.58rem] tracking-[0.25em] text-muted-foreground uppercase">Price</p>
            <p className="text-gold-gradient mt-1 truncate font-display text-lg leading-tight">
              {project.price || "On request"}
            </p>
          </div>
          <span className="grid size-10 shrink-0 place-items-center rounded-full border border-border transition-all duration-500 group-hover/project:rotate-45 group-hover/project:border-gold group-hover/project:bg-gold group-hover/project:text-gold-foreground">
            <ArrowUpRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  )
}
