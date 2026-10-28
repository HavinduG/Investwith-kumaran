import { Bath, BedDouble, Building2, Car, Layers, Ruler, Sparkles } from "lucide-react"

const ICONS = [
  { match: /bed/i, icon: BedDouble },
  { match: /bath/i, icon: Bath },
  { match: /area|size|sq/i, icon: Ruler },
  { match: /floor|level/i, icon: Layers },
  { match: /park/i, icon: Car },
  { match: /type|unit/i, icon: Building2 },
]

/** Picks an icon for a project fact from its WordPress label. */
export function FactIcon({ label, className }: { label: string; className?: string }) {
  const Icon = ICONS.find((entry) => entry.match.test(label))?.icon ?? Sparkles
  return <Icon aria-hidden className={className} />
}

/** "Sale" → "For sale"; any other category is shown as entered. */
export const categoryLabel = (category: string) =>
  /^(sale|rent)$/i.test(category) ? `For ${category.toLowerCase()}` : category
