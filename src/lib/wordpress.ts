import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { isWhatsAppHref, whatsappNumberFrom, whatsappUrl } from "@/lib/whatsapp"

const WORDPRESS_API_URL =
  process.env.WORDPRESS_API_URL ?? "http://investwithkamran.local/wp-json"
const WORDPRESS_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_URL ?? "http://investwithkamran.local"

/* -------------------------------------------------------------------------- */
/*                               Raw ACF shapes                               */
/* -------------------------------------------------------------------------- */

// ACF returns `false` for empty images, repeaters and flexible content.
type Maybe<T> = T | false | null | undefined

export type WPImage = {
  id: number
  url: string
  alt: string
  width: number
  height: number
  sizes?: Record<string, string | number>
}

type FlexibleRow<Layout extends string, Fields> = {
  acf_fc_layout: Layout
} & Fields

type HomeACF = {
  header_log: Maybe<WPImage | string | number>
  header_menus: Maybe<FlexibleRow<"menu", { menu_name: string; menu_url: string }>[]>
  header_button_1: Maybe<string>
  header_button_1_url: Maybe<string>
  hero_image: Maybe<WPImage>
  hero_job_role: Maybe<FlexibleRow<"job_role", { job_role_name: string }>[]>
  hero_description: Maybe<string>
  hero_section_button_1: Maybe<string>
  hero_section_button_1_url: Maybe<string>
  hero_section_button_2: Maybe<string>
  hero_section_button_2_url: Maybe<string>
  hero_scroll_bar: Maybe<FlexibleRow<"hero_scroll", { scroll_name: string }>[]>
  hero_card_section: Maybe<
    FlexibleRow<"hero_card", { card_count: string; card_title: string; card_sub_title: string }>[]
  >
  about_image: Maybe<WPImage>
  about_title: Maybe<string>
  about_description: Maybe<string>
  about_description_2: Maybe<string>
  about_description_3: Maybe<string>
  project_title: Maybe<string>
  project_description: Maybe<string>
  partners_title: Maybe<string>
  reward_title: Maybe<string>
  testimonial_title: Maybe<string>
  contact_image: Maybe<WPImage>
  contact_title: Maybe<string>
  contact_description: Maybe<string>
  social_media: Maybe<
    FlexibleRow<
      "social_medias",
      { social_media_image: Maybe<WPImage>; social_media_name: string; social_media_link: string }
    >[]
  >
  personal_details: Maybe<string>
  footer_logo: Maybe<WPImage>
  footer_title: Maybe<string>
  footer_button_1: Maybe<string>
  footer_button_1_url: Maybe<string>
  footer_button_2: Maybe<string>
  footer_button_2_url: Maybe<string>
  footer_links: Maybe<
    {
      footer_link_title: string
      footer_links: Maybe<FlexibleRow<"footer_links", { footer_link_name: string; footer_link_url: string }>[]>
    }[]
  >
  testimonial_: Maybe<
    FlexibleRow<
      "testimonials",
      {
        name: string
        other_details: string
        testimonial_description: string
        testimonial_image: Maybe<WPImage>
        feedback_stars: Maybe<string | number>
      }
    >[]
  >
  partners_description: Maybe<string>
  client_logo_names: Maybe<FlexibleRow<"client_logos", { client_logo_image: Maybe<WPImage> }>[]>
  services_title_1: Maybe<string>
  services_description: Maybe<string>
  services: Maybe<
    FlexibleRow<
      "service",
      {
        service_image: Maybe<FlexibleRow<"service_images", { service_images: Maybe<WPImage> }>[]>
        service_title: string
        service_description: string
      }
    >[]
  >
}

type WPPage<ACF> = {
  id: number
  slug: string
  title: { rendered: string }
  acf: ACF | []
}

/* -------------------------------------------------------------------------- */
/*                            Normalized site shapes                          */
/* -------------------------------------------------------------------------- */

export type CmsLink = { label: string; href: string }

export type CmsImage = {
  src: string
  alt: string
  width: number
  height: number
}

export type HeaderContent = {
  logo: CmsImage | null
  menu: CmsLink[]
  cta: CmsLink | null
}

export type HeroContent = {
  image: CmsImage | null
  roles: string[]
  description: string
  primaryCta: CmsLink | null
  secondaryCta: CmsLink | null
  marquee: string[]
}

