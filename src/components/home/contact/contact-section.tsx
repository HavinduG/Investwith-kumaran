"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, CalendarDays, MessageCircle, UserRound } from "lucide-react"

import { EnquiryForm } from "@/components/contact/enquiry-form"
import { SocialIcon, socialLabel } from "@/components/contact/social-icon"
import { Magnetic } from "@/components/motion/magnetic"
import { gsap, useGSAP } from "@/lib/gsap"
import { cn } from "@/lib/utils"
import type { CmsLink, ContactContent } from "@/lib/wordpress"

const isExternal = (href: string) => /^https?:\/\//.test(href)

export function ContactSection({
  contact,
  services,
  whatsappCta,
  bookingCta,
}: {
  contact: ContactContent
  services: string[]
  whatsappCta: CmsLink | null
  bookingCta: CmsLink | null
}) {
  const root = useRef<HTMLElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  // Bumping the key remounts the form, clearing it for another enquiry
  const [formKey, setFormKey] = useState(0)

  const title = contact.title || "Let’s talk property."
  const words = title.split(" ")

  // Soft light that follows the cursor across the panel
  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || !panel.current) return
    const rect = panel.current.getBoundingClientRect()
    panel.current.style.setProperty("--mx", `${event.clientX - rect.left}px`)
    panel.current.style.setProperty("--my", `${event.clientY - rect.top}px`)
  }

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
            scrollTrigger: { trigger: el, start: "top 75%", once: true },
          })
          .fromTo(
            q("[data-reveal='panel']"),
            { autoAlpha: 1, clipPath: "inset(10% 6% 10% 6% round 2.5rem)", y: 60 },
            { clipPath: "inset(0% 0% 0% 0% round 2.5rem)", y: 0, duration: 1.5, ease: "expo.inOut", clearProps: "clipPath" }
          )
          .fromTo(q("[data-reveal='chip']"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0 }, "-=0.6")
          .fromTo(q("[data-reveal='eyebrow']"), { autoAlpha: 0, x: -24 }, { autoAlpha: 1, x: 0 }, "-=0.8")
          // Each word rises out of its own mask
          .fromTo(
            q("[data-reveal='word']"),
            { autoAlpha: 1, yPercent: 110, rotate: 4 },
            { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.07 },
            "-=0.9"
          )
          .fromTo(q("[data-reveal='lede']"), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0 }, "-=0.8")
          .fromTo(
            q("[data-reveal='channel']"),
            { autoAlpha: 0, y: 30, scale: 0.96 },
            { autoAlpha: 1, y: 0, scale: 1, stagger: 0.08 },
            "-=0.8"
          )
          .fromTo(q("[data-reveal='card']"), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0 }, "-=0.8")
          .fromTo(
            q("[data-reveal='field']"),
            { autoAlpha: 0, x: 30 },
            { autoAlpha: 1, x: 0, stagger: 0.06, duration: 0.9 },
            1
          )
      })

      return () => mm.revert()
    },
    { scope: root }
  )

  const channels = [
    whatsappCta && {
      key: "whatsapp",
      href: whatsappCta.href,
      label: whatsappCta.label,
      caption: "Chat directly with Kamran",
      icon: MessageCircle,
      tone: "emerald" as const,
    },
    bookingCta && {
      key: "booking",
      href: bookingCta.href,
      label: bookingCta.label,
      caption: "Pick a time that suits you",
      icon: CalendarDays,
      tone: "gold" as const,
    },
  ].filter((channel): channel is NonNullable<typeof channel> => Boolean(channel))

  return (
    <section
      ref={root}
      id="contact"
      aria-labelledby="contact-title"
      data-anim-root
      className="relative overflow-x-clip py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
        <div
          ref={panel}
          data-reveal="panel"
          onPointerMove={onPointerMove}
          className="group/panel relative isolate overflow-hidden rounded-[2.5rem] border border-gold/20 bg-card/50 [--mx:30%] [--my:20%]"
        >
          {/* --------------------------- Living background --------------------------- */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-1/3 -left-1/4 size-[42rem] animate-aurora rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--emerald)_30%,transparent),transparent)]" />
            <div className="absolute -right-1/4 -bottom-1/3 size-[40rem] animate-aurora rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--gold)_22%,transparent),transparent)] [animation-delay:-9s]" />
            <div className="bg-grid absolute inset-0 opacity-40 mask-radial-from-10% mask-radial-to-70%" />
            <div className="absolute inset-0 bg-[radial-gradient(500px_circle_at_var(--mx)_var(--my),color-mix(in_oklab,var(--gold)_10%,transparent),transparent_70%)] opacity-0 transition-opacity duration-700 group-hover/panel:opacity-100" />
          </div>

          <div className="grid gap-12 p-6 sm:p-10 lg:grid-cols-12 lg:gap-14 lg:p-14">
            {/* ------------------------------ Left column ------------------------------ */}
            <div className="flex flex-col lg:col-span-6">
              <div data-reveal="chip" className="flex items-center gap-4">
                <span className="relative grid size-16 shrink-0 place-items-center">
                  <span aria-hidden className="conic-border absolute inset-0 rounded-full" />
                  <span className="relative block size-[calc(100%-4px)] overflow-hidden rounded-full bg-muted">
                    {contact.image ? (
                      <Image src={contact.image.src} alt="" fill sizes="64px" className="object-cover object-top" />
                    ) : (
                      <UserRound className="absolute inset-0 m-auto size-7 text-gold/50" />
                    )}
                  </span>
                  <span aria-hidden className="absolute right-0.5 bottom-0.5 grid size-4 place-items-center rounded-full bg-card">
                    <span className="absolute size-2.5 animate-ping-slow rounded-full bg-emerald/60" />
                    <span className="size-2.5 rounded-full bg-emerald" />
                  </span>
                </span>
                <div>
                  <p className="font-mono text-[0.62rem] tracking-[0.25em] text-emerald uppercase">
                    Available for consultations
                  </p>
                  <p className="mt-1 text-sm text-foreground/90">Kamran · Metroplex Properties</p>
                </div>
              </div>

              <p
                data-reveal="eyebrow"
                className="mt-10 flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.3em] text-gold-ink uppercase"
              >
                <span>07</span>
                <span className="h-px w-12 bg-gold/60" />
                Contact
              </p>

              <h2
                id="contact-title"
                className="mt-6 font-display text-[clamp(3rem,6.5vw,5.75rem)] leading-[0.98] font-light tracking-[-0.04em]"
              >
                {words.map((word, i) => {
                  const last = i === words.length - 1
                  return (
                    <span key={i} className="inline-flex overflow-hidden pb-[0.12em] align-bottom">
                      <span
                        data-reveal="word"
                        className={cn("inline-block", last && "text-gold-gradient pr-[0.08em] italic")}
                      >
                        {word}
                      </span>
                      {!last && <span className="inline-block w-[0.25em]" />}
                    </span>
                  )
                })}
              </h2>

              {contact.description && (
                <p data-reveal="lede" className="mt-6 max-w-lg text-[0.98rem] leading-relaxed text-muted-foreground">
                  {contact.description}
                </p>
              )}

              {channels.length > 0 && (
                <ul className="mt-9 grid gap-3 sm:grid-cols-2">
                  {channels.map((channel) => (
                    <li key={channel.key} data-reveal="channel">
                      <Magnetic strength={0.15} className="block">
                        <Link
                          href={channel.href}
                          {...(isExternal(channel.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                          className={cn(
                            "group/channel relative flex items-center gap-4 overflow-hidden rounded-2xl border bg-background/40 p-4 backdrop-blur-sm transition-all duration-500 hover:-translate-y-0.5",
                            channel.tone === "emerald"
                              ? "border-emerald/30 hover:border-emerald/60 hover:shadow-[0_20px_50px_-25px_var(--emerald)]"
                              : "border-gold/30 hover:border-gold/60 hover:shadow-[0_20px_50px_-25px_var(--gold)]"
                          )}
                        >
                          <span
                            className={cn(
                              "grid size-11 shrink-0 place-items-center rounded-xl transition-transform duration-500 group-hover/channel:scale-110 group-hover/channel:-rotate-6",
                              channel.tone === "emerald" ? "bg-emerald/15 text-emerald" : "bg-gold/15 text-gold-ink"
                            )}
                          >
                            <channel.icon className="size-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{channel.label}</span>
                            <span className="block truncate text-xs text-muted-foreground">{channel.caption}</span>
                          </span>
                          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-all duration-500 group-hover/channel:rotate-45 group-hover/channel:text-foreground" />
                        </Link>
                      </Magnetic>
                    </li>
                  ))}
                </ul>
              )}

              <div className="min-h-8 flex-1" />

              {/* Business card */}
              {(contact.image || contact.note || contact.socials.length > 0) && (
                <div
                  data-reveal="card"
                  className="group/card relative mt-4 flex gap-5 overflow-hidden rounded-2xl border border-border bg-background/40 p-4 backdrop-blur-sm"
                >
                  {/* Sheen sweeping across on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000 ease-out group-hover/card:translate-x-[450%]"
                  />
                  {contact.image && (
                    <div className="relative aspect-4/5 w-24 shrink-0 overflow-hidden rounded-xl border border-gold/25 sm:w-28">
                      <Image
                        src={contact.image.src}
                        alt={contact.image.alt}
                        fill
                        sizes="112px"
                        className="object-cover object-top transition-transform duration-1000 group-hover/card:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex min-w-0 flex-col">
                    <p className="text-gold-gradient font-display text-2xl italic">Kamran</p>
                    {contact.note && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{contact.note}</p>}
                    {contact.socials.length > 0 && (
                      <ul className="mt-auto flex flex-wrap gap-2 pt-3">
                        {contact.socials.map((social) => (
                          <li key={social.href}>
                            <a
                              href={social.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`${socialLabel(social.name)} (opens in a new tab)`}
                              title={socialLabel(social.name)}
                              className="grid size-9 place-items-center rounded-full border border-border text-foreground/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-gold-foreground"
                            >
                              <SocialIcon social={social} className="size-4" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ------------------------------- Form column ------------------------------- */}
            <div className="lg:col-span-6">
              <EnquiryForm key={formKey} services={services} onReset={() => setFormKey((k) => k + 1)} />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
