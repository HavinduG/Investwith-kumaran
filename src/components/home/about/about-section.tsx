"use client"

import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, MessageCircle, UserRound } from "lucide-react"

import { Magnetic } from "@/components/motion/magnetic"
import { Button } from "@/components/ui/button"
import { gsap, useGSAP } from "@/lib/gsap"
import { externalLinkProps, splitTitle } from "@/lib/utils"
import type { AboutContent, CmsLink } from "@/lib/wordpress"

export function AboutSection({
  about,
  role,
  primaryCta,
  whatsappCta,
}: {
  about: AboutContent
  role?: string
  primaryCta: CmsLink | null
  whatsappCta: CmsLink | null
}) {
  const root = useRef<HTMLElement>(null)
  const { lead, accent } = splitTitle(about.title)

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

        /* --------------------------- Portrait --------------------------- */
        gsap
          .timeline({
            defaults: { ease: "expo.inOut" },
            scrollTrigger: { trigger: q("[data-about-portrait]")[0], start: "top 80%", once: true },
          })
          .fromTo(
            q("[data-reveal='frame']"),
            { autoAlpha: 1, clipPath: "inset(100% 0% 0% 0% round 2rem)" },
            { clipPath: "inset(0% 0% 0% 0% round 2rem)", duration: 1.6, clearProps: "clipPath" }
          )
          .fromTo(q("[data-about-zoom]"), { scale: 1.3 }, { scale: 1, duration: 2.2, ease: "expo.out" }, 0.2)
          .fromTo(
            q("[data-reveal='ring']"),
            { autoAlpha: 0, scale: 0.6 },
            { autoAlpha: 1, scale: 1, duration: 1.8, ease: "expo.out", stagger: 0.12 },
            0.6
          )
          .fromTo(
            q("[data-reveal='signature']"),
            { autoAlpha: 0, y: 20 },
            { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.1 },
            0.9
          )

        // Slow parallax drift of the photo inside its frame
        gsap.fromTo(
          q("[data-about-image]"),
          { yPercent: -6 },
          {
            yPercent: 6,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 },
          }
        )

        /* ----------------------------- Copy ----------------------------- */
        const copyTl = gsap.timeline({
          defaults: { ease: "expo.out", duration: 1.1 },
          scrollTrigger: { trigger: q("[data-about-copy]")[0], start: "top 75%", once: true },
        })
        copyTl
          .fromTo(q("[data-reveal='eyebrow']"), { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0 })
          .fromTo(
            q("[data-reveal='title']"),
            { autoAlpha: 0, y: 40, filter: "blur(10px)" },
            { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1.3, stagger: 0.15 },
            "-=0.8"
          )
          .fromTo(q("[data-reveal='copy']"), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.1 }, "-=0.9")
          .fromTo(q("[data-quote-rule]"), { scaleY: 0 }, { scaleY: 1, duration: 1.2, ease: "expo.inOut" }, "-=0.9")

        gsap.fromTo(
          q("[data-reveal='step']"),
          { autoAlpha: 0, x: -28 },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.9,
            ease: "expo.out",
            stagger: 0.08,
            scrollTrigger: { trigger: q("[data-about-steps]")[0], start: "top 85%", once: true },
          }
        )
        gsap.fromTo(
          q("[data-reveal='actions']"),
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "expo.out",
            scrollTrigger: { trigger: q("[data-reveal='actions']")[0], start: "top 92%", once: true },
          }
        )
      })

      return () => mm.revert()
    },
    { scope: root }
  )

  return (
    <section
      ref={root}
      id="about"
      aria-labelledby="about-title"
      data-anim-root
      className="relative overflow-x-clip"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-14 px-5 py-20 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:py-32">
        {/* ---------------------------- Portrait ---------------------------- */}
        <figure data-about-portrait className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <div
              data-reveal="frame"
              className="group relative aspect-4/5 overflow-hidden rounded-[2rem] border border-gold/25 bg-card shadow-[0_40px_120px_-40px_rgb(0_0_0/0.7)]"
            >
              {about.image ? (
                <div data-about-image className="absolute inset-x-0 -inset-y-[8%]">
                  <div data-about-zoom className="absolute inset-0">
                    <Image
                      src={about.image.src}
                      alt={about.image.alt}
                      fill
                      sizes="(min-width: 1280px) 500px, (min-width: 1024px) 40vw, 100vw"
                      className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid size-full place-items-center bg-linear-to-b from-muted to-card">
                  <UserRound className="size-24 text-gold/40" strokeWidth={1} />
                </div>
              )}

              {/* Concentric rings behind the subject */}
              <div aria-hidden className="pointer-events-none absolute inset-0">
                {[92, 70, 48].map((size) => (
                  <span
                    key={size}
                    data-reveal="ring"
                    className="absolute top-[38%] left-1/2 aspect-square -translate-1/2 rounded-full border border-gold/20"
                    style={{ width: `${size}%` }}
                  />
                ))}
              </div>

              <div className="absolute inset-0 bg-linear-to-t from-background/85 via-background/0 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_0%,color-mix(in_oklab,var(--gold)_18%,transparent),transparent_60%)] mix-blend-soft-light" />

              <figcaption className="absolute inset-x-6 bottom-5 flex items-center gap-3 font-mono text-[0.6rem] tracking-[0.3em] text-gold-ink uppercase">
                <span className="h-px w-8 bg-gold/60" />
                Dubai · Real estate
              </figcaption>
            </div>

            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span data-reveal="signature" className="text-gold-gradient font-display text-3xl italic sm:text-4xl">
                Kamran
              </span>
              <span
                data-reveal="signature"
                className="font-mono text-[0.65rem] tracking-[0.18em] text-muted-foreground uppercase"
              >
                {role ? `${role} · Metroplex` : "Metroplex Properties"}
              </span>
            </div>
          </div>
        </figure>

        {/* ------------------------------ Copy ------------------------------ */}
        <div data-about-copy className="lg:col-span-7 lg:pt-4">
          <p
            data-reveal="eyebrow"
            className="flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.3em] text-gold-ink uppercase"
          >
            <span>01</span>
            <span className="h-px w-12 bg-gold/60" />
            About
          </p>

          {about.title && (
            <h2
              id="about-title"
              className="mt-7 font-display text-[clamp(2.4rem,5vw,4.25rem)] leading-[1.02] font-light tracking-[-0.03em] text-balance"
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

          {about.paragraphs.length > 0 && (
            <div className="mt-8 max-w-2xl space-y-4 text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
              {about.paragraphs.map((paragraph, i) => (
                <p key={i} data-reveal="copy">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          {about.quote && (
            <blockquote data-reveal="copy" className="relative mt-10 max-w-2xl pl-7">
              <span
                data-quote-rule
                aria-hidden
                className="absolute inset-y-0 left-0 w-0.5 origin-top rounded-full bg-linear-to-b from-gold to-gold/20"
              />
              <p className="font-display text-[clamp(1.5rem,2.6vw,2.1rem)] leading-snug font-light italic">
                &ldquo;{about.quote}&rdquo;
              </p>
            </blockquote>
          )}

          {about.helpItems.length > 0 && (
            <div className="mt-12">
              {about.helpHeading && (
                <h3 data-reveal="copy" className="text-base font-medium sm:text-lg">
                  {about.helpHeading}
                </h3>
              )}
              <ol data-about-steps className="mt-5 border-b border-border">
                {about.helpItems.map((item, i) => (
                  <li
                    key={item}
                    data-reveal="step"
                    className="group relative isolate flex items-center gap-5 overflow-hidden border-t border-border py-4 sm:gap-7 sm:py-5"
                  >
                    {/* Hover sweep */}
                    <span
                      aria-hidden
                      className="absolute inset-0 -z-10 origin-left scale-x-0 bg-linear-to-r from-gold/12 via-gold/5 to-transparent transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                    />
                    <span className="w-6 shrink-0 font-mono text-[0.68rem] text-gold-ink">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-sm leading-snug transition-transform duration-500 group-hover:translate-x-1.5 sm:text-[0.98rem]">
                      {item}
                    </span>
                    <ArrowRight
                      aria-hidden
                      className="mr-1 size-4 shrink-0 text-muted-foreground transition-all duration-500 group-hover:translate-x-1 group-hover:text-gold-ink"
                    />
                  </li>
                ))}
              </ol>
            </div>
          )}

          {(primaryCta || whatsappCta) && (
            <div data-reveal="actions" className="mt-10 flex flex-wrap items-center gap-3 sm:gap-4">
              {primaryCta && (
                <Magnetic>
                  <Button asChild variant="gold" size="xl">
                    <Link href={primaryCta.href}>
                      {primaryCta.label}
                      <ArrowUpRight className="transition-transform duration-300 group-hover/button:rotate-45" />
                    </Link>
                  </Button>
                </Magnetic>
              )}
              {whatsappCta && (
                <Magnetic>
                  <Button
                    asChild
                    size="xl"
                    className="bg-emerald text-white shadow-[0_10px_40px_-12px_var(--emerald)] hover:bg-emerald/90"
                  >
                    <Link href={whatsappCta.href} {...externalLinkProps(whatsappCta.href)}>
                      <MessageCircle />
                      {whatsappCta.label}
                    </Link>
                  </Button>
                </Magnetic>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
