"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import { Magnetic } from "@/components/motion/magnetic"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SECTION_SPANS } from "@/lib/routes"
import { handleSectionLinkClick } from "@/lib/section-scroll"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { HeaderContent } from "@/lib/wordpress"

// Mobile menu close animation; scrolling waits for it to release the page
const MENU_CLOSE_MS = 350
// A section counts as "current" once its top passes this share of the viewport
const ACTIVE_LINE = 0.35

/** "/#about" → "about"; "" for links without a hash. */
const hashOf = (href: string) => (href.includes("#") ? href.slice(href.indexOf("#") + 1) : "")

const EASE = [0.22, 1, 0.36, 1] as const

export function SiteHeader({ content }: { content: HeaderContent }) {
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  // Section currently on screen: "home" near the top, a section id, or null between sections
  const [activeSection, setActiveSection] = useState<string | null>("home")

  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 })

  const updateActiveSection = useCallback(() => {
    if (pathname !== "/") return
    if (window.scrollY < window.innerHeight * 0.5) return setActiveSection("home")
    const line = window.innerHeight * ACTIVE_LINE
    const current = content.menu
      .map((item) => hashOf(item.href))
      .find((id) => {
        if (!id) return false
        const start = document.getElementById(id)?.getBoundingClientRect()
        const end = document.getElementById(SECTION_SPANS[id] ?? id)?.getBoundingClientRect() ?? start
        return start && end && start.top <= line && end.bottom > line
      })
    setActiveSection(current ?? null)
  }, [content.menu, pathname])

  // Measure once layout has settled, and again whenever the viewport resizes
  useEffect(() => {
    const frame = window.requestAnimationFrame(updateActiveSection)
    window.addEventListener("resize", updateActiveSection)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", updateActiveSection)
    }
  }, [updateActiveSection])

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0
    setScrolled(latest > 24)
    setHidden(latest > previous && latest > 320)
    updateActiveSection()
  })

  const isActive = (href: string) => {
    const hash = hashOf(href)
    // On the home page, follow the section in view
    if (pathname === "/") return href === "/" ? activeSection === "home" : Boolean(hash) && activeSection === hash
    if (href === "/") return false
    // Elsewhere, "/#properties" stays lit on /properties/… pages
    return hash ? pathname.startsWith(`/${hash}`) : pathname === href || pathname.startsWith(`${href}/`)
  }

  return (
    <>
      <motion.div
        aria-hidden
        style={{ scaleX: progress }}
        className="fixed inset-x-0 top-0 z-60 h-0.5 origin-left bg-linear-to-r from-gold-ink via-gold to-gold-ink"
      />

      <motion.header
        initial={reduceMotion ? false : { y: "-120%", opacity: 0 }}
        animate={{ y: hidden && !menuOpen ? "-130%" : "0%", opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE, delay: hidden ? 0 : 0.15 }}
        className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
      >
        <div
          className={cn(
            "relative mx-auto flex items-center justify-between gap-4 rounded-full border transition-[max-width,background-color,border-color,padding,box-shadow] duration-500 ease-out",
            scrolled
              ? "max-w-6xl border-border bg-background/65 py-2 pr-2 pl-3 shadow-[0_20px_60px_-30px_rgb(0_0_0/0.6)] backdrop-blur-xl backdrop-saturate-150"
              : "max-w-7xl border-transparent bg-transparent py-2 pr-1 pl-1"
          )}
        >
          <Logo logo={content.logo} />

          <nav aria-label="Main" className="hidden lg:block">
            <ul className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
              {content.menu.map((item) => {
                const active = isActive(item.href)
                return (
                  <li key={item.label} className="relative">
                    <Link
                      href={item.href}
                      onClick={(event) => handleSectionLinkClick(event, item.href)}
                      onMouseEnter={() => setHovered(item.label)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative z-10 block rounded-full px-4 py-2 text-sm capitalize transition-colors",
                        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.label}
                      {active && (
                        <motion.span
                          layoutId="nav-active-dot"
                          className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-gold"
                        />
                      )}
                    </Link>
                    {hovered === item.label && (
                      <motion.span
                        layoutId="nav-hover-pill"
                        className="absolute inset-0 rounded-full bg-foreground/6"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {content.cta && (
              <Magnetic strength={0.25} className="hidden sm:inline-flex">
                <Button asChild variant="gold" size="xl" className="h-10 px-5 text-sm">
                  <Link href={content.cta.href}>
                    {content.cta.label}
                    <ArrowUpRight className="transition-transform duration-300 group-hover/button:translate-x-0.5 group-hover/button:-translate-y-0.5" />
                  </Link>
                </Button>
              </Magnetic>
            )}
            <MobileMenu
              content={content}
              open={menuOpen}
              onOpenChange={setMenuOpen}
              isActive={isActive}
            />
          </div>
        </div>
      </motion.header>
    </>
  )
}

function Logo({ logo }: { logo: HeaderContent["logo"] }) {
  return (
    <Link
      href="/"
      onClick={(event) => handleSectionLinkClick(event, "/")}
      aria-label={`${siteConfig.name} — home`}
      className="group flex shrink-0 items-center gap-3 rounded-full"
    >
      {logo ? (
        <Image
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          className="h-10 w-auto"
          preload
        />
      ) : (
        <>
          <span className="relative grid size-10 place-items-center rounded-full border border-gold/40 bg-background/40 backdrop-blur">
            <span className="absolute -inset-1 rounded-full border border-dashed border-gold/40 opacity-0 transition-opacity duration-500 group-hover:animate-spin-slow group-hover:opacity-100" />
            <span className="text-gold-gradient font-display text-xl italic leading-none">K</span>
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[1.05rem] tracking-tight">{siteConfig.name}</span>
            <span className="hidden font-mono text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase sm:block">
              {siteConfig.tagline}
            </span>
          </span>
        </>
      )}
    </Link>
  )
}

function MobileMenu({
  content,
  open,
  onOpenChange,
  isActive,
}: {
  content: HeaderContent
  open: boolean
  onOpenChange: (open: boolean) => void
  isActive: (href: string) => boolean
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="glass"
          size="icon-lg"
          className="rounded-full lg:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <span className="relative block h-3 w-4">
            <span
              className={cn(
                "absolute left-0 h-px w-full bg-current transition-all duration-300",
                open ? "top-1.5 rotate-45" : "top-0"
              )}
            />
            <span
              className={cn(
                "absolute left-0 h-px bg-current transition-all duration-300",
                open ? "top-1.5 w-full -rotate-45" : "top-3 w-2/3"
              )}
            />
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="gap-0 overflow-hidden border-gold/20 bg-background/92 p-0 backdrop-blur-2xl data-[side=right]:w-full data-[side=right]:sm:max-w-md"
      >
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-24 size-80 rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -bottom-40 -left-20 size-96 rounded-full bg-emerald/25 blur-3xl" />
          <div className="bg-grid absolute inset-0 opacity-40 mask-[radial-gradient(ellipse_at_top_right,black,transparent_70%)]" />
        </div>

        <div className="relative flex h-full flex-col px-6 pt-6 pb-8">
          <SheetTitle className="font-mono text-[0.65rem] tracking-[0.25em] text-muted-foreground uppercase">
            Menu
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>

          <nav aria-label="Mobile" className="mt-10 flex-1">
            <ul className="space-y-1">
              {content.menu.map((item, index) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: 40, filter: "blur(8px)" }}
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  transition={{ delay: 0.12 + index * 0.07, duration: 0.6, ease: EASE }}
                >
                  <Link
                    href={item.href}
                    onClick={(event) => {
                      onOpenChange(false)
                      handleSectionLinkClick(event, item.href, { delay: MENU_CLOSE_MS })
                    }}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="group flex items-baseline gap-4 border-b border-border/70 py-4"
                  >
                    <span className="font-mono text-xs text-gold-ink">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={cn(
                        "font-display text-4xl capitalize tracking-tight transition-all duration-300 group-hover:translate-x-2 group-hover:italic",
                        isActive(item.href) && "text-gold-gradient italic"
                      )}
                    >
                      {item.label}
                    </span>
                    <ArrowUpRight className="ml-auto size-5 self-center text-muted-foreground transition-all duration-300 group-hover:rotate-45 group-hover:text-gold-ink" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </nav>

          {content.cta && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6, ease: EASE }}
            >
              <Button asChild variant="gold" size="xl" className="w-full">
                <Link href={content.cta.href} onClick={() => onOpenChange(false)}>
                  {content.cta.label}
                  <ArrowUpRight />
                </Link>
              </Button>
              <p className="mt-4 text-center font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
                {siteConfig.name} · {siteConfig.tagline}
              </p>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
