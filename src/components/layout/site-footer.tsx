"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring } from "framer-motion"
import { ArrowUp, ArrowUpRight, CalendarDays, MessageCircle } from "lucide-react"

import { SocialIcon, socialLabel } from "@/components/contact/social-icon"
import { Magnetic } from "@/components/motion/magnetic"
import { Button } from "@/components/ui/button"
import { gsap, useGSAP } from "@/lib/gsap"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { FooterContent, SocialLink } from "@/lib/wordpress"

const isExternal = (href: string) => /^https?:\/\//.test(href)

// Width (in the wordmark's 1000-unit viewBox) the giant footer title spans
const WORDMARK_WIDTH = 960

export function SiteFooter({
  footer,
  socials,
  note,
}: {
  footer: FooterContent
  socials: SocialLink[]
  note: string
}) {
  const root = useRef<HTMLElement>(null)
  const title = footer.title || siteConfig.name
  const words = title.split(" ")

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
            defaults: { ease: "expo.out", duration: 1.1 },
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          })
          .fromTo(q("[data-reveal='line']"), { autoAlpha: 1, scaleX: 0 }, { scaleX: 1, duration: 1.6, ease: "expo.inOut" })
          .fromTo(q("[data-reveal='eyebrow']"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0 }, "-=1")
          .fromTo(
            q("[data-reveal='char']"),
            { autoAlpha: 1, yPercent: 115 },
            { yPercent: 0, duration: 1.1, stagger: 0.025 },
            "-=0.9"
          )
          .fromTo(q("[data-reveal='cta']"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.1 }, "-=0.8")
          .fromTo(q("[data-reveal='col']"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, stagger: 0.08 }, "-=0.7")

        // Giant wordmark rises as the page reaches its end
        gsap.fromTo(
          q("[data-reveal='wordmark']"),
          { autoAlpha: 1, yPercent: 40 },
          {
            yPercent: 0,
            ease: "none",
            scrollTrigger: { trigger: q("[data-reveal='wordmark']")[0], start: "top bottom", end: "bottom bottom", scrub: 0.8 },
          }
        )
      })

      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <footer ref={root} data-anim-root className="relative isolate mt-10 overflow-hidden" aria-labelledby="footer-title">
      {/* Background: soft lights and a top hairline with a travelling streak */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -bottom-1/2 left-1/2 size-240 -translate-x-1/2 animate-aurora rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--gold)_12%,transparent),transparent)]" />
        <div className="absolute -top-40 -left-40 size-128 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--emerald)_14%,transparent),transparent)]" />
      </div>
      <div data-reveal="line" className="relative h-px origin-center overflow-hidden bg-linear-to-r from-transparent via-gold/50 to-transparent">
        <span className="absolute inset-y-0 w-32 animate-streak bg-linear-to-r from-transparent via-gold-light to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-5 pt-16 sm:px-8 lg:pt-24">
        {/* ------------------------------- Call to action ------------------------------- */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p
              data-reveal="eyebrow"
              className="flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.3em] text-gold-ink uppercase"
            >
              <span className="relative grid size-2 place-items-center">
                <span className="absolute size-2 animate-ping-slow rounded-full bg-gold/60" />
                <span className="size-1.5 rounded-full bg-gold" />
              </span>
              Your next step in Dubai real estate
            </p>
            <h2
              id="footer-title"
              aria-label={title}
              className="mt-6 font-display text-[clamp(2.8rem,7vw,6.5rem)] leading-[0.95] font-light tracking-[-0.04em]"
            >
              {words.map((word, w) => {
                const last = w === words.length - 1
                return (
                  <span key={w} aria-hidden className="mr-[0.22em] inline-flex overflow-hidden pb-[0.1em] align-bottom last:mr-0">
                    {Array.from(word).map((char, c) => (
                      <span
                        key={c}
                        data-reveal="char"
                        className={cn("inline-block", last && "text-gold-gradient italic", last && c === word.length - 1 && "pr-[0.08em]")}
                      >
                        {char}
                      </span>
                    ))}
                  </span>
                )
              })}
            </h2>
          </div>

          {(footer.whatsapp || footer.booking) && (
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end lg:pb-3">
              {footer.whatsapp && (
                <Magnetic>
                  <Button
                    asChild
                    size="xl"
                    data-reveal="cta"
                    className="bg-emerald text-white shadow-[0_10px_40px_-12px_var(--emerald)] hover:bg-emerald/90"
                  >
                    <Link
                      href={footer.whatsapp.href}
                      {...(isExternal(footer.whatsapp.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      <MessageCircle />
                      {footer.whatsapp.label}
                    </Link>
                  </Button>
                </Magnetic>
              )}
              {footer.booking && (
                <Magnetic>
                  <Button asChild variant="gold" size="xl" data-reveal="cta">
                    <Link
                      href={footer.booking.href}
                      {...(isExternal(footer.booking.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      <CalendarDays />
                      {footer.booking.label}
                      <ArrowUpRight className="transition-transform duration-300 group-hover/button:rotate-45" />
                    </Link>
                  </Button>
                </Magnetic>
              )}
            </div>
          )}
        </div>

        {/* --------------------------------- Columns --------------------------------- */}
        <div className="mt-16 grid gap-12 border-t border-border pt-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-12">
          <div data-reveal="col" className="sm:col-span-2 lg:col-span-5">
            <Link href="/" aria-label={`${title} — home`} className="inline-flex items-center gap-3">
              {footer.logo ? (
                <span className="relative block h-10 w-40">
                  <Image src={footer.logo.src} alt="" fill sizes="160px" className="object-contain object-left" />
                </span>
              ) : (
                <>
                  <span className="grid size-10 place-items-center rounded-full border border-gold/40 bg-gold/10 font-display text-lg text-gold-ink italic">
                    {title.trim().charAt(0)}
                  </span>
                  <span className="font-display text-xl">{title}</span>
                </>
              )}
            </Link>
            {note && <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">{note}</p>}

            {socials.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-2">
                {socials.map((social) => (
                  <li key={social.href}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${socialLabel(social.name)} (opens in a new tab)`}
                      className="group flex items-center gap-2 rounded-full border border-border py-2 pr-4 pl-2.5 text-xs text-foreground/80 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:text-foreground"
                    >
                      <span className="grid size-6 place-items-center rounded-full bg-muted transition-colors duration-300 group-hover:bg-gold group-hover:text-gold-foreground">
                        <SocialIcon social={social} className="size-3.5" />
                      </span>
                      {socialLabel(social.name)}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {footer.groups.map((group) => (
            <nav key={group.title} data-reveal="col" aria-label={group.title} className="lg:col-span-2">
              <p className="font-mono text-[0.62rem] tracking-[0.25em] text-gold-ink uppercase">{group.title}</p>
              <ul className="mt-5 space-y-3">
                {group.links.map((link) => (
                  <li key={`${link.label}-${link.href}`}>
                    <Link href={link.href} className="group inline-flex items-center gap-2 text-sm text-foreground/75 transition-colors hover:text-foreground">
                      <span className="h-px w-0 bg-gold transition-[width] duration-300 group-hover:w-4" />
                      <span className="capitalize">{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div data-reveal="col" className="flex items-start sm:justify-end lg:col-span-3 lg:col-start-10">
            <BackToTop />
          </div>
        </div>

        {/* -------------------------------- Bottom bar -------------------------------- */}
        <div className="mt-14 flex flex-col gap-3 border-t border-border py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {footer.year} {title}. All rights reserved.
          </p>
          <p className="font-mono text-[0.62rem] tracking-[0.2em] uppercase">Dubai · United Arab Emirates</p>
        </div>
      </div>

      {/* --------------------------- Interactive wordmark --------------------------- */}
      <Wordmark text={title} />
    </footer>
  )
}

/** Oversized outlined wordmark; a gold light follows the cursor and fills the letters beneath it. */
function Wordmark({ text }: { text: string }) {
  const reduceMotion = useReducedMotion()
  const svg = useRef<SVGSVGElement>(null)
  // Size the type from the text length so it spans the width without distorting glyphs
  const fontSize = Math.min(220, Math.round(WORDMARK_WIDTH / (Math.max(text.length, 1) * 0.5)))
  const height = Math.round(fontSize * 1.08)
  const baseline = Math.round(fontSize * 0.86)
  const x = useMotionValue(-400)
  const y = useMotionValue(80)
  const cx = useSpring(x, { stiffness: 200, damping: 26, mass: 0.6 })
  const cy = useSpring(y, { stiffness: 200, damping: 26, mass: 0.6 })

  const onPointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (reduceMotion || !svg.current) return
    const rect = svg.current.getBoundingClientRect()
    x.set(((event.clientX - rect.left) / rect.width) * 1000)
    y.set(((event.clientY - rect.top) / rect.height) * height)
  }

  return (
    <div data-reveal="wordmark" aria-hidden className="mx-auto w-full max-w-[100rem] px-3 select-none">
      <svg
        ref={svg}
        viewBox={`0 0 1000 ${height}`}
        onPointerMove={onPointerMove}
        onPointerLeave={() => {
          x.set(-400)
          y.set(80)
        }}
        className="block w-full font-display"
      >
        <defs>
          <linearGradient id="footer-wordmark-gold" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--gold-deep)" />
            <stop offset="45%" stopColor="var(--gold-light)" />
            <stop offset="100%" stopColor="var(--gold)" />
          </linearGradient>
          <radialGradient id="footer-wordmark-falloff">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="footer-wordmark-mask">
            <motion.circle cx={cx} cy={cy} r={170} fill="url(#footer-wordmark-falloff)" />
          </mask>
          {/* Fade the letters out toward the page edge */}
          <linearGradient id="footer-wordmark-fade" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor="white" stopOpacity="0.15" />
          </linearGradient>
          <mask id="footer-wordmark-edge">
            <rect width="1000" height={height} fill="url(#footer-wordmark-fade)" />
          </mask>
        </defs>

        <g mask="url(#footer-wordmark-edge)">
          <text
            x="500"
            y={baseline}
            textAnchor="middle"
            textLength={WORDMARK_WIDTH}
            lengthAdjust="spacing"
            fontSize={fontSize}
            fontWeight="300"
            fill="none"
            stroke="var(--foreground)"
            strokeOpacity="0.18"
            strokeWidth="1"
          >
            {text}
          </text>
          <text
            x="500"
            y={baseline}
            textAnchor="middle"
            textLength={WORDMARK_WIDTH}
            lengthAdjust="spacing"
            fontSize={fontSize}
            fontWeight="300"
            fill="url(#footer-wordmark-gold)"
            mask="url(#footer-wordmark-mask)"
          >
            {text}
          </text>
        </g>
      </svg>
    </div>
  )
}

/** Returns to the top of the page; the ring fills with scroll progress. */
function BackToTop() {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  return (
    <a
      href="#main"
      className="group flex items-center gap-4 text-sm text-foreground/80 transition-colors hover:text-foreground"
    >
      <span className="font-mono text-[0.62rem] tracking-[0.25em] uppercase">Back to top</span>
      <span className="relative grid size-14 place-items-center">
        <svg viewBox="0 0 56 56" className="absolute inset-0 size-full -rotate-90" aria-hidden>
          <circle cx="28" cy="28" r="26" fill="none" stroke="var(--border)" strokeWidth="1.5" />
          <motion.circle
            cx="28"
            cy="28"
            r="26"
            fill="none"
            stroke="var(--gold)"
            strokeWidth="1.5"
            strokeLinecap="round"
            style={{ pathLength: progress }}
          />
        </svg>
        <span className="grid size-10 place-items-center rounded-full bg-gold/10 text-gold-ink transition-all duration-500 group-hover:-translate-y-1 group-hover:bg-gold group-hover:text-gold-foreground">
          <ArrowUp className="size-4" />
        </span>
      </span>
    </a>
  )
}
