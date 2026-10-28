"use client"

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useSyncExternalStore,
} from "react"

import { DEFAULT_THEME, THEME_STORAGE_KEY, type Theme } from "./theme-script"

type ThemeContextValue = {
  theme: Theme
  /** Toggles the theme, revealing it in a circle from `origin` when supported. */
  toggleTheme: (origin?: { x: number; y: number }) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.classList.toggle("light", theme === "light")
  root.style.colorScheme = theme
}

function readStoredTheme(): Theme {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark"
  } catch {
    return DEFAULT_THEME
  }
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  return () => observer.disconnect()
}

const getSnapshot = (): Theme =>
  document.documentElement.classList.contains("light") ? "light" : "dark"
const getServerSnapshot = (): Theme => DEFAULT_THEME

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // React resets <html> attributes on the dev Strict Mode remount; re-apply them.
  useLayoutEffect(() => {
    document.documentElement.classList.add("js")
    applyTheme(readStoredTheme())
  }, [])

  const toggleTheme = useCallback<ThemeContextValue["toggleTheme"]>(
    (origin) => {
      const next: Theme = theme === "dark" ? "light" : "dark"
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next)
      } catch {}

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      if (!document.startViewTransition || reduceMotion) {
        applyTheme(next)
        return
      }

      const x = origin?.x ?? window.innerWidth / 2
      const y = origin?.y ?? 0
      const radius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )

      const transition = document.startViewTransition(() => applyTheme(next))
      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 750,
            easing: "cubic-bezier(0.76, 0, 0.24, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        )
      })
    },
    [theme]
  )

  return <ThemeContext value={{ theme, toggleTheme }}>{children}</ThemeContext>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>")
  return context
}
