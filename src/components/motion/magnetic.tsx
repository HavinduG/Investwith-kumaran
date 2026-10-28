"use client"

import { useRef } from "react"
import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion"

import { cn } from "@/lib/utils"

/** Pulls its child toward the cursor on hover (fine pointers only). */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode
  strength?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 })
  const y = useSpring(useMotionValue(0), { stiffness: 220, damping: 15, mass: 0.4 })

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduceMotion || event.pointerType !== "mouse" || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength)
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength)
  }

  const reset = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      onPointerMove={onPointerMove}
      onPointerLeave={reset}
      className={cn("inline-flex", className)}
    >
      {children}
    </motion.div>
  )
}
