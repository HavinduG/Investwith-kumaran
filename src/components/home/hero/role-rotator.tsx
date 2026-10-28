"use client"

import { useEffect, useState } from "react"
import { AnimatePresence, motion, useReducedMotion, type Variants } from "framer-motion"

const EASE = [0.22, 1, 0.36, 1] as const

const word: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.028 } },
  exit: { transition: { staggerChildren: 0.012 } },
}

const char: Variants = {
  hidden: { y: "0.55em", opacity: 0, rotateX: -70, filter: "blur(6px)" },
  visible: {
    y: "0em",
    opacity: 1,
    rotateX: 0,
    filter: "blur(0px)",
    transition: { duration: 0.55, ease: EASE },
  },
  exit: {
    y: "-0.45em",
    opacity: 0,
    filter: "blur(6px)",
    transition: { duration: 0.3, ease: "easeIn" },
  },
}

/** Cycles through the roles with a per-letter 3D flip. */
export function RoleRotator({ roles, interval = 2800 }: { roles: string[]; interval?: number }) {
  const [index, setIndex] = useState(0)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (roles.length < 2) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % roles.length), interval)
    return () => window.clearInterval(id)
  }, [roles.length, interval])

  if (!roles.length) return null
  const role = roles[index % roles.length]

  return (
    <span className="relative inline-flex items-baseline [perspective:600px]">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={role}
          variants={reduceMotion ? undefined : word}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="inline font-display text-gold-ink italic"
        >
          {role.split(" ").map((w, wi, words) => (
            <span key={`${w}-${wi}`} className="inline-block whitespace-nowrap">
              {w.split("").map((c, ci) => (
                <motion.span
                  key={ci}
                  variants={reduceMotion ? undefined : char}
                  className="inline-block origin-bottom"
                >
                  {c}
                </motion.span>
              ))}
              {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
            </span>
          ))}
        </motion.span>
      </AnimatePresence>
      <span
        aria-hidden
        className="ml-1.5 inline-block h-[0.9em] w-0.5 translate-y-[0.12em] animate-pulse rounded-full bg-gold"
      />
    </span>
  )
}