export type StatItem = {
  value: string
  title: string
  caption: string
}

export type AboutContent = {
  image: CmsImage | null
  title: string
  paragraphs: string[]
  quote: string
  helpHeading: string
  helpItems: string[]
}

export type ServicePoint = { heading: string; body: string }

export type ServiceItem = {
  title: string
  image: CmsImage | null
  /** First sentence of the description, used as the preview headline. */
  summary: string
  intro: string[]
  points: ServicePoint[]
}

export type ServicesContent = {
  title: string
  description: string
  items: ServiceItem[]
}

export type HomeContent = {
  header: HeaderContent
  hero: HeroContent
  stats: StatItem[]
  about: AboutContent | null
  services: ServicesContent | null
  projectsIntro: { title: string; description: string }
  partners: PartnersContent | null
  rewardsTitle: string
  testimonials: TestimonialsContent | null
  contact: ContactContent
  footer: FooterContent
}

export type FooterContent = {
  logo: CmsImage | null
  title: string
  whatsapp: CmsLink | null
  booking: CmsLink | null
  groups: { title: string; links: CmsLink[] }[]
  /** Year for the copyright line, resolved when the content is cached. */
  year: number
}

export type SocialLink = { name: string; href: string; icon: CmsImage | null }

export type ContactContent = {
  image: CmsImage | null
  title: string
  description: string
  socials: SocialLink[]
  /** Short legal/attribution line, e.g. who services are provided through. */
  note: string
}

export type Testimonial = {
  name: string
  role: string
  /** First line of the testimonial, e.g. "Professional & Reliable". */
  headline: string
  quote: string
  image: CmsImage | null
  /** 0–5; 0 when no rating was given. */
  rating: number
}

export type TestimonialsContent = {
  title: string
  items: Testimonial[]
}

export type PartnersContent = {
  title: string
  description: string
  logos: CmsImage[]
}

export type ProjectFact = { label: string; value: string }

/** A heading with the paragraphs and list items that follow it. */
export type ProjectDetailSection = {
  heading: string
  paragraphs: string[]
  items: string[]
}

export type ProjectSummary = {
  id: number
  slug: string
  title: string
  /** "Sale", "Rent", … as chosen in WordPress. */
  category: string
  location: string
  price: string
  images: CmsImage[]
  facts: ProjectFact[]
  summary: string
}

export type Project = ProjectSummary & {
  overview: string[]
  details: ProjectDetailSection[]
}

/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */

const text = (value: Maybe<string>) => (typeof value === "string" ? value.trim() : "")

const list = <T,>(value: Maybe<T[]>) => (Array.isArray(value) ? value : [])

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  ndash: "–",
  mdash: "—",
  hellip: "…",
}

const decodeEntities = (value: string) =>
  value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : Number(code.slice(1))
      return Number.isFinite(point) ? String.fromCodePoint(point) : match
    }
    return ENTITIES[code.toLowerCase()] ?? match
  })

/** Plain text from a WYSIWYG fragment, with whitespace collapsed. */
const stripTags = (html: string) =>
  decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim()

/** Splits WYSIWYG HTML into plain-text paragraphs on <p> and <br> boundaries. */
const toParagraphs = (html: Maybe<string>) =>
  text(html)
    .split(/<\/p>|<br\s*\/?>/i)
    .map(stripTags)
    .filter(Boolean)

/** Reads the optional heading and list items out of a WYSIWYG list field. */
function toHeadedList(html: Maybe<string>) {
  const value = text(html)
  const heading = value.match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)
  const items = Array.from(value.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi), (m) => stripTags(m[1]))
  return {
    heading: heading ? stripTags(heading[1]) : "",
    // Without a list, fall back to the remaining paragraphs
    items: (items.length ? items : toParagraphs(heading ? value.replace(heading[0], "") : value)).filter(Boolean),
  }
}

function normalizeAbout(acf: HomeACF): AboutContent | null {
  const help = toHeadedList(acf.about_description_3)
  const about: AboutContent = {
    image: toImage(acf.about_image, "Kamran, Dubai property adviser"),
    title: text(acf.about_title),
    paragraphs: toParagraphs(acf.about_description),
    quote: stripTags(text(acf.about_description_2)).replace(/^["“]|["”]$/g, ""),
    helpHeading: help.heading,
    helpItems: help.items,
  }
  return about.title || about.paragraphs.length ? about : null
}

