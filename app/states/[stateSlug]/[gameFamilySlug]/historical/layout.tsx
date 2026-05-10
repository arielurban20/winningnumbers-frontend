import type { Metadata } from "next"
import { getCanonicalUrl } from "@/lib/seo/metadata"

interface HistoricalLayoutProps {
  children: React.ReactNode
  params: Promise<{ stateSlug: string; gameFamilySlug: string }>
}

export async function generateMetadata({
  params,
}: HistoricalLayoutProps): Promise<Metadata> {
  const { stateSlug, gameFamilySlug } = await params
  
  // Format slugs to readable names
  const stateName = stateSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  
  const gameName = gameFamilySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
  
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

export default function HistoricalLayout({
  children,
}: HistoricalLayoutProps) {
  return <>{children}</>
}
