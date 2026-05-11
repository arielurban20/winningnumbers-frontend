import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"
const siteName = "Winning Numbers"

function normalizeForCompare(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function titleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((token) => {
      if (/^\d+$/.test(token)) return token
      if (token.length <= 2) return token.toUpperCase()
      return token.charAt(0).toUpperCase() + token.slice(1)
    })
    .join(" ")
}

function buildMetadataGameName(gameName: string, familySlug: string): string {
  const normalizedGameName = normalizeForCompare(gameName)
  const slugTitle = titleCaseFromSlug(familySlug)
  const normalizedSlugTitle = normalizeForCompare(slugTitle)

  // If the slug is clearly more specific than the game name (e.g. "cash-pop-after-hours"
  // vs "Cash Pop"), prefer the slug title so metadata remains unique by route.
  if (
    normalizedSlugTitle !== normalizedGameName &&
    normalizedSlugTitle.startsWith(`${normalizedGameName} `)
  ) {
    return slugTitle
  }

  return gameName
}

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
  const metadataGameName = buildMetadataGameName(gameName, familySlug)
  const url = getCanonicalUrl(`/states/${stateSlug}/${familySlug}`)
  const title = `${metadataGameName} ${stateName} Results Today | Past Draws`
  const description = `View the latest ${metadataGameName} winning numbers for ${stateName}. Check past draws, number frequency stats, and historical results.`

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
  const metadataGameName = buildMetadataGameName(gameName, familySlug)
  const url = getCanonicalUrl(`/states/${stateSlug}/${familySlug}/stats`)
  const title = `${metadataGameName} Number Frequency | ${stateName} Lottery Stats`
  const description = `Analyze ${metadataGameName} number frequency statistics for ${stateName}. View most and least frequently drawn numbers over the past year.`

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
  const metadataGameName = buildMetadataGameName(gameName, familySlug)
  const url = getCanonicalUrl(`/states/${stateSlug}/${familySlug}/historical`)
  const title = `${metadataGameName} Historical Results | ${stateName} Lottery`
  const description = `Search historical ${metadataGameName} results for ${stateName}. Filter by date range and export results to CSV.`

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
