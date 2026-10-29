"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { BedDouble, MapPin, RotateCcw, Search, SlidersHorizontal, Tag } from "lucide-react"

import { categoryLabel } from "@/components/properties/fact-icon"
import { Button } from "@/components/ui/button"
import { PROPERTIES_PAGE } from "@/lib/routes"
import { cn } from "@/lib/utils"
import type { ProjectSummary } from "@/lib/wordpress"

export type FilterKey = "type" | "area" | "beds"
export type Filters = Record<FilterKey, string | null>

export const EMPTY_FILTERS: Filters = { type: null, area: null, beds: null }
const FILTER_KEYS: FilterKey[] = ["type", "area", "beds"]

type FilterGroup = {
  key: FilterKey
  label: string
  icon: typeof Tag
  options: { value: string; label: string }[]
}

/** The value a project has for each filter (null when it doesn't say). */
function valuesOf(project: ProjectSummary): Filters {
  const beds = project.facts.find((fact) => /bed/i.test(fact.label))?.value.trim()
  return {
    type: project.category || null,
    // "Dubai South, Dubai, United Arab Emirates" → "Dubai South"
    area: project.location.split(",")[0]?.trim() || null,
    beds: beds ? (beds.match(/\d+/)?.[0] ?? beds) : null,
  }
}

const bedsLabel = (value: string) => (/^\d+$/.test(value) ? `${value} BR` : value)

/** Filter groups built from the projects themselves; groups with fewer than two options are left out. */
export function buildFilterGroups(projects: ProjectSummary[]): FilterGroup[] {
  const collect = (key: FilterKey) =>
    [...new Set(projects.map((project) => valuesOf(project)[key]).filter((value): value is string => Boolean(value)))]

  const groups: FilterGroup[] = [
    {
      key: "type",
      label: "Type",
      icon: Tag,
      options: collect("type").map((value) => ({ value, label: categoryLabel(value) })),
    },
    {
      key: "area",
      label: "Area",
      icon: MapPin,
      options: collect("area")
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value })),
    },
    {
      key: "beds",
      label: "Bedrooms",
      icon: BedDouble,
      options: collect("beds")
        .sort((a, b) => (Number(a) || 0) - (Number(b) || 0))
        .map((value) => ({ value, label: bedsLabel(value) })),
    },
  ]
  return groups.filter((group) => group.options.length > 1)
}

export function matchesFilters(project: ProjectSummary, filters: Filters) {
  const values = valuesOf(project)
  return FILTER_KEYS.every((key) => !filters[key] || values[key] === filters[key])
}

/* ------------------------------- Keyword & sort ------------------------------- */

export type SortKey = "newest" | "price-asc" | "price-desc"

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
]

export function matchesKeyword(project: ProjectSummary, keyword: string) {
  const query = keyword.trim().toLowerCase()
  if (!query) return true
  return [project.title, project.location, project.summary, project.category]
    .join(" ")
    .toLowerCase()
    .includes(query)
}

/** Lowest number in a price string: "AED 0.78M - AED 0.916M" → 780000, "AED630,000" → 630000. */
function priceValue(price: string) {
  const match = price.replace(/,/g, "").match(/(\d+(?:\.\d+)?)\s*([mk])?/i)
  if (!match) return null
  const unit = match[2]?.toLowerCase()
  return Number(match[1]) * (unit === "m" ? 1_000_000 : unit === "k" ? 1_000 : 1)
}

/** Sorted copy; properties without a readable price go last. "newest" keeps the CMS order. */
export function sortProjects(projects: ProjectSummary[], sort: SortKey) {
  if (sort === "newest") return projects
  const direction = sort === "price-asc" ? 1 : -1
  return [...projects].sort((a, b) => {
    const pa = priceValue(a.price)
    const pb = priceValue(b.price)
    if (pa === null) return pb === null ? 0 : 1
    if (pb === null) return -1
    return (pa - pb) * direction
  })
}

/* --------------------------------- URL state --------------------------------- */

export type SearchState = { filters: Filters; keyword: string; sort: SortKey }

