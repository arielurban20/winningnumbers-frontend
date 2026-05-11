import type { Metadata } from "next"
import { JsonLd } from "@/components/seo"
import { generateHistoricalMetadata, getCanonicalUrl } from "@/lib/seo/metadata"
import { generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/seo/jsonLd"

interface HistoricalLayoutProps {
  children: React.ReactNode
  params: Promise<{ stateSlug: string; gameFamilySlug: string }>
}

function formatSlugName(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word.length <= 2 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ")
}

function stateAbbrFromSlug(stateSlug: string): string {
  const normalized = stateSlug.trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(normalized)) return normalized
  return stateSlug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 3) || normalized
}

export async function generateMetadata({
  params,
}: HistoricalLayoutProps): Promise<Metadata> {
  const { stateSlug, gameFamilySlug } = await params
  const stateName = formatSlugName(stateSlug)
  const gameName = formatSlugName(gameFamilySlug)
  return generateHistoricalMetadata(gameName, stateName, stateSlug, gameFamilySlug)
}

export default async function HistoricalLayout({
  children,
  params,
}: HistoricalLayoutProps) {
  const { stateSlug, gameFamilySlug } = await params
  const stateName = formatSlugName(stateSlug)
  const gameName = formatSlugName(gameFamilySlug)
  const stateAbbr = stateAbbrFromSlug(stateSlug)
  const pageTitle = `${stateAbbr} ${gameName} Past Results | Winning Numbers`
  const pageDescription = `Search historical ${gameName} results for ${stateName}. Filter by date range and export results to CSV.`
  const canonicalUrl = getCanonicalUrl(`/states/${stateSlug}/${gameFamilySlug}/historical`)

  const webPageSchema = generateWebPageSchema(pageTitle, pageDescription, canonicalUrl)
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: getCanonicalUrl("/") },
    { name: "States", url: getCanonicalUrl("/states") },
    { name: stateName, url: getCanonicalUrl(`/states/${stateSlug}`) },
    { name: gameName, url: getCanonicalUrl(`/states/${stateSlug}/${gameFamilySlug}`) },
    { name: "Historical", url: canonicalUrl },
  ])

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${stateAbbr} ${gameName} Historical Lottery Results`,
    description: `Historical drawing results for ${gameName} in ${stateName}. Includes searchable date ranges and downloadable result views.`,
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: "Winning Numbers",
      url: getCanonicalUrl("/"),
    },
    publisher: {
      "@type": "Organization",
      name: "Winning Numbers",
      url: getCanonicalUrl("/"),
    },
    about: {
      "@type": "Thing",
      name: `${gameName} (${stateName} Lottery)`,
    },
  }

  return (
    <>
      <JsonLd data={[webPageSchema, breadcrumbSchema, datasetSchema]} />
      {children}
    </>
  )
}
