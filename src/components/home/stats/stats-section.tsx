"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "framer-motion"

import { gsap, useGSAP } from "@/lib/gsap"
import type { StatItem } from "@/lib/wordpress"

type ParsedValue = {
  prefix: string
  number: number
  decimals: number
  grouping: boolean
  unit: string
  rest: string
}

// Max tilt (degrees) of a card toward the cursor
const TILT = 6
// Hovering a card replays its count-up this fast
const HOVER_COUNT_S = 0.9

/** Splits a CMS value like "100M+" into a countable number, a unit ("M") and trailing symbols ("+"). */
function parseValue(value: string): ParsedValue | null {
  const match = value.match(/^(\D*?)(\d[\d,]*(?:\.\d+)?)(.*)$/)
  if (!match) return null
  const [, prefix, digits, suffix] = match
  const [, unit = "", rest = ""] = suffix.match(/^\s*([A-Za-z]*)(.*)$/) ?? []
  return {
    prefix,
    number: Number(digits.replace(/,/g, "")),
    decimals: digits.split(".")[1]?.length ?? 0,
    grouping: digits.includes(","),
    unit,
    rest: rest.trim(),
  }
}

const formatNumber = (value: number, decimals: number, grouping: boolean) =>
  value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouping,
  })

/**
 * Animates a [data-count] node from 0 to its value. The final text always comes
 * from data-final (never from the DOM, which may hold a half-finished count).
 */
function countUp(node: HTMLElement, vars: gsap.TweenVars) {
  const target = Number(node.dataset.count)
  const decimals = Number(node.dataset.decimals)
  const grouping = node.dataset.grouping === "true"
  const counter = { value: 0 }
  return gsap.to(counter, {
    value: target,
    ease: "power3.out",
    ...vars,
    onUpdate: () => {
      node.textContent = formatNumber(counter.value, decimals, grouping)
    },
    onComplete: () => {
      node.textContent = node.dataset.final ?? ""
      node.dataset.counted = "true"
    },
  })
}

/** Puts every number back to its real value (used whenever animations are torn down). */
const restoreCounts = (scope: ParentNode) =>
  scope.querySelectorAll<HTMLElement>("[data-count]").forEach((node) => {
    node.textContent = node.dataset.final ?? ""
  })