export function searchStateFromParams(params: URLSearchParams): SearchState {
  const sort = params.get("sort") as SortKey | null
  return {
    filters: { type: params.get("type"), area: params.get("area"), beds: params.get("beds") },
    keyword: params.get("q") ?? "",
    sort: SORT_OPTIONS.some((option) => option.value === sort) ? (sort as SortKey) : "newest",
  }
}

export function searchStateToQuery({ filters, keyword = "", sort = "newest" }: Partial<SearchState> & { filters: Filters }) {
  const params = new URLSearchParams()
  for (const key of FILTER_KEYS) if (filters[key]) params.set(key, filters[key]!)
  if (keyword.trim()) params.set("q", keyword.trim())
  if (sort !== "newest") params.set("sort", sort)
  return params.toString()
}

/** Link to the properties page with these filters applied. */
export const propertiesSearchHref = (state: Partial<SearchState> & { filters: Filters }) => {
  const query = searchStateToQuery(state)
  return query ? `${PROPERTIES_PAGE}?${query}` : PROPERTIES_PAGE
}

/* ---------------------------------- Filter bar ---------------------------------- */

export function ProjectFilters({
  groups,
  filters,
  onChange,
  onClear,
  dirty,
  shown,
  total,
  searchHref,
  children,
}: {
  groups: FilterGroup[]
  filters: Filters
  onChange: (filters: Filters) => void
  /** Resets everything, including controls passed as `children`. Defaults to clearing the filters. */
  onClear?: () => void
  /** Whether anything (filters or extra controls) is set; defaults to "any filter chosen". */
  dirty?: boolean
  shown: number
  total: number
  /** When set, shows a Search button that opens the properties page with these filters. */
  searchHref?: string
  /** Extra controls (e.g. keyword search and sort) shown above the filter groups. */
  children?: React.ReactNode
}) {
  const active = dirty ?? Object.values(filters).some(Boolean)

  return (
    <div
      role="search"
      aria-label="Filter properties"
      className="rounded-[1.5rem] border border-border bg-card/60 p-4 backdrop-blur-sm sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-mono text-[0.62rem] tracking-[0.25em] text-gold-ink uppercase">
          <SlidersHorizontal className="size-3.5" />
          Filter properties
        </p>
        <div className="flex items-center gap-3">
          <p aria-live="polite" className="font-mono text-[0.62rem] tracking-[0.2em] text-muted-foreground uppercase">
            <span className="text-foreground tabular-nums">{shown}</span> of {total}
          </p>
          <button
            type="button"
            onClick={onClear ?? (() => onChange(EMPTY_FILTERS))}
            disabled={!active}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-foreground/80 transition-all hover:border-gold/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            <RotateCcw className="size-3" />
            Clear
          </button>
        </div>
      </div>

      {children && <div className="mt-4">{children}</div>}

      <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid min-w-0 flex-1 gap-3 lg:grid-cols-[repeat(auto-fit,minmax(14rem,auto))] lg:gap-x-8">
          {groups.map((group) => (
            <div key={group.key} className="flex min-w-0 items-center gap-3">
              <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <group.icon className="size-3.5 text-gold-ink" />
                {group.label}
              </span>
              {/* Pills scroll sideways on narrow screens */}
              <div
                role="radiogroup"
                aria-label={group.label}
                className="-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 py-0.5 scrollbar-none"
              >
                {[{ value: null, label: group.key === "beds" ? "Any" : "All" }, ...group.options].map((option) => {
                  const selected = filters[group.key] === option.value
                  return (
                    <button
                      key={option.value ?? "all"}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => onChange({ ...filters, [group.key]: option.value })}
                      className={cn(
                        "relative shrink-0 rounded-full px-3.5 py-1.5 text-xs whitespace-nowrap outline-none transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-gold/50 sm:text-[0.8rem]",
                        selected ? "text-gold-foreground" : "text-foreground/70 hover:bg-foreground/6 hover:text-foreground"
                      )}
                    >
                      {selected && (
                        <motion.span
                          layoutId={`project-filter-${group.key}`}
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          className="absolute inset-0 rounded-full bg-gold shadow-[0_6px_20px_-8px_var(--gold)]"
                        />
                      )}
                      <span className="relative">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {searchHref && (
          <Button asChild variant="gold" size="xl" className="w-full shrink-0 lg:w-auto">
            <Link href={searchHref}>
              <Search />
              Search properties
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
