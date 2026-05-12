import Link from "next/link"
import type { Metadata } from "next"
import { Breadcrumbs, Container } from "@/components/layout"
import { JsonLd } from "@/components/seo"
import { JackpotHistoryTable } from "@/components/tables"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { getJackpotHistory } from "@/lib/data/jackpotHistory"
import { generateBreadcrumbSchema, generateItemListSchema, generateWebPageSchema } from "@/lib/seo/jsonLd"
import { ArrowRight, ExternalLink } from "lucide-react"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

const pagePath = "/games/powerball/jackpot-history"
const pageUrl = `${siteUrl}${pagePath}`
const historyData = getJackpotHistory("powerball")

export const metadata: Metadata = {
  title: "Top 10 Powerball Jackpots | Jackpot History",
  description:
    "Explore the Top 10 Powerball jackpots with draw dates and winning states, based on official Powerball records.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Top 10 Powerball Jackpots | Jackpot History",
    description:
      "Official Powerball jackpot history with the largest prizes, draw dates, and winning states.",
    url: pageUrl,
    type: "website",
  },
}

export const revalidate = 3600

export default function PowerballJackpotHistoryPage() {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Powerball", href: "/games/powerball" },
    { label: "Jackpot History" },
  ]

  const breadcrumbJsonLd = generateBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Powerball", url: `${siteUrl}/games/powerball` },
    { name: "Jackpot History", url: pageUrl },
  ])

  const webpageJsonLd = generateWebPageSchema(
    "Top 10 Powerball Jackpots",
    "Official Powerball jackpot history featuring the largest jackpots with dates and winning states.",
    pageUrl
  )

  const listJsonLd = generateItemListSchema(
    "Top 10 Powerball Jackpots",
    historyData.entries.map((entry) => ({
      name: `${entry.rank}. ${entry.prize} (${entry.date})`,
      url: pageUrl,
    }))
  )

  const datasetJsonLd = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Powerball Jackpot History Dataset",
    description:
      "Curated Top 10 Powerball jackpots from official Powerball published jackpot history.",
    url: pageUrl,
    isBasedOn: historyData.sourceUrl,
    creator: {
      "@type": "Organization",
      name: "Powerball",
    },
    publisher: {
      "@type": "Organization",
      name: "Winning Numbers",
      url: siteUrl,
    },
    dateModified: historyData.updatedAt,
  }

  return (
    <>
      <JsonLd data={[webpageJsonLd, breadcrumbJsonLd, listJsonLd, datasetJsonLd]} />

      <Container className="py-8 sm:py-10">
        <Breadcrumbs items={breadcrumbItems} />

        <section className="mb-6 mt-3 sm:mb-8 sm:mt-4">
          <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">Top 10 Powerball Jackpots</h1>
          <p className="mt-3 max-w-3xl text-sm text-muted-foreground sm:text-base">
            {historyData.intro}
          </p>
        </section>

        <section className="mb-6 sm:mb-8">
          <JackpotHistoryTable entries={historyData.entries} />
        </section>

        <Card className="mb-6 border-border/60 bg-card/70 sm:mb-8">
          <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">
              Source: {historyData.sourceLabel}. Data is curated in a static frontend dataset for SEO-safe rendering.
            </p>
            <a
              href={historyData.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View official source
              <ExternalLink className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>

        <section className="flex flex-wrap gap-2.5">
          <Button asChild>
            <Link href="/games/powerball">
              Back to Powerball Results
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/games/mega-millions/jackpot-history">View Mega Millions Jackpot History</Link>
          </Button>
        </section>
      </Container>
    </>
  )
}

