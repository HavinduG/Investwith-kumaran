import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, Check, ChevronRight, MapPin, MessageCircle } from "lucide-react"

import { RevealGroup } from "@/components/motion/reveal-group"
import { categoryLabel, FactIcon } from "@/components/properties/fact-icon"
import { ProjectCard } from "@/components/properties/project-card"
import { ProjectGallery } from "@/components/properties/project-gallery"
import { Button } from "@/components/ui/button"
import { PROPERTIES_PAGE, projectHref } from "@/lib/routes"
import { externalLinkProps } from "@/lib/utils"
import { withWhatsAppMessage } from "@/lib/whatsapp"
import { getHomeContent, getProject, getProjectSummaries } from "@/lib/wordpress"

const MORE_COUNT = 3

export async function generateStaticParams() {
  const projects = await getProjectSummaries()
  // Cache Components needs at least one sample; unknown slugs render a 404
  return projects.length ? projects.map(({ slug }) => ({ slug })) : [{ slug: "unavailable" }]
}

export async function generateMetadata({ params }: PageProps<"/properties/[slug]">): Promise<Metadata> {
  const { slug } = await params
  const project = await getProject(slug)
  if (!project) return { title: "Property not found" }

  const description = project.summary || [project.location, project.price].filter(Boolean).join(" · ")
  const images = project.images[0]
    ? [{ url: project.images[0].src, width: project.images[0].width, height: project.images[0].height, alt: project.images[0].alt }]
    : undefined

  return {
    title: project.title,
    description,
    alternates: { canonical: projectHref(project.slug) },
    openGraph: { title: project.title, description, images, url: projectHref(project.slug) },
    twitter: { title: project.title, description, images },
  }
}

/**
 * The slug is only known at request time for projects published after the
 * build, so it is read inside Suspense: visitors get the page shell instantly
 * and the property streams in (then stays cached for the next visit).
 */
export default function PropertyPage({ params }: PageProps<"/properties/[slug]">) {
  return (
    <Suspense fallback={<PropertySkeleton />}>
      <PropertyDetails params={params} />
    </Suspense>
  )
}

