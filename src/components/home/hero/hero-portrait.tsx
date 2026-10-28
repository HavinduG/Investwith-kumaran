"use client"

import Image from "next/image"
import Link from "next/link"
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion"
import { ArrowUpRight, Building2, Compass, KeyRound, UserRound } from "lucide-react"

import { cn } from "@/lib/utils"
import type { CmsImage, CmsLink } from "@/lib/wordpress"

const CHIP_ICONS = [Building2, Compass, KeyRound]
const CHIP_POSITIONS = [
  "top-[12%] -left-3 sm:-left-12",
  "top-[46%] -right-3 sm:-right-14",
  "bottom-[18%] -left-2 sm:-left-16",
]

const SPRING = { stiffness: 150, damping: 18, mass: 0.6 }

export function HeroPortrait({
  image,
  roles,
  badgeLink,
}: {
  image: CmsImage | null
  roles: string[]
  badgeLink: CmsLink | null
}) {
  const reduceMotion = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)

  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), SPRING)
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), SPRING)
  const imageX = useSpring(useTransform(mx, [-0.5, 0.5], [14, -14]), SPRING)
  const imageY = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), SPRING)
  const glareX = useTransform(mx, [-0.5, 0.5], ["10%", "90%"])
  const glareY = useTransform(my, [-0.5, 0.5], ["10%", "90%"])
  const glare = useMotionTemplate`radial-gradient(420px circle at ${glareX} ${glareY}, rgb(255 255 255 / 0.18), transparent 55%)`

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== "mouse") return
    const rect = event.currentTarget.getBoundingClientRect()
    mx.set((event.clientX - rect.left) / rect.width - 0.5)
    my.set((event.clientY - rect.top) / rect.height - 0.5)
  }

  const onPointerLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <div
      className="relative mx-auto w-full max-w-76 sm:max-w-[24rem] lg:max-w-104"
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{ perspective: 1400 }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,var(--gold)_0%,transparent_70%)] opacity-25 blur-2xl"
      />

      {/* Orbit rings */}
      <div aria-hidden className="pointer-events-none absolute -inset-8 sm:-inset-14">
        <svg viewBox="0 0 200 200" className="absolute inset-0 size-full animate-spin-slow">
          <circle cx="100" cy="100" r="98" fill="none" stroke="var(--gold)" strokeOpacity="0.35" strokeWidth="0.3" strokeDasharray="1 3" />
        </svg>
        <svg viewBox="0 0 200 200" className="absolute inset-[8%] size-[84%] animate-spin-slower">
          <circle cx="100" cy="100" r="98" fill="none" stroke="var(--foreground)" strokeOpacity="0.12" strokeWidth="0.4" />
          <circle cx="100" cy="2" r="2.2" fill="var(--gold)" />
        </svg>
        <div className="absolute inset-0 animate-spin-slow animation-duration-[14s]">
          <span className="absolute top-1/2 -right-1 size-2 rounded-full bg-gold shadow-[0_0_16px_4px_var(--gold)]" />
        </div>
      </div>

      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative aspect-3/4 w-full"
      >
        {/* Animated gold border */}
        <div
          aria-hidden
          data-reveal="arch-border"
          className="conic-border absolute inset-[-1.5px] rounded-t-full rounded-b-[2.25rem]"
        />

        <div
          data-reveal="arch"
          className="absolute inset-0 overflow-hidden rounded-t-full rounded-b-[2.2rem] border border-gold/25 bg-card shadow-[0_40px_120px_-40px_rgb(0_0_0/0.7)]"
        >
          {image ? (
            <motion.div style={{ x: imageX, y: imageY }} className="absolute -inset-5">
              <Image
                data-portrait-image
                src={image.src}
                alt={image.alt}
                fill
                preload
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 384px, 304px"
                className="object-cover object-top"
              />
            </motion.div>
          ) : (
            <div className="grid size-full place-items-center bg-linear-to-b from-muted to-card">
              <UserRound className="size-24 text-gold/40" strokeWidth={1} />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-background/85 via-background/5 to-transparent" />
          <motion.div aria-hidden className="absolute inset-0 mix-blend-overlay" style={{ background: glare }} />
          <div className="absolute inset-x-0 bottom-5 text-center font-mono text-[0.6rem] tracking-[0.3em] text-gold-ink uppercase">
            Dubai · Real estate
          </div>
        </div>

        {/* Floating role chips, lifted off the card in 3D */}
        {roles.slice(0, 3).map((role, i) => {
          const Icon = CHIP_ICONS[i % CHIP_ICONS.length]
          return (
            <div
              key={role}
              className={cn("absolute z-10", CHIP_POSITIONS[i])}
              style={{ transform: `translateZ(${70 + i * 20}px)` }}
            >
              <div
                data-reveal="chip"
                className="animate-float"
                style={{ animationDelay: `${i * -2}s` }}
              >
                <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-background/70 py-2 pr-4 pl-2 shadow-[0_20px_50px_-20px_rgb(0_0_0/0.6)] backdrop-blur-xl">
                  <span className="grid size-8 place-items-center rounded-xl bg-gold/15 text-gold-ink">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-xs font-medium whitespace-nowrap sm:text-[0.8rem]">{role}</span>
                </div>
              </div>
            </div>
          )
        })}
      </motion.div>

      {badgeLink && <RotatingBadge link={badgeLink} />}
    </div>
  )
}

function RotatingBadge({ link }: { link: CmsLink }) {
  const label = `${link.label} · Dubai real estate · `
  return (
    <Link
      href={link.href}
      data-reveal="badge"
      aria-label={link.label}
      className="group absolute -right-3 -bottom-8 z-20 grid size-28 place-items-center rounded-full border border-border bg-background/70 backdrop-blur-xl sm:-right-10 sm:size-32"
    >
      <svg viewBox="0 0 100 100" aria-hidden className="absolute inset-0 size-full animate-spin-slow group-hover:animation-duration-[6s]">
        <defs>
          <path id="badge-circle" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" />
        </defs>
        <text className="fill-foreground font-mono text-[7.4px] tracking-[0.18em] uppercase">
          <textPath href="#badge-circle" textLength={238} lengthAdjust="spacing">
            {label}
          </textPath>
        </text>
      </svg>
      <span className="grid size-11 place-items-center rounded-full bg-gold text-gold-foreground shadow-[0_0_30px_-4px_var(--gold)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-45 sm:size-12">
        <ArrowUpRight className="size-5" />
      </span>
    </Link>
  )
}
