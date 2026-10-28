import Image from "next/image"
import { Globe } from "lucide-react"

import { cn } from "@/lib/utils"
import type { SocialLink } from "@/lib/wordpress"

// Line icons in the lucide style (lucide no longer ships brand marks)
const PATHS: Record<string, React.ReactNode> = {
  facebook: <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15Z" />,
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </>
  ),
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M8 10.5V17M8 7.5v.01M12 17v-6.5M12 13.5a2.5 2.5 0 0 1 5 0V17" />
    </>
  ),
  x: <path d="M4 4l16 16M20 4 4 20" />,
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10 9.5 4.5 2.5-4.5 2.5Z" />
    </>
  ),
}

const keyFor = (name: string) => {
  const value = name.toLowerCase().replace(/[^a-z]/g, "")
  if (value === "twitter") return "x"
  return value
}

/** Icon for a social network: the CMS image when one is set, otherwise a matching line icon. */
export function SocialIcon({ social, className }: { social: SocialLink; className?: string }) {
  if (social.icon) {
    return (
      <span className={cn("relative inline-block", className)}>
        <Image src={social.icon.src} alt="" fill sizes="20px" className="object-contain" />
      </span>
    )
  }

  const path = PATHS[keyFor(social.name)]
  if (!path) return <Globe className={className} />

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {path}
    </svg>
  )
}

/** "linkedin" → "LinkedIn", "facebook" → "Facebook". */
export function socialLabel(name: string) {
  const known: Record<string, string> = { linkedin: "LinkedIn", youtube: "YouTube", x: "X", tiktok: "TikTok" }
  return known[keyFor(name)] ?? name.charAt(0).toUpperCase() + name.slice(1)
}
