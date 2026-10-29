import type { MetadataRoute } from "next"

import { PROPERTIES_PAGE, projectHref } from "@/lib/routes"
import { siteConfig } from "@/lib/site"
import { getProjectSummaries } from "@/lib/wordpress"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjectSummaries()
  return [
    { url: siteConfig.url, changeFrequency: "weekly", priority: 1 },
    { url: `${siteConfig.url}${PROPERTIES_PAGE}`, changeFrequency: "weekly", priority: 0.9 },
    ...projects.map((project) => ({
      url: `${siteConfig.url}${projectHref(project.slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]
}