export function StatsSection({ stats }: { stats: StatItem[] }) {
  const root = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()
  const hoverTweens = useRef(new Map<HTMLElement, ReturnType<typeof gsap.to>>())

  useGSAP(
    () => {
      const el = root.current!
      const q = gsap.utils.selector(el)
      const mm = gsap.matchMedia()

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(q("[data-reveal]"), { autoAlpha: 1 })
        q<HTMLElement>("[data-count]").forEach((node) => (node.dataset.counted = "true"))
        el.setAttribute("data-anim-ready", "")
      })

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(q("[data-reveal]"), { autoAlpha: 0 })
        el.setAttribute("data-anim-ready", "")

        const tl = gsap.timeline({
          defaults: { ease: "expo.out", duration: 1.2 },
          scrollTrigger: { trigger: el, start: "top 80%", once: true },
        })

        tl.fromTo(
          q("[data-reveal='stat']"),
          { autoAlpha: 0, y: 48, filter: "blur(8px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", stagger: 0.12 }
        )

        q<HTMLElement>("[data-count]").forEach((node, i) => {
          tl.add(countUp(node, { duration: 2.2 }), 0.15 + i * 0.12)
        })

        tl.fromTo(
          q("[data-bar]"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.8, ease: "expo.inOut", stagger: 0.12 },
          0.4
        )

        // If the animation is torn down mid-count (Fast Refresh, effect re-run,
        // navigation), never leave a "0" behind
        return () => restoreCounts(el)
      })

      return () => {
        mm.revert()
        restoreCounts(el)
      }
    },
    { scope: root, dependencies: [stats.length] }
  )

  useEffect(() => {
    const tweens = hoverTweens.current
    const el = root.current
    return () => {
      tweens.forEach((tween) => tween.kill())
      tweens.clear()
      if (el) restoreCounts(el)
    }
  }, [])

  /* --------------------------------- Hover --------------------------------- */
  const onPointerEnter = (event: React.PointerEvent<HTMLLIElement>) => {
    if (event.pointerType !== "mouse" || reduceMotion) return
    // Replay the count-up, once the first scroll-in count has finished
    const node = event.currentTarget.querySelector<HTMLElement>("[data-count]")
    if (!node || node.dataset.counted !== "true") return
    hoverTweens.current.get(node)?.kill()
    hoverTweens.current.set(node, countUp(node, { duration: HOVER_COUNT_S }))
  }

  const onPointerMove = (event: React.PointerEvent<HTMLLIElement>) => {
    if (event.pointerType !== "mouse" || reduceMotion) return
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height
    card.style.setProperty("--mx", `${x * 100}%`)
    card.style.setProperty("--my", `${y * 100}%`)
    card.style.setProperty("--ry", `${(x - 0.5) * TILT * 2}deg`)
    card.style.setProperty("--rx", `${(0.5 - y) * TILT * 2}deg`)
  }

  const onPointerLeave = (event: React.PointerEvent<HTMLLIElement>) => {
    const card = event.currentTarget
    card.style.setProperty("--rx", "0deg")
    card.style.setProperty("--ry", "0deg")
    const node = card.querySelector<HTMLElement>("[data-count]")
    if (!node) return
    // Leaving mid-count snaps straight to the real value
    hoverTweens.current.get(node)?.kill()
    hoverTweens.current.delete(node)
    if (node.dataset.counted === "true") node.textContent = node.dataset.final ?? ""
  }

  if (!stats.length) return null

  const parsed = stats.map((stat) => parseValue(stat.value))
  const max = Math.max(1, ...parsed.map((p) => p?.number ?? 0))

  return (
    <section ref={root} id="stats" aria-label="Track record" data-anim-root className="relative">
      <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 lg:py-28">
        <ul className="grid grid-cols-1 gap-y-10 sm:-mx-8 sm:grid-cols-2 sm:gap-y-16 lg:grid-cols-4">
          {stats.map((stat, i) => {
            const value = parsed[i]
            // Bar length is relative to the largest value in the set
            const fill = value ? 30 + (value.number / max) * 50 : 50
            const final = value ? formatNumber(value.number, value.decimals, value.grouping) : ""

            return (
              <li
                key={`${stat.value}-${i}`}
                data-reveal="stat"
                onPointerEnter={onPointerEnter}
                onPointerMove={onPointerMove}
                onPointerLeave={onPointerLeave}
                className="group relative isolate flex flex-col border-t border-border pt-8 [--mx:50%] [--my:50%] [--rx:0deg] [--ry:0deg] first:border-t-0 first:pt-0 sm:border-t-0 sm:px-8 sm:pt-0 sm:even:border-l lg:border-l lg:first:border-l-0"
                style={{ perspective: 900 }}
              >
                {/* Hover panel: glass card with a cursor spotlight and gold edge */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-x-3 -inset-y-4 -z-10 scale-[0.97] rounded-2xl border border-gold/0 bg-card/0 opacity-0 transition-all duration-500 ease-out group-hover:scale-100 group-hover:border-gold/25 group-hover:bg-card/70 group-hover:opacity-100 group-hover:shadow-[0_30px_70px_-35px_color-mix(in_oklab,var(--gold)_55%,transparent)] sm:inset-x-2 sm:-inset-y-6"
                >
                  <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(260px_circle_at_var(--mx)_var(--my),color-mix(in_oklab,var(--gold)_16%,transparent),transparent_70%)]" />
                  <span className="absolute inset-x-6 top-0 h-px origin-center scale-x-0 bg-linear-to-r from-transparent via-gold to-transparent transition-transform duration-700 group-hover:scale-x-100" />
                </div>

                {/* Content tilts gently toward the cursor */}
                <div className="flex flex-1 flex-col transition-transform duration-300 ease-out [transform:rotateX(var(--rx))_rotateY(var(--ry))]">
                  <span className="flex items-center gap-2 font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground transition-colors duration-500 group-hover:text-gold-ink">
                    {String(i + 1).padStart(2, "0")}
                    <span className="h-px w-0 bg-gold transition-[width] duration-500 group-hover:w-8" />
                  </span>

                  <p className="mt-6 font-display text-[clamp(3.5rem,6.5vw,5.75rem)] leading-[0.9] font-light tracking-[-0.045em] whitespace-nowrap transition-transform duration-500 ease-out group-hover:-translate-y-1">
                    <span className="sr-only">{stat.value}</span>
                    <span aria-hidden>
                      {value ? (
                        <>
                          {value.prefix}
                          <span
                            data-count={value.number}
                            data-decimals={value.decimals}
                            data-grouping={value.grouping}
                            data-final={final}
                            className="tabular-nums"
                          >
                            {final}
                          </span>
                          {value.unit && (
                            <span className="text-gold-gradient inline-block pr-[0.06em] font-normal italic transition-transform duration-500 ease-out group-hover:-rotate-6 group-hover:scale-110">
                              {value.unit}
                            </span>
                          )}
                          {value.rest && (
                            <span className="inline-block font-extralight text-muted-foreground transition-[color,rotate] duration-500 group-hover:rotate-90 group-hover:text-gold">
                              {value.rest}
                            </span>
                          )}
                        </>
                      ) : (
                        stat.value
                      )}
                    </span>
                  </p>

                  {stat.title && (
                    <p className="mt-5 text-sm leading-snug font-medium transition-colors duration-500 group-hover:text-foreground sm:text-[0.95rem]">
                      {stat.title}
                    </p>
                  )}

                  {stat.caption && (
                    <p className="mt-2 font-mono text-[0.68rem] tracking-[0.06em] text-muted-foreground">
                      {stat.caption}
                    </p>
                  )}

                  <div aria-hidden className="relative mt-4 h-px w-full max-w-56 bg-border">
                    <span
                      data-bar
                      className="absolute top-0 left-0 h-px origin-left rounded-full bg-linear-to-r from-emerald to-gold transition-[top,height,width] duration-700 ease-out group-hover:-top-px group-hover:h-0.75 group-hover:w-full!"
                      style={{ width: `${fill}%` }}
                    />
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
