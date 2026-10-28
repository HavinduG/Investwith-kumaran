import type { Metadata } from "next"

import { AboutSection } from "@/components/home/about/about-section"
import { ContactSection } from "@/components/home/contact/contact-section"
import { HeroSection } from "@/components/home/hero/hero-section"
import { PartnersSection } from "@/components/home/partners/partners-section"
import { ProjectsSection } from "@/components/home/projects/projects-section"
import { RewardsSection } from "@/components/home/rewards/rewards-section"
import { ServicesSection } from "@/components/home/services/services-section"
import { StatsSection } from "@/components/home/stats/stats-section"
import { TestimonialsSection } from "@/components/home/testimonials/testimonials-section"
import { SectionBreak } from "@/components/layout/section-break"
import { siteConfig } from "@/lib/site"
import { getHomeContent, getProjectSummaries, getRewards } from "@/lib/wordpress"

export async function generateMetadata(): Promise<Metadata> {
  const { hero } = await getHomeContent()
  const description = hero.description || siteConfig.description
  const images = hero.image
    ? [{ url: hero.image.src, width: hero.image.width, height: hero.image.height, alt: hero.image.alt }]
    : undefined

  return {
    title: { absolute: `${siteConfig.name} | Dubai Property Adviser` },
    description,
    alternates: { canonical: "/" },
    openGraph: { description, images, url: "/" },
    twitter: { description, images },
  }
}

export default async function HomePage() {
  const [
    { header, hero, stats, about, services, projectsIntro, partners, rewardsTitle, testimonials, contact },
    projects,
    rewards,
  ] =
    await Promise.all([getHomeContent(), getProjectSummaries(), getRewards()])

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        url: siteConfig.url,
        name: siteConfig.name,
      },
      {
        "@type": "Person",
        "@id": `${siteConfig.url}/#kamran`,
        name: "Kamran",
        url: siteConfig.url,
        image: hero.image?.src,
        description: hero.description || siteConfig.description,
        jobTitle: hero.roles[0],
        knowsAbout: hero.marquee,
        worksFor: { "@type": "RealEstateAgent", name: "Metroplex Properties" },
        areaServed: { "@type": "City", name: "Dubai" },
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <HeroSection hero={hero} bookingCta={header.cta} />
      <StatsSection stats={stats} />
      {about && (
        <>
          <SectionBreak />
          <AboutSection
            about={about}
            role={hero.roles.find((role) => /advis/i.test(role)) ?? hero.roles[0]}
            primaryCta={header.cta}
            whatsappCta={hero.primaryCta}
          />
        </>
      )}
      {services && (
        <>
          <SectionBreak />
          <ServicesSection services={services} enquiryHref={(header.cta ?? hero.primaryCta)?.href} />
        </>
      )}
      {projects.length > 0 && (
        <>
          <SectionBreak />
          <ProjectsSection
            title={projectsIntro.title}
            description={projectsIntro.description}
            projects={projects}
            cta={hero.secondaryCta ?? header.cta}
            whatsappCta={hero.primaryCta}
          />
        </>
      )}
      {partners && (
        <>
          <SectionBreak />
          <PartnersSection partners={partners} />
        </>
      )}
      {rewards.length > 0 && (
        <>
          <SectionBreak />
          <RewardsSection title={rewardsTitle} rewards={rewards} />
        </>
      )}
      {testimonials && (
        <>
          <SectionBreak />
          <TestimonialsSection testimonials={testimonials} />
        </>
      )}
      <SectionBreak />
      <ContactSection
        contact={contact}
        services={services?.items.map((item) => item.title) ?? []}
        whatsappCta={hero.primaryCta}
        bookingCta={header.cta}
      />
    </>
  )
}