/**
 * Splits a service description into plain intro paragraphs and the
 * "<strong>Heading</strong><br>body" blocks that follow them.
 */
function toServiceBlocks(html: Maybe<string>) {
  const intro: string[] = []
  const points: ServicePoint[] = []
  for (const chunk of text(html).split(/<\/p>/i)) {
    const block = chunk.match(/^\s*(?:<p[^>]*>)?\s*<(strong|b)>([\s\S]*?)<\/\1>([\s\S]*)$/i)
    if (block) {
      const heading = stripTags(block[2])
      const body = stripTags(block[3])
      if (heading || body) points.push({ heading, body })
    } else {
      const paragraph = stripTags(chunk)
      if (paragraph) intro.push(paragraph)
    }
  }
  return { intro, points }
}

const firstSentence = (value: string) => value.match(/^[\s\S]*?[.!?](?=\s|$)/)?.[0] ?? value

function normalizeServices(acf: HomeACF): ServicesContent | null {
  const items = list(acf.services)
    .map((service): ServiceItem => {
      const title = text(service.service_title)
      const { intro, points } = toServiceBlocks(service.service_description)
      const image = list(service.service_image)
        .map((row) => toImage(row.service_images, title))
        .find(Boolean)
      return { title, image: image ?? null, summary: firstSentence(intro[0] ?? ""), intro, points }
    })
    .filter((service) => service.title)

  return items.length
    ? { title: text(acf.services_title_1), description: stripTags(text(acf.services_description)), items }
    : null
}

/** The first line of a testimonial is its headline; the remaining lines are the quote. */
function normalizeTestimonials(acf: HomeACF): TestimonialsContent | null {
  const items = list(acf.testimonial_)
    .map((row): Testimonial => {
      const name = text(row.name)
      const lines = text(row.testimonial_description)
        .split(/\r?\n/)
        .map(stripTags)
        .filter(Boolean)
      const [first = "", ...rest] = lines
      const rating = Math.round(Number(row.feedback_stars))
      return {
        name,
        role: text(row.other_details),
        headline: rest.length ? first : "",
        quote: rest.length ? rest.join(" ") : first,
        image: toImage(row.testimonial_image, name ? `Portrait of ${name}` : "Client portrait"),
        rating: Number.isFinite(rating) ? Math.min(5, Math.max(0, rating)) : 0,
      }
    })
    .filter((item) => item.quote)

  return items.length ? { title: text(acf.testimonial_title), items } : null
}

function normalizePartners(acf: HomeACF): PartnersContent | null {
  const logos = list(acf.client_logo_names)
    .map((row, i) => toImage(row.client_logo_image, `Partner logo ${i + 1}`))
    .filter((logo): logo is CmsImage => logo !== null)
  return logos.length
    ? { title: text(acf.partners_title), description: stripTags(text(acf.partners_description)), logos }
    : null
}

/**
 * Turns a URL entered in WordPress into an href for the Next.js site.
 * Links pointing at the WordPress host become relative paths so they are
 * routed by Next.js instead of the CMS. Empty values fall back to `fallback`.
 */
export function toHref(url: Maybe<string>, fallback = "#") {
  const value = text(url)
  if (!value) return fallback
  if (value.startsWith("/") || value.startsWith("#")) return value

  try {
    const parsed = new URL(value)
    const wp = new URL(WORDPRESS_URL)
    if (parsed.host === wp.host) {
      return `${parsed.pathname.replace(/\/$/, "") || "/"}${parsed.search}${parsed.hash}`
    }
    return value
  } catch {
    return value
  }
}

const SECTION_ANCHORS: Record<string, string> = {
  home: "/",
  about: "/#about",
  services: "/#services",
  properties: "/#properties",
  projects: "/#properties",
  // Client content starts at the partners section and runs through testimonials
  clients: "/#partners",
  partners: "/#partners",
  rewards: "/#recognition",
  awards: "/#recognition",
  recognition: "/#recognition",
  testimonials: "/#testimonials",
  reviews: "/#testimonials",
  contact: "/#contact",
}

/** Fallback link for a menu label: its home-page section, otherwise a page with that slug. */
const sectionHref = (label: string) => SECTION_ANCHORS[slugify(label)] ?? `/${slugify(label)}`

