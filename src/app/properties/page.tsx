import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { RevealGroup } from "@/components/motion/reveal-group"
import { PropertiesExplorer, PropertiesExplorerFromParams } from "@/components/properties/properties-explorer"
import { PROPERTIES_PAGE } from "@/lib/routes"
import { getHomeContent, getProjectSummaries } from "@/lib/wordpress"

export const metadata: Metadata = {
  title: "Properties in Dubai",
  description:
    "Browse off-plan, secondary and rental properties in Dubai. Filter by type, community and bedrooms, then speak with Kamran about the ones that fit.",
  alternates: { canonical: PROPERTIES_PAGE },
}

/** The last two words of the heading are set as the gold, italic accent. */
function accentTail(title: string) {
  const words = title.split(" ")
  if (words.length < 3) return { lead: "", accent: title }
  return { lead: words.slice(0, -2).join(" "), accent: words.slice(-2).join(" ") }
}

export default async function PropertiesPage() {
  const [projects, { projectsIntro }] = await Promise.all([getProjectSummaries(), getHomeContent()])
  const { lead, accent } = accentTail(projectsIntro.title || "Properties worth a closer look")

  return (
    <RevealGroup>
      <section aria-labelledby="properties-page-title" className="mx-auto w-full max-w-7xl px-5 pt-28 pb-20 sm:px-8 lg:pt-36 lg:pb-28">
        <nav aria-label="Breadcrumb" data-reveal>
          <ol className="flex items-center gap-1.5 font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
            <li>
              <Link href="/" className="transition-colors hover:text-gold-ink">
                Home
              </Link>
            </li>
            <ChevronRight aria-hidden className="size-3" />
            <li aria-current="page" className="text-foreground">
              Properties
            </li>
          </ol>
        </nav>

        <header className="mt-8 grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p
              data-reveal
              className="flex items-center gap-4 font-mono text-[0.7rem] tracking-[0.3em] text-gold-ink uppercase"
            >
              <span className="h-px w-12 bg-gold/60" />
              {projects.length} {projects.length === 1 ? "listing" : "listings"}
            </p>
            <h1
              id="properties-page-title"
              data-reveal
              className="mt-5 font-display text-[clamp(2.6rem,6vw,5rem)] leading-none font-light tracking-[-0.035em] text-balance"
            >
              {lead && <>{lead} </>}
              <span className="text-gold-gradient pr-[0.08em] italic">{accent}</span>
            </h1>
          </div>
          {projectsIntro.description && (
            <p
              data-reveal
              className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem] lg:col-span-4 lg:justify-self-end lg:pb-2 lg:text-right"
            >
              {projectsIntro.description}
            </p>
          )}
        </header>

        <div data-reveal className="mt-10 lg:mt-14">
          {projects.length > 0 ? (
            // URL filters are read in the browser; the prebuilt page lists every property
            <Suspense fallback={<PropertiesExplorer projects={projects} />}>
              <PropertiesExplorerFromParams projects={projects} />
            </Suspense>
          ) : (
            <p className="rounded-[1.75rem] border border-dashed border-border px-6 py-20 text-center text-muted-foreground">
              No properties are listed right now. Please check back soon.
            </p>
          )}
        </div>
      </section>
    </RevealGroup>
  )
}
