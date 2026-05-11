import type { Metadata } from "next"
import { JsonLd } from "@/components/seo"
import { getCanonicalUrl } from "@/lib/seo/metadata"
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

export async function generateMetadata({
  params,
}: HistoricalLayoutProps): Promise<Metadata> {
  const { stateSlug, gameFamilySlug } = await params
  
  // Format slugs to readable names
  const stateName = formatSlugName(stateSlug)
  
  const gameName = formatSlugName(gameFamilySlug)
  
  const canonicalUrl = getCanonicalUrl(`/states/${stateSlug}/${gameFamilySlug}/historical`)
  
  return {
    title: `${gameName} Historical Results | ${stateName} Lottery`,
    description: `Search historical ${gameName} results for ${stateName}. Filter by date range and export results to CSV.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${gameName} Historical Results | ${stateName} Lottery`,
      description: `Search historical ${gameName} lottery results for ${stateName}.`,
      url: canonicalUrl,
      type: "website",
    },
  }
}

export default async function HistoricalLayout({
  children,
  params,
}: HistoricalLayoutProps) {
  const { stateSlug, gameFamilySlug } = await params
  const stateName = formatSlugName(stateSlug)
  const gameName = formatSlugName(gameFamilySlug)
  const pageTitle = `${gameName} Historical Results | ${stateName} Lottery`
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
    name: `${gameName} Historical Lottery Results (${stateName})`,
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
