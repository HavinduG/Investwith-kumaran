"use client"

import { useRef } from "react"
import Link from "next/link"
import { ArrowUpRight, MessageCircle, Mouse } from "lucide-react"

import { Magnetic } from "@/components/motion/magnetic"
import { Button } from "@/components/ui/button"
import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap"
import type { CmsLink, HeroContent } from "@/lib/wordpress"
import { HeroBackdrop } from "./hero-backdrop"
import { HeroMarquee } from "./hero-marquee"
import { HeroPortrait } from "./hero-portrait"
import { RoleRotator } from "./role-rotator"

export function HeroSection({ hero, bookingCta }: { hero: HeroContent; bookingCta: CmsLink | null }) {
  const root = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLElement>(null)
  const rolesRef = useRef<HTMLElement>(null)
  const progress = useRef(0)

  // Mouse spotlight that follows the cursor across the hero
  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`)
  }

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)

      // Scroll progress across hero + roles drives the 3D camera
      ScrollTrigger.create({
        trigger: el,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          progress.current = self.progress
        },
      })

      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(q("[data-reveal]"), { autoAlpha: 1 })
        el.setAttribute("data-anim-ready", "")
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(q("[data-reveal]"), { autoAlpha: 0 })
        el.setAttribute("data-anim-ready", "")

        /* ----------------------------- Intro ----------------------------- */
        const nameEl = q("[data-reveal='name']")[0]
        const split = SplitText.create(nameEl, { type: "chars", charsClass: "split-char" })

        const tl = gsap.timeline({ defaults: { ease: "expo.out", duration: 1.2 }, delay: 0.35 })
        tl.fromTo(q("[data-reveal='eyebrow']"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9 })
          .fromTo(
            q("[data-reveal='greeting']"),
            { autoAlpha: 0, y: 40, filter: "blur(10px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)" },
            "-=0.6"
          )
          .set(nameEl, { autoAlpha: 1 }, "-=0.9")
          .fromTo(
            split.chars,
            { yPercent: 115, rotateX: -95, autoAlpha: 0, filter: "blur(14px)", transformOrigin: "50% 100%" },
            {
              yPercent: 0,
              rotateX: 0,
              autoAlpha: 1,
              filter: "blur(0px)",
              duration: 1.5,
              stagger: 0.065,
              onComplete: () => split.revert(),
            },
            "<"
          )
          .fromTo(
            q("[data-reveal='copy']"),
            { autoAlpha: 0, y: 28 },
            { autoAlpha: 1, y: 0, stagger: 0.12 },
            "-=1.05"
          )
          .fromTo(
            q("[data-reveal='arch']"),
            { autoAlpha: 1, clipPath: "inset(100% 0% 0% 0% round 999px 999px 36px 36px)" },
            {
              clipPath: "inset(0% 0% 0% 0% round 999px 999px 36px 36px)",
              duration: 1.8,
              ease: "expo.inOut",
              clearProps: "clipPath",
            },
            0.2
          )
          .fromTo(q("[data-portrait-image]"), { scale: 1.35 }, { scale: 1, duration: 2.4, ease: "expo.out" }, 0.6)
          .fromTo(q("[data-reveal='arch-border']"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4 }, 1.3)
          .fromTo(
            q("[data-reveal='chip']"),
            { autoAlpha: 0, scale: 0.6, y: 30 },
            { autoAlpha: 1, scale: 1, y: 0, stagger: 0.14, ease: "back.out(1.8)", duration: 0.9 },
            1.5
          )
          .fromTo(
            q("[data-reveal='badge']"),
            { autoAlpha: 0, scale: 0, rotate: -160 },
            { autoAlpha: 1, scale: 1, rotate: 0, duration: 1.3, ease: "back.out(1.4)" },
            1.7
          )
          .fromTo(q("[data-reveal='marquee']"), { autoAlpha: 0, yPercent: 100 }, { autoAlpha: 1, yPercent: 0 }, 1.4)

        /* ------------------------ Scroll: hero exit ----------------------- */
        const heroExit = { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: 0.8 }
        gsap.to(q("[data-hero-copy]"), {
          yPercent: -22,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { ...heroExit, end: "75% top" },
        })
        gsap.to(q("[data-hero-portrait]"), {
          yPercent: -14,
          scale: 0.86,
          rotateX: 18,
          transformPerspective: 1200,
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: heroExit,
        })

        /* ---------------------- Scroll: roles reveal ---------------------- */
        const lines = q("[data-role-line]")
        const rolesTl = gsap.timeline({
          scrollTrigger: { trigger: rolesRef.current, start: "top 70%", end: "bottom bottom", scrub: 0.8 },
        })
        rolesTl.fromTo(q("[data-roles-kicker]"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0)
        lines.forEach((line, i) => {
          rolesTl
            .fromTo(
              line,
              { autoAlpha: 0, yPercent: 60, rotateX: -50 },
              { autoAlpha: 1, yPercent: 0, rotateX: 0, duration: 0.6, ease: "power3.out" },
              0.2 + i * 0.55
            )
            .fromTo(
              line.querySelector("[data-fill]"),
              { clipPath: "inset(0% 100% 0% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: 0.9, ease: "none" },
              0.45 + i * 0.55
            )
        })
        rolesTl.fromTo(q("[data-roles-cta]"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.4 })
      })

      document.fonts?.ready.then(() => ScrollTrigger.refresh())
      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <div ref={root} data-anim-root className="relative overflow-x-clip">
      <HeroBackdrop progress={progress} />

      {/* ------------------------------ Hero ------------------------------ */}
      <section
        ref={heroRef}
        id="hero"
        aria-labelledby="hero-title"
        onPointerMove={onPointerMove}
        className="relative flex min-h-svh flex-col [--mx:50%] [--my:40%]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hidden bg-[radial-gradient(520px_circle_at_var(--mx)_var(--my),color-mix(in_oklab,var(--gold)_13%,transparent),transparent_70%)] md:block"
        />

        <div className="relative mx-auto grid w-full max-w-7xl flex-1 items-center gap-16 px-5 pt-32 pb-20 sm:px-8 lg:grid-cols-12 lg:gap-8 lg:pt-28 lg:pb-16">
          <div data-hero-copy className="lg:col-span-7">
            <p
              data-reveal="eyebrow"
              className="inline-flex items-center gap-2.5 rounded-full border border-gold/30 bg-gold/8 py-1.5 pr-4 pl-2 font-mono text-[0.65rem] tracking-[0.2em] text-gold-ink uppercase backdrop-blur-sm"
            >
              <span className="relative grid size-4 place-items-center">
                <span className="absolute inset-0 animate-ping-slow rounded-full bg-emerald/60" />
                <span className="relative size-2 rounded-full bg-emerald" />
              </span>
              Available for consultations · Dubai
            </p>

            <h1 id="hero-title" className="mt-7 font-display tracking-tight">
              <span
                data-reveal="greeting"
                className="block text-[clamp(2.25rem,5.5vw,4.25rem)] leading-none font-light text-muted-foreground italic"
              >
                Hey, I&apos;m
              </span>
              <span
                data-reveal="name"
                className="text-gold-gradient -ml-1 block pb-3 text-[clamp(4.75rem,15vw,10.75rem)] leading-[0.88] font-normal tracking-[-0.035em] [perspective:900px] sm:-ml-2"
              >
                Kamran.
              </span>
              {hero.roles.length > 0 && <span className="sr-only">, {hero.roles.join(", ")}</span>}
            </h1>

            {hero.roles.length > 0 && (
              <p
                data-reveal="copy"
                aria-hidden
                className="mt-4 min-h-[2.6em] font-display text-[clamp(1.6rem,3.4vw,2.5rem)] leading-tight sm:min-h-[1.4em]"
              >
                <span className="mr-3 text-foreground">Your</span>
                <RoleRotator roles={hero.roles} />
              </p>
            )}

            {hero.description && (
              <p
                data-reveal="copy"
                className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
              >
                {hero.description}
              </p>
            )}

            <div data-reveal="copy" className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
              {hero.primaryCta && (
                <Magnetic>
                  <Button asChild variant="gold" size="xl">
                    <Link href={hero.primaryCta.href}>
                      <MessageCircle />
                      {hero.primaryCta.label}
                    </Link>
                  </Button>
                </Magnetic>
              )}
              {hero.secondaryCta && (
                <Magnetic>
                  <Button asChild variant="glass" size="xl">
                    <Link href={hero.secondaryCta.href}>
                      {hero.secondaryCta.label}
                      <ArrowUpRight className="transition-transform duration-300 group-hover/button:rotate-45" />
                    </Link>
                  </Button>
                </Magnetic>
              )}
            </div>

            <a
              data-reveal="copy"
              href="#roles"
              className="mt-12 hidden items-center gap-3 font-mono text-[0.65rem] tracking-[0.25em] text-muted-foreground uppercase transition-colors hover:text-foreground lg:inline-flex"
            >
              <Mouse className="size-4 animate-bounce text-gold-ink" />
              Scroll to explore
            </a>
          </div>

          <div data-hero-portrait className="pb-10 lg:col-span-5 lg:pb-0">
            <HeroPortrait image={hero.image} roles={hero.roles} badgeLink={bookingCta} />
          </div>
        </div>

        <HeroMarquee items={hero.marquee} />
      </section>

      {/* -------------------------- Roles reveal -------------------------- */}
      {hero.roles.length > 0 && (
        <section
          ref={rolesRef}
          id="roles"
          aria-label="What Kamran does"
          className="relative h-[190svh]"
        >
          <div className="sticky top-0 flex h-svh items-center overflow-hidden">
            <div className="mx-auto w-full max-w-7xl px-5 sm:px-8" style={{ perspective: 1000 }}>
              <p
                data-roles-kicker
                className="mb-8 flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.3em] text-gold-ink uppercase"
              >
                <span className="h-px w-12 bg-gold/60" />
                Kamran is your
              </p>
              <ul className="space-y-2 sm:space-y-3">
                {hero.roles.map((role, i) => (
                  <li
                    key={role}
                    data-role-line
                    className="flex items-start gap-3 pl-[calc(var(--i)*4%)] sm:gap-5 sm:pl-[calc(var(--i)*9%)]"
                    style={{ "--i": i, transformOrigin: "50% 100%" } as React.CSSProperties}
                  >
                    <span className="mt-[0.6em] font-mono text-[0.65rem] text-gold-ink sm:text-xs">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="relative font-display text-[clamp(2.4rem,8vw,7.5rem)] leading-[0.98] tracking-[-0.03em]">
                      <span className="text-outline">{role}</span>
                      <span data-fill aria-hidden className="text-gold-gradient absolute inset-0">
                        {role}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              {hero.secondaryCta && (
                <div data-roles-cta className="mt-12 flex justify-end">
                  <Button asChild variant="glass" size="xl">
                    <Link href={hero.secondaryCta.href}>
                      {hero.secondaryCta.label}
                      <ArrowUpRight />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