function toImage(value: Maybe<WPImage | string | number>, fallbackAlt: string): CmsImage | null {
  if (!value || typeof value !== "object" || !value.url) return null
  return {
    src: value.url,
    alt: value.alt?.trim() || fallbackAlt,
    width: value.width,
    height: value.height,
  }
}

function toLink(label: Maybe<string>, url: Maybe<string>, fallback?: string): CmsLink | null {
  const value = text(label)
  return value ? { label: value, href: toHref(url, fallback) } : null
}

/**
 * WhatsApp button link: the first URL set in WordPress (a bare phone number also
 * works), otherwise Kamran's number with a friendly prefilled message.
 */
function toWhatsAppLink(label: Maybe<string>, ...urls: Maybe<string>[]): CmsLink | null {
  const value = text(label)
  if (!value) return null
  const url = urls.map(text).find(Boolean)
  if (!url) return { label: value, href: whatsappUrl() }
  const number = whatsappNumberFrom(url)
  return { label: value, href: number && !isWhatsAppHref(url) ? whatsappUrl(undefined, number) : toHref(url) }
}

function normalizeHome(acf: HomeACF): HomeContent {
  return {
    header: {
      logo: toImage(acf.header_log, "Invest with Kamran"),
      menu: list(acf.header_menus)
        .filter((item) => text(item.menu_name))
        .map((item) => {
          const label = text(item.menu_name)
          return { label, href: toHref(item.menu_url, sectionHref(label)) }
        }),
      cta: toLink(acf.header_button_1, acf.header_button_1_url),
    },
    hero: {
      image: toImage(acf.hero_image, "Portrait of Kamran, Dubai property adviser"),
      roles: list(acf.hero_job_role).map((r) => text(r.job_role_name)).filter(Boolean),
      description: text(acf.hero_description),
      primaryCta: toWhatsAppLink(acf.hero_section_button_1, acf.hero_section_button_1_url),
      secondaryCta: toLink(acf.hero_section_button_2, acf.hero_section_button_2_url),
      marquee: list(acf.hero_scroll_bar).map((r) => text(r.scroll_name)).filter(Boolean),
    },
    stats: list(acf.hero_card_section)
      .map((card) => ({
        value: text(card.card_count),
        title: text(card.card_title),
        caption: text(card.card_sub_title),
      }))
      .filter((card) => card.value),
    about: normalizeAbout(acf),
    services: normalizeServices(acf),
    projectsIntro: {
      title: text(acf.project_title),
      description: stripTags(text(acf.project_description)),
    },
    partners: normalizePartners(acf),
    rewardsTitle: text(acf.reward_title),
    testimonials: normalizeTestimonials(acf),
    footer: {
      logo: toImage(acf.footer_logo, "Invest with Kamran"),
      title: text(acf.footer_title),
      // Empty URLs reuse the matching hero/header buttons
      whatsapp: toWhatsAppLink(acf.footer_button_1, acf.footer_button_1_url, acf.hero_section_button_1_url),
      booking: toLink(acf.footer_button_2, acf.footer_button_2_url, toHref(acf.header_button_1_url)),
      groups: list(acf.footer_links)
        .map((group) => ({
          title: text(group.footer_link_title),
          links: list(group.footer_links)
            .filter((link) => text(link.footer_link_name))
            .map((link) => {
              const label = text(link.footer_link_name)
              return { label, href: toHref(link.footer_link_url, sectionHref(label)) }
            }),
        }))
        .filter((group) => group.links.length),
      year: new Date().getFullYear(),
    },
    contact: {
      image: toImage(acf.contact_image, "Kamran, Dubai property adviser"),
      title: text(acf.contact_title),
      description: stripTags(text(acf.contact_description)),
      socials: list(acf.social_media)
        .map((row) => ({
          name: text(row.social_media_name),
          href: text(row.social_media_link),
          icon: toImage(row.social_media_image, text(row.social_media_name)),
        }))
        .filter((social) => social.name && social.href),
      note: stripTags(text(acf.personal_details)),
    },
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Fetching                                 */
/* -------------------------------------------------------------------------- */

async function wpFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${WORDPRESS_API_URL}${path}`, {
    headers: { Accept: "application/json" },
  })
  if (!res.ok) {
    throw new Error(`WordPress request failed: ${res.status} ${res.statusText} (${path})`)
  }
  return res.json() as Promise<T>
}

async function fetchHomePage(): Promise<HomeContent> {
  "use cache"
  cacheLife("minutes")
  cacheTag("wp:page:home")

  const pages = await wpFetch<WPPage<HomeACF>[]>(
    "/wp/v2/pages?slug=home&_fields=id,slug,title,acf"
  )
  const page = pages[0]
  if (!page || Array.isArray(page.acf)) {
    throw new Error('WordPress page "home" was not found or has no ACF fields')
  }
  return normalizeHome(page.acf)
}

const EMPTY_HOME: HomeContent = {
  header: { logo: null, menu: [], cta: null },
  hero: {
    image: null,
    roles: [],
    description: "",
    primaryCta: null,
    secondaryCta: null,
    marquee: [],
  },
  stats: [],
  about: null,
  services: null,
  projectsIntro: { title: "", description: "" },
  partners: null,
  rewardsTitle: "",
  testimonials: null,
  contact: { image: null, title: "", description: "", socials: [], note: "" },
  footer: { logo: null, title: "", whatsapp: null, booking: null, groups: [], year: 2026 },
}

/**
 * Home page content. Failures are not cached, so the next request retries
 * WordPress while visitors get an empty-but-working page instead of an error.
 */
export async function getHomeContent(): Promise<HomeContent> {
  try {
    return await fetchHomePage()
  } catch (error) {
    console.error("[wordpress] Failed to load home page:", error)
    return EMPTY_HOME
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Projects                                  */
/* -------------------------------------------------------------------------- */

type ProjectACF = {
  project_selection: Maybe<string>
  projects_images: Maybe<FlexibleRow<"projects_image", { project_image_src: Maybe<WPImage> }>[]>
  project_title: Maybe<string>
  project_description: Maybe<string>
  project_cards: Maybe<
    FlexibleRow<"project_card", { project_card_title: string; project_card_details: string }>[]
  >
  project_more_details: Maybe<string>
  location: Maybe<string>
  price: Maybe<string>
}

type WPProject = WPPage<ProjectACF>

const PROJECT_FIELDS = "id,slug,title,acf"

/**
 * Reads free-form WYSIWYG content (often pasted from other sites) into
 * heading-led sections of plain paragraphs and list items. Markup, classes
 * and links from the source are dropped.
 */
function toDetailSections(html: Maybe<string>) {
  const sections: ProjectDetailSection[] = []
  let current: ProjectDetailSection = { heading: "", paragraphs: [], items: [] }
  const flush = () => {
    if (current.paragraphs.length || current.items.length) sections.push(current)
  }

  const blocks = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>|<li[^>]*>([\s\S]*?)<\/li>|<p[^>]*>([\s\S]*?)<\/p>/gi
  for (const [, heading, item, paragraph] of text(html).matchAll(blocks)) {
    if (heading !== undefined) {
      flush()
      current = { heading: stripTags(heading), paragraphs: [], items: [] }
    } else if (item !== undefined) {
      const value = stripTags(item)
      if (value) current.items.push(value)
    } else if (paragraph !== undefined) {
      current.paragraphs.push(...toParagraphs(paragraph))
    }
  }
  flush()
  return sections
}

function normalizeProject(post: WPProject): Project | null {
  if (Array.isArray(post.acf)) return null
  const acf = post.acf
  const title = text(acf.project_title) || decodeEntities(stripTags(post.title.rendered))
  if (!title) return null

  // The same upload is sometimes added twice; show it once
  const seen = new Set<string>()
  const images = list(acf.projects_images)
    .map((row, i) => toImage(row.project_image_src, `${title} — image ${i + 1}`))
    .filter((image): image is CmsImage => {
      if (!image || seen.has(image.src)) return false
      seen.add(image.src)
      return true
    })

  const overview = toParagraphs(acf.project_description)
  const details = toDetailSections(acf.project_more_details).map((section) => ({
    ...section,
    // Skip paragraphs that repeat the overview word for word
    paragraphs: section.paragraphs.filter((p) => !overview.includes(p)),
  }))

  return {
    id: post.id,
    slug: post.slug,
    title,
    category: text(acf.project_selection),
    location: text(acf.location),
    price: text(acf.price),
    images,
    facts: list(acf.project_cards)
      .map((card) => ({ label: text(card.project_card_title), value: text(card.project_card_details) }))
      .filter((fact) => fact.label && fact.value),
    summary: overview[0] ?? "",
    overview,
    details: details.filter((section) => section.paragraphs.length || section.items.length),
  }
}

async function fetchProjects(): Promise<Project[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag("wp:projects")

  const posts = await wpFetch<WPProject[]>(`/wp/v2/project?per_page=100&_fields=${PROJECT_FIELDS}`)
  return posts.map(normalizeProject).filter((project): project is Project => project !== null)
}

async function fetchProject(slug: string): Promise<Project | null> {
  "use cache"
  cacheLife("minutes")
  cacheTag("wp:projects", `wp:project:${slug}`)

  const posts = await wpFetch<WPProject[]>(
    `/wp/v2/project?slug=${encodeURIComponent(slug)}&_fields=${PROJECT_FIELDS}`
  )
  return posts[0] ? normalizeProject(posts[0]) : null
}

/** All published projects, newest first. Empty when WordPress is unreachable. */
export async function getProjects(): Promise<Project[]> {
  try {
    return await fetchProjects()
  } catch (error) {
    console.error("[wordpress] Failed to load projects:", error)
    return []
  }
}

/** Card-sized project data, without the long detail content. */
export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  const projects = await getProjects()
  return projects.map(({ id, slug, title, category, location, price, images, facts, summary }) => ({
    id,
    slug,
    title,
    category,
    location,
    price,
    images,
    facts,
    summary,
  }))
}

export async function getProject(slug: string): Promise<Project | null> {
  try {
    return await fetchProject(slug)
  } catch (error) {
    console.error(`[wordpress] Failed to load project "${slug}":`, error)
    return null
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Rewards                                  */
/* -------------------------------------------------------------------------- */

type RewardACF = {
  reward_image: Maybe<WPImage>
  // ACF gallery (array of images) or a repeater whose rows hold an image
  reward_gallery: Maybe<(WPImage | Record<string, unknown>)[]>
  reward_title: Maybe<string>
  reward_short_description: Maybe<string>
  reward_description: Maybe<string>
}

export type Reward = {
  id: number
  slug: string
  title: string
  /** "Award" for trophies and certificates, otherwise "Memorabilia". */
  kind: "Award" | "Memorabilia"
  /** A four-digit year found in the title, e.g. "(2025)". */
  year: string
  image: CmsImage | null
  gallery: CmsImage[]
  summary: string
  description: string[]
}

const isImageLike = (value: unknown): value is WPImage =>
  typeof value === "object" && value !== null && typeof (value as WPImage).url === "string"

function normalizeReward(post: WPPage<RewardACF>): Reward | null {
  if (Array.isArray(post.acf)) return null
  const acf = post.acf
  const title = text(acf.reward_title) || decodeEntities(stripTags(post.title.rendered))
  if (!title) return null

  const image = toImage(acf.reward_image, title)
  const seen = new Set(image ? [image.src] : [])
  const gallery = list(acf.reward_gallery)
    .map((entry) => (isImageLike(entry) ? entry : Object.values(entry).find(isImageLike)))
    .map((entry, i) => toImage(entry, `${title} — photo ${i + 2}`))
    .filter((photo): photo is CmsImage => {
      if (!photo || seen.has(photo.src)) return false
      seen.add(photo.src)
      return true
    })

  return {
    id: post.id,
    slug: post.slug,
    title,
    kind: /award|certificate|trophy/i.test(title) ? "Award" : "Memorabilia",
    year: title.match(/\b(?:19|20)\d{2}\b/)?.[0] ?? "",
    image,
    gallery,
    summary: stripTags(text(acf.reward_short_description)),
    description: toParagraphs(acf.reward_description),
  }
}

async function fetchRewards(): Promise<Reward[]> {
  "use cache"
  cacheLife("minutes")
  cacheTag("wp:rewards")

  const posts = await wpFetch<WPPage<RewardACF>[]>("/wp/v2/reward?per_page=100&_fields=id,slug,title,acf")
  return posts.map(normalizeReward).filter((reward): reward is Reward => reward !== null)
}

/** All published rewards, newest first. Empty when WordPress is unreachable. */
export async function getRewards(): Promise<Reward[]> {
  try {
    return await fetchRewards()
  } catch (error) {
    console.error("[wordpress] Failed to load rewards:", error)
    return []
  }
}
