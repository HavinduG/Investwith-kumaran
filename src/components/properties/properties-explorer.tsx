"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { ArrowDownUp, ChevronDown, Search, SearchX, X } from "lucide-react"

import { ProjectCard } from "@/components/properties/project-card"
import {
  buildFilterGroups,
  EMPTY_FILTERS,
  type Filters,
  matchesFilters,
  matchesKeyword,
  ProjectFilters,
  type SearchState,
  searchStateFromParams,
  searchStateToQuery,
  SORT_OPTIONS,
  type SortKey,
  sortProjects,
} from "@/components/properties/project-filters"
import { Button } from "@/components/ui/button"
import type { ProjectSummary } from "@/lib/wordpress"

const EASE = [0.22, 1, 0.36, 1] as const
// Typing updates results at once; the URL follows after a short pause
const KEYWORD_URL_DELAY_MS = 350

const DEFAULT_STATE: SearchState = { filters: EMPTY_FILTERS, keyword: "", sort: "newest" }

/** Explorer seeded from the current URL (?type=…&area=…&beds=…&q=…&sort=…). */
export function PropertiesExplorerFromParams({ projects }: { projects: ProjectSummary[] }) {
  const params = useSearchParams()
  return <PropertiesExplorer projects={projects} initial={searchStateFromParams(new URLSearchParams(params))} />
}

/** Filterable, sortable grid of every property; the choices are mirrored into the URL. */
export function PropertiesExplorer({
  projects,
  initial = DEFAULT_STATE,
}: {
  projects: ProjectSummary[]
  initial?: SearchState
}) {
  const router = useRouter()
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()
  const [filters, setFilters] = useState<Filters>(initial.filters)
  const [keyword, setKeyword] = useState(initial.keyword)
  const [sort, setSort] = useState<SortKey>(initial.sort)
  const keywordTimer = useRef<number>(undefined)

  const groups = useMemo(() => buildFilterGroups(projects), [projects])
  const results = useMemo(
    () =>
      sortProjects(
        projects.filter((project) => matchesFilters(project, filters) && matchesKeyword(project, keyword)),
        sort
      ),
    [projects, filters, keyword, sort]
  )

  const syncUrl = (state: SearchState) => {
    const query = searchStateToQuery(state)
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }

  useEffect(() => () => window.clearTimeout(keywordTimer.current), [])

  const changeFilters = (next: Filters) => {
    setFilters(next)
    syncUrl({ filters: next, keyword, sort })
  }

  const changeSort = (next: SortKey) => {
    setSort(next)
    syncUrl({ filters, keyword, sort: next })
  }

  const changeKeyword = (next: string) => {
    setKeyword(next)
    window.clearTimeout(keywordTimer.current)
    keywordTimer.current = window.setTimeout(() => syncUrl({ filters, keyword: next, sort }), KEYWORD_URL_DELAY_MS)
  }

  const clearAll = () => {
    window.clearTimeout(keywordTimer.current)
    setFilters(EMPTY_FILTERS)
    setKeyword("")
    setSort("newest")
    syncUrl(DEFAULT_STATE)
  }

  const dirty = Object.values(filters).some(Boolean) || Boolean(keyword.trim()) || sort !== "newest"

  return (
    <div>
      <ProjectFilters
        groups={groups}
        filters={filters}
        onChange={changeFilters}
        onClear={clearAll}
        dirty={dirty}
        shown={results.length}
        total={projects.length}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="group relative block">
            <span className="sr-only">Search by name or location</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-gold-ink" />
            <input
              type="search"
              value={keyword}
              onChange={(event) => changeKeyword(event.target.value)}
              placeholder="Search by project, community or developer…"
              className="h-12 w-full rounded-full border border-border bg-background/50 pr-11 pl-11 text-sm outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground/60 hover:border-gold/30 focus:border-gold/60 focus:shadow-[0_0_0_4px_color-mix(in_oklab,var(--gold)_14%,transparent)] [&::-webkit-search-cancel-button]:hidden"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => changeKeyword("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </label>

          <label className="relative block">
            <span className="sr-only">Sort properties</span>
            <ArrowDownUp className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-gold-ink" />
            <select
              value={sort}
              onChange={(event) => changeSort(event.target.value as SortKey)}
              className="h-12 w-full cursor-pointer appearance-none rounded-full border border-border bg-background/50 pr-10 pl-11 text-sm outline-none transition-colors hover:border-gold/30 focus:border-gold/60 sm:w-56"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
          </label>
        </div>
      </ProjectFilters>

      {/* ---------------------------------- Results ---------------------------------- */}
      {results.length > 0 ? (
        <motion.ul layout={!reduceMotion} className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {results.map((project, i) => (
              <motion.li
                key={project.id}
                layout={!reduceMotion}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.5, ease: EASE, delay: reduceMotion ? 0 : Math.min(i, 8) * 0.04 }}
                className="flex"
              >
                <ProjectCard project={project} index={i} className="w-full" />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="mt-8 grid place-items-center rounded-[1.75rem] border border-dashed border-border px-6 py-20 text-center"
        >
          <SearchX className="size-10 text-gold/60" strokeWidth={1.25} />
          <p className="mt-4 font-display text-2xl font-light">No properties match your search</p>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Try a different area, bedroom count or keyword — or clear the filters to see everything.
          </p>
          <Button variant="glass" size="xl" className="mt-6" onClick={clearAll}>
            Show all properties
          </Button>
        </motion.div>
      )}
    </div>
  )
}
