/**
 * Lottery Logo Resolver
 * 
 * Resolves logos from the external logo server
 * NEXT_PUBLIC_LOGO_BASE_URL=https://winningnumbers.us/assets/logos
 */

import type { LogoResolverOptions, ResolvedLogo } from "@/types/logos"
import {
  normalizeSlug,
  getGameInitials,
  getFallbackBgColor,
  getCanonicalMultiStateSlug,
} from "./logoRegistry"

// Logo server base URL
const LOGO_BASE_URL = process.env.NEXT_PUBLIC_LOGO_BASE_URL || "https://winningnumbers.us/assets/logos"

const SESSION_SUFFIXES = [
  "morning-buzz",
  "lunch-break",
  "prime-time",
  "night-owl",
  "early-bird",
  "coffee-break",
  "rush-hour",
  "drive-time",
  "late-night",
  "clock-out",
  "session-1",
  "session-2",
  "drawing-1",
  "drawing-2",
  "daytime",
  "afternoon",
  "midnight",
  "primetime",
  "evening",
  "morning",
  "mid-day",
  "midday",
  "matinee",
  "brunch",
  "lunch",
  "night",
  "noche",
  "nite",
  "noon",
  "day",
  "dia",
  "eve",
  "mid",
  "1pm",
  "2pm",
  "3pm",
  "4pm",
  "5pm",
  "6pm",
  "7pm",
  "8pm",
  "9pm",
  "10pm",
  "11pm",
  "12pm",
  "12am",
].sort((a, b) => b.length - a.length)

/**
 * Build logo URL from the external server
 */
function buildLogoUrl(stateSlug: string, gameSlug: string, format: "svg" | "png" = "svg"): string {
  // Pattern: {state}-{game}.svg (e.g., ca-powerball.svg)
  return `${LOGO_BASE_URL}/${stateSlug}-${gameSlug}.${format}`
}

/**
 * Build generic (non-state) logo URL
 */
function buildGenericLogoUrl(gameSlug: string, format: "svg" | "png" = "svg"): string {
  return `${LOGO_BASE_URL}/${gameSlug}.${format}`
}

function stripStateSuffix(slug: string): string {
  return normalizeSlug(slug).replace(/-[a-z]{2}$/i, "")
}

function deriveFamilySlug(rawSlug: string): string {
  let slug = stripStateSuffix(rawSlug)
  for (const suffix of SESSION_SUFFIXES) {
    const marker = `-${suffix}`
    if (slug.endsWith(marker)) {
      slug = slug.slice(0, -marker.length)
      break
    }
  }

  if (slug.startsWith("cash-pop-")) return "cash-pop"
  const pegaMatch = slug.match(/^(pega-[234])-/)
  if (pegaMatch) return pegaMatch[1]
  if (slug.startsWith("numbers-game-")) return "numbers-game"
  return slug
}

/**
 * Resolve the best logo for a game
 * Uses external logo server at NEXT_PUBLIC_LOGO_BASE_URL
 */
export function resolveLotteryLogo(options: LogoResolverOptions): ResolvedLogo {
  const {
    gameName = "",
    gameSlug = "",
    stateSlug,
    stateName,
    logoUrl,
    fallbackToInitials = true,
  } = options

  // 1. If API provides a logo URL, use it (highest priority)
  if (logoUrl && logoUrl.trim()) {
    return {
      src: logoUrl,
      alt: `${gameName} lottery logo`,
      isFallback: false,
    }
  }

  const normalizedGameSlug = normalizeSlug(gameSlug || gameName)
  const familySlug = deriveFamilySlug(normalizedGameSlug)
  
  // 2. Build state-specific logo URL
  if (stateSlug) {
    // Session variants inherit family logos when possible.
    const stateLogoUrl = buildLogoUrl(
      stateSlug.toLowerCase(),
      familySlug || normalizedGameSlug
    )
    return {
      src: stateLogoUrl,
      alt: `${gameName} ${stateName || stateSlug.toUpperCase()} lottery logo`,
      isFallback: false,
      // Provide fallback info in case the logo doesn't load
      initials: getGameInitials(gameName || gameSlug),
      fallbackBgColor: getFallbackBgColor(gameName || gameSlug),
    }
  }

  // 3. For multi-state games, try canonical slug
  const canonicalSlug = getCanonicalMultiStateSlug(normalizedGameSlug)
  if (canonicalSlug) {
    const multiStateLogoUrl = buildGenericLogoUrl(canonicalSlug)
    return {
      src: multiStateLogoUrl,
      alt: `${gameName} lottery logo`,
      isFallback: false,
      initials: getGameInitials(gameName || gameSlug),
      fallbackBgColor: getFallbackBgColor(gameName || gameSlug),
    }
  }

  // 4. Try generic game logo
  const genericLogoUrl = buildGenericLogoUrl(familySlug || normalizedGameSlug)
  return {
    src: genericLogoUrl,
    alt: `${gameName} lottery logo`,
    isFallback: false,
    initials: getGameInitials(gameName || gameSlug),
    fallbackBgColor: getFallbackBgColor(gameName || gameSlug),
  }
}

/**
 * Get direct logo URL for a state/game combination
 */
export function getLogoUrl(stateSlug: string, gameSlug: string): string {
  return buildLogoUrl(stateSlug.toLowerCase(), normalizeSlug(gameSlug))
}

/**
 * Get generic logo URL (for multi-state games)
 */
export function getGenericLogoUrl(gameSlug: string): string {
  return buildGenericLogoUrl(normalizeSlug(gameSlug))
}
