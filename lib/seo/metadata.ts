import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"
const siteName = "Winning Numbers"

export function getCanonicalUrl(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`
  return `${siteUrl}${cleanPath}`
}

export function generateHomeMetadata(): Metadata {
  return {
    title: "Winning Numbers | Latest Lottery Results Today",
    description:
      "Get the latest lottery results including Powerball, Mega Millions, and state lotteries. View winning numbers, jackpots, and past draws.",
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title: "Winning Numbers | Latest Lottery Results Today",
      description:
        "Get the latest lottery results including Powerball, Mega Millions, and state lotteries.",
      url: siteUrl,
      siteName,
      type: "website",
    },
  }
}

export function generateStatesMetadata(): Metadata {
  const url = getCanonicalUrl("/states")
  return {
    title: "Lottery Results by State | US Winning Numbers",
    description:
      "Browse lottery results by state. Find winning numbers for your state lottery including Pick 3, Pick 4, Cash 5, and more.",
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: "Lottery Results by State | US Winning Numbers",
      description: "Browse lottery results by state.",
      url,
      siteName,
      type: "website",
    },
  }
}

export function generateStateMetadata(
  stateName: string,
  stateSlug: string
): Metadata {
  const url = getCanonicalUrl(`/states/${stateSlug}`)
  const title = `${stateName} Lottery Results Today | Winning Numbers`
  const description = `Get the latest ${stateName} lottery results. View winning numbers for all ${stateName} lottery games including Pick 3, Pick 4, and more.`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
    },
  }
}

export function generateGameFamilyMetadata(
  gameName: string,
  stateName: string,
  stateSlug: string,
  familySlug: string
): Metadata {
  const url = getCanonicalUrl(`/states/${stateSlug}/${familySlug}`)
  const title = `${gameName} ${stateName} Results Today | Past Draws`
  const description = `View the latest ${gameName} winning numbers for ${stateName}. Check past draws, number frequency stats, and historical results.`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
    },
  }
}

export function generateStatsMetadata(
  gameName: string,
  stateName: string,
  stateSlug: string,
  familySlug: string
): Metadata {
  const url = getCanonicalUrl(`/states/${stateSlug}/${familySlug}/stats`)
  const title = `${gameName} Number Frequency | ${stateName} Lottery Stats`
  const description = `Analyze ${gameName} number frequency statistics for ${stateName}. View most and least frequently drawn numbers over the past year.`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
    },
  }
}

export function generateHistoricalMetadata(
  gameName: string,
  stateName: string,
  stateSlug: string,
  familySlug: string
): Metadata {
  const url = getCanonicalUrl(`/states/${stateSlug}/${familySlug}/historical`)
  const title = `${gameName} Historical Results | ${stateName} Lottery`
  const description = `Search historical ${gameName} results for ${stateName}. Filter by date range and export results to CSV.`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
    },
  }
}

export function generateNationalGameMetadata(
  gameName: string,
  gameSlug: string
): Metadata {
  const url = getCanonicalUrl(`/games/${gameSlug}`)
  const title = `${gameName} Results Today | Latest Winning Numbers & Jackpot`
  const description = `Get the latest ${gameName} winning numbers and jackpot information. View past draws and next drawing dates.`

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
    },
  }
}