async function PropertyDetails({ params }: Pick<PageProps<"/properties/[slug]">, "params">) {
  const { slug } = await params
  const [project, others, { header, hero }] = await Promise.all([
    getProject(slug),
    getProjectSummaries(),
    getHomeContent(),
  ])
  if (!project) notFound()

  const more = others.filter((other) => other.id !== project.id).slice(0, MORE_COUNT)
  const bookingCta = header.cta
  const whatsappCta = hero.primaryCta

  return (
    <RevealGroup>
      <article className="mx-auto w-full max-w-7xl px-5 pt-28 pb-20 sm:px-8 lg:pt-36 lg:pb-28">
        {/* ------------------------------ Breadcrumb ------------------------------ */}
        <nav aria-label="Breadcrumb" data-reveal>
          <ol className="flex flex-wrap items-center gap-1.5 font-mono text-[0.65rem] tracking-[0.2em] text-muted-foreground uppercase">
            <li>
              <Link href="/" className="transition-colors hover:text-gold-ink">
                Home
              </Link>
            </li>
            <ChevronRight aria-hidden className="size-3" />
            <li>
              <Link href={PROPERTIES_PAGE} className="transition-colors hover:text-gold-ink">
                Properties
              </Link>
            </li>
            <ChevronRight aria-hidden className="size-3" />
            <li aria-current="page" className="max-w-[60vw] truncate text-foreground">
              {project.title}
            </li>
          </ol>
        </nav>

        {/* -------------------------------- Header -------------------------------- */}
        <header className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <div data-reveal className="flex flex-wrap items-center gap-2.5">
              {project.category && (
                <span className="rounded-full bg-gold px-3 py-1 font-mono text-[0.62rem] font-medium tracking-[0.2em] text-gold-foreground uppercase">
                  {categoryLabel(project.category)}
                </span>
              )}
              {project.location && (
                <span className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 text-gold-ink" />
                  {project.location}
                </span>
              )}
            </div>
            <h1
              data-reveal
              className="mt-5 font-display text-[clamp(2.5rem,6vw,5rem)] leading-none font-light tracking-[-0.035em] text-balance"
            >
              {project.title}
            </h1>
          </div>

          <div data-reveal className="lg:col-span-4 lg:text-right">
            <p className="font-mono text-[0.62rem] tracking-[0.3em] text-muted-foreground uppercase">Price</p>
            <p className="text-gold-gradient mt-2 font-display text-[clamp(1.6rem,2.6vw,2.25rem)] leading-tight">
              {project.price || "On request"}
            </p>
          </div>
        </header>

        {/* -------------------------------- Gallery -------------------------------- */}
        <div data-reveal className="mt-10">
          <ProjectGallery images={project.images} title={project.title} />
        </div>

        {/* -------------------------------- Body -------------------------------- */}
        <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            {project.facts.length > 0 && (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {project.facts.map((fact) => (
                  <li
                    key={fact.label}
                    data-reveal
                    className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-colors duration-500 hover:border-gold/40"
                  >
                    <span className="absolute inset-x-0 top-0 h-px origin-left scale-x-0 bg-linear-to-r from-emerald via-gold to-transparent transition-transform duration-700 group-hover:scale-x-100" />
                    <span className="grid size-10 place-items-center rounded-xl bg-gold/12 text-gold-ink">
                      <FactIcon label={fact.label} className="size-5" />
                    </span>
                    <p className="mt-4 font-mono text-[0.6rem] tracking-[0.2em] text-muted-foreground uppercase">
                      {fact.label}
                    </p>
                    <p className="mt-1 text-lg leading-snug font-medium">{fact.value}</p>
                  </li>
                ))}
              </ul>
            )}

            {project.overview.length > 0 && (
              <section aria-labelledby="overview" className="mt-14">
                <SectionHeading id="overview" index={1}>
                  Overview
                </SectionHeading>
                <div className="mt-6 space-y-4">
                  {project.overview.map((paragraph, i) => (
                    <p
                      key={i}
                      data-reveal
                      className="text-[1.05rem] leading-relaxed text-foreground/85 first:font-display first:text-[1.35rem] first:leading-snug first:font-light first:text-foreground"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            )}

            {project.details.map((section, i) => {
              const id = `details-${i}`
              return (
                <section key={id} aria-labelledby={section.heading ? id : undefined} className="mt-14">
                  {section.heading && (
                    <SectionHeading id={id} index={i + 2}>
                      {section.heading}
                    </SectionHeading>
                  )}
                  {section.paragraphs.length > 0 && (
                    <div className="mt-6 space-y-4">
                      {section.paragraphs.map((paragraph, k) => (
                        <p key={k} data-reveal className="leading-relaxed text-foreground/80">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  )}
                  {section.items.length > 0 && (
                    <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                      {section.items.map((item) => (
                        <li
                          key={item}
                          data-reveal
                          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm transition-colors duration-300 hover:border-gold/40"
                        >
                          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald/15 text-emerald">
                            <Check className="size-3.5" />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )
            })}
          </div>

          {/* ----------------------------- Enquiry card ----------------------------- */}
          <aside className="lg:col-span-4">
            <div
              data-reveal
              className="relative overflow-hidden rounded-[1.75rem] border border-gold/25 bg-card p-6 shadow-[0_40px_100px_-50px_color-mix(in_oklab,var(--gold)_50%,transparent)] sm:p-7 lg:sticky lg:top-28"
            >
              <div
                aria-hidden
                className="absolute -top-24 -right-24 size-64 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--gold)_20%,transparent),transparent)]"
              />
              <p className="relative font-mono text-[0.62rem] tracking-[0.3em] text-gold-ink uppercase">
                Interested in this property?
              </p>
              <p className="relative mt-3 font-display text-2xl leading-tight font-light">{project.title}</p>

              <dl className="relative mt-6 divide-y divide-border border-y border-border text-sm">
                {project.price && (
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-muted-foreground">Price</dt>
                    <dd className="text-right font-medium text-gold-ink">{project.price}</dd>
                  </div>
                )}
                {project.location && (
                  <div className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="text-right">{project.location}</dd>
                  </div>
                )}
                {project.facts.map((fact) => (
                  <div key={fact.label} className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-muted-foreground">{fact.label}</dt>
                    <dd className="text-right">{fact.value}</dd>
                  </div>
                ))}
              </dl>

              {(bookingCta || whatsappCta) && (
                <div className="relative mt-6 grid gap-3">
                  {bookingCta && (
                    <Button asChild variant="gold" size="xl" className="w-full">
                      <Link href={bookingCta.href}>
                        {bookingCta.label}
                        <ArrowUpRight className="transition-transform duration-300 group-hover/button:rotate-45" />
                      </Link>
                    </Button>
                  )}
                  {whatsappCta && (
                    <Button
                      asChild
                      size="xl"
                      className="w-full bg-emerald text-white shadow-[0_10px_40px_-12px_var(--emerald)] hover:bg-emerald/90"
                    >
                      <Link
                        href={withWhatsAppMessage(
                          whatsappCta.href,
                          `Hi Kamran, I'm interested in ${project.title}${project.location ? ` (${project.location})` : ""}. Could you share the latest availability and details?`
                        )}
                        {...externalLinkProps(whatsappCta.href)}
                      >
                        <MessageCircle />
                        {whatsappCta.label}
                      </Link>
                    </Button>
                  )}
                </div>
              )}

              <p className="relative mt-5 text-xs leading-relaxed text-muted-foreground">
                Ask for the current availability, payment plan and developer information before you decide.
              </p>
            </div>
          </aside>
        </div>

        {/* ---------------------------- More properties ---------------------------- */}
        {more.length > 0 && (
          <section aria-labelledby="more-properties" className="mt-24 border-t border-border pt-14 lg:mt-32">
            <div data-reveal className="flex flex-wrap items-end justify-between gap-6">
              <h2
                id="more-properties"
                className="font-display text-[clamp(2rem,3.6vw,3rem)] leading-[1.05] font-light tracking-[-0.03em]"
              >
                More properties <span className="text-gold-gradient italic">to explore</span>
              </h2>
              <Link
                href={PROPERTIES_PAGE}
                className="group inline-flex items-center gap-2 text-sm text-gold-ink"
              >
                <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
                All properties
              </Link>
            </div>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((other, i) => (
                <li key={other.id} data-reveal className="flex">
                  <ProjectCard project={other} index={i} className="w-full" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </RevealGroup>
  )
}

function PropertySkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading property"
      className="mx-auto w-full max-w-7xl animate-pulse px-5 pt-28 pb-20 sm:px-8 lg:pt-36"
    >
      <div className="h-3 w-56 rounded-full bg-muted" />
      <div className="mt-8 flex gap-2.5">
        <div className="h-6 w-20 rounded-full bg-muted" />
        <div className="h-6 w-44 rounded-full bg-muted" />
      </div>
      <div className="mt-5 h-[clamp(2.5rem,6vw,5rem)] w-3/4 rounded-2xl bg-muted" />
      <div className="mt-10 aspect-4/3 rounded-[2rem] bg-muted sm:aspect-video" />
      <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="grid grid-cols-2 gap-3 self-start sm:grid-cols-3 lg:col-span-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted" />
          ))}
        </div>
        <div className="h-96 rounded-[1.75rem] bg-muted lg:col-span-4" />
      </div>
    </div>
  )
}

function SectionHeading({ id, index, children }: { id: string; index: number; children: React.ReactNode }) {
  return (
    <h2 id={id} data-reveal className="flex items-baseline gap-4 font-display text-[clamp(1.6rem,2.6vw,2.2rem)] leading-tight font-light tracking-[-0.02em]">
      <span className="font-mono text-[0.68rem] tracking-[0.15em] text-gold-ink">{String(index).padStart(2, "0")}</span>
      {children}
    </h2>
  )
}
