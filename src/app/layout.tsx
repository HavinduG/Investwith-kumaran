import { Suspense } from "react"
import type { Metadata, Viewport } from "next"
import { Fraunces, Geist, Geist_Mono } from "next/font/google"

import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { SmoothScroll } from "@/components/providers/smooth-scroll"
import { InlineScript } from "@/components/theme/inline-script"
import { ThemeProvider } from "@/components/theme/theme-provider"
import { themeScript } from "@/components/theme/theme-script"
import { siteConfig } from "@/lib/site"
import { getHomeContent } from "@/lib/wordpress"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} | Dubai Property Adviser`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "Dubai real estate",
    "Dubai property adviser",
    "off-plan Dubai",
    "property investment Dubai",
    "Metroplex Properties",
    "Kamran",
  ],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a1613" },
    { media: "(prefers-color-scheme: light)", color: "#f7f3ea" },
  ],
  colorScheme: "dark light",
}

/** Header with its CMS menu. Loaded inside Suspense so the root layout never blocks on WordPress. */
async function CmsHeader() {
  const { header } = await getHomeContent()
  return <SiteHeader content={header} />
}

/** Footer with its CMS links; streamed in the same way as the header. */
async function CmsFooter() {
  const { footer, contact } = await getHomeContent()
  return <SiteFooter footer={footer} socials={contact.socials} note={contact.note} />
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <head>
        <InlineScript html={themeScript} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <SmoothScroll>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-200 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-gold-foreground"
            >
              Skip to content
            </a>
            <Suspense fallback={<SiteHeader content={{ logo: null, menu: [], cta: null }} />}>
              <CmsHeader />
            </Suspense>
            <main id="main" className="flex-1">
              {children}
            </main>
            <Suspense fallback={null}>
              <CmsFooter />
            </Suspense>
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  )
}
