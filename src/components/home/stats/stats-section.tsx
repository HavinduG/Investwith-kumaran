"use client"

import { useRef } from "react"

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

export function StatsSection({ stats }: { stats: StatItem[] }) {
  const root = useRef<HTMLElement>(null)

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

        const tl = gsap.timeline({
          defaults: { ease: "expo.out", duration: 1.2 },
          scrollTrigger: { trigger: el, start: "top 80%", once: true },
        })

        tl.fromTo(
          q("[data-reveal='stat']"),
          { autoAlpha: 0, y: 48, filter: "blur(8px)" },
          { autoAlpha: 1, y: 0, filter: "blur(0px)", stagger: 0.12 }
        )

        // Count each number up from zero, then restore the exact CMS text
        q<HTMLElement>("[data-count]").forEach((node, i) => {
          const target = Number(node.dataset.count)
          const decimals = Number(node.dataset.decimals)
          const grouping = node.dataset.grouping === "true"
          const final = node.textContent
          const counter = { value: 0 }
          tl.to(
            counter,
            {
              value: target,
              duration: 2.2,
              ease: "power3.out",
              onUpdate: () => {
                node.textContent = formatNumber(counter.value, decimals, grouping)
              },
              onComplete: () => {
                node.textContent = final
              },
            },
            0.15 + i * 0.12
          )
        })

        tl.fromTo(
          q("[data-bar]"),
          { scaleX: 0 },
          { scaleX: 1, duration: 1.8, ease: "expo.inOut", stagger: 0.12 },
          0.4
        )
      })

      return () => mm.revert()
    },
    { scope: root, dependencies: [stats.length] }
  )

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

            return (
              <li
                key={`${stat.value}-${i}`}
                data-reveal="stat"
                className="group relative flex flex-col border-t border-border pt-8 first:border-t-0 first:pt-0 sm:border-t-0 sm:px-8 sm:pt-0 sm:even:border-l lg:border-l lg:first:border-l-0"
              >
                <span className="font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground transition-colors duration-500 group-hover:text-gold-ink">
                  {String(i + 1).padStart(2, "0")}
                </span>

                <p className="mt-6 font-display text-[clamp(3.5rem,6.5vw,5.75rem)] leading-[0.9] font-light tracking-[-0.045em] whitespace-nowrap">
                  <span className="sr-only">{stat.value}</span>
                  <span aria-hidden>
                    {value ? (
                      <>
                        {value.prefix}
                        <span
                          data-count={value.number}
                          data-decimals={value.decimals}
                          data-grouping={value.grouping}
                          className="tabular-nums"
                        >
                          {formatNumber(value.number, value.decimals, value.grouping)}
                        </span>
                        {value.unit && (
                          <span className="text-gold-gradient pr-[0.06em] font-normal italic">{value.unit}</span>
                        )}
                        {value.rest && <span className="font-extralight text-muted-foreground">{value.rest}</span>}
                      </>
                    ) : (
                      stat.value
                    )}
                  </span>
                </p>

                {stat.title && <p className="mt-5 text-sm leading-snug font-medium sm:text-[0.95rem]">{stat.title}</p>}

                {stat.caption && (
                  <p className="mt-2 font-mono text-[0.68rem] tracking-[0.06em] text-muted-foreground">
                    {stat.caption}
                  </p>
                )}

                <div aria-hidden className="relative mt-4 h-px w-full max-w-56 bg-border">
                  <span
                    data-bar
                    className="absolute top-0 left-0 h-px origin-left rounded-full bg-linear-to-r from-emerald to-gold transition-[top,height] duration-500 group-hover:-top-px group-hover:h-0.75"
                    style={{ width: `${fill}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
