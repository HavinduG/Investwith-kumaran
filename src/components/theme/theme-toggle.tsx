"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "./theme-provider"

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <Button
      type="button"
      variant="glass"
      size="icon-lg"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light theme" : "Dark theme"}
      className={cn("relative overflow-hidden rounded-full", className)}
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={theme}
          className="grid place-items-center text-gold-ink"
          initial={{ y: 18, rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
          exit={{ y: -18, rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
        >
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </motion.span>
      </AnimatePresence>
    </Button>
  )
}
