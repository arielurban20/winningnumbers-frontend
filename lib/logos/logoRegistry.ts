/**
 * Lottery Logo Registry
 * 
 * This registry maps game slugs and names to their logo files.
 * Logos are stored in /public/logos/lotteries/
 * 
 * Naming convention: {state}-{game}.svg
 * Examples: ca-powerball.svg, fl-megamillions.svg, ga-cash3.svg
 */

import type { LogoEntry } from "@/types/logos"

/**
 * Multi-state/National game logos
 * These are canonical logos used when no state-specific version exists
 */
export const MULTI_STATE_LOGOS: Record<string, LogoEntry> = {
  powerball: {
    path: "/logos/lotteries/powerball.svg",
    gameSlug: "powerball",
    aliases: ["powerball-double-play", "powerball-dp", "pb"],
    isMultiState: true,
    format: "svg",
    variant: "wordmark",
    scale: 1.35,
  },
  "mega-millions": {
    path: "/logos/lotteries/mega-millions.svg",
    gameSlug: "mega-millions",
    aliases: ["megamillions", "mega_millions", "mm"],
    isMultiState: true,
    format: "svg",
    variant: "wordmark",
    scale: 1.25,
  },
  "lucky-for-life": {
    path: "/logos/lotteries/lucky-for-life.svg",
    gameSlug: "lucky-for-life",
    aliases: ["luckyforlife", "lucky4life", "lfl"],
    isMultiState: true,
    format: "svg",
    variant: "wordmark",
    scale: 1.2,
  },
  "cash4life": {
    path: "/logos/lotteries/cash4life.svg",
    gameSlug: "cash4life",
    aliases: ["cash-4-life", "cash-for-life", "c4l"],
    isMultiState: true,
    format: "svg",
    variant: "wordmark",
    scale: 1.15,
  },
  "lotto-america": {
    path: "/logos/lotteries/lotto-america.svg",
    gameSlug: "lotto-america",
    aliases: ["lottoamerica", "la"],
    isMultiState: true,
    format: "svg",
    variant: "wordmark",
    scale: 1.1,
  },
  "2by2": {
    path: "/logos/lotteries/2by2.svg",
    gameSlug: "2by2",
    aliases: ["two-by-two", "2x2"],
    isMultiState: true,
    format: "svg",
    variant: "wordmark",
  },
  "tri-state-megabucks": {
    path: "/logos/lotteries/tri-state-megabucks.svg",
    gameSlug: "tri-state-megabucks",
    aliases: ["megabucks", "tristate-megabucks"],
    isMultiState: true,
    format: "svg",
    variant: "wordmark",
    scale: 1.1,
  },
  "gimme-5": {
    path: "/logos/lotteries/gimme-5.svg",
    gameSlug: "gimme-5",
    aliases: ["gimme5"],
    isMultiState: true,
    format: "svg",
    variant: "wordmark",
  },
}

/**
 * Common game type patterns that appear across states
 * Maps normalized game types to their common names
 */
export const GAME_TYPE_PATTERNS: Record<string, string[]> = {
  "pick-3": ["pick3", "pick-3", "daily-3", "daily3", "cash-3", "cash3", "play-3", "play3", "dc-3", "dc3"],
  "pick-4": ["pick4", "pick-4", "daily-4", "daily4", "cash-4", "cash4", "play-4", "play4", "dc-4", "dc4"],
  "pick-5": ["pick5", "pick-5", "daily-5", "daily5", "cash-5", "cash5", "play-5", "play5", "dc-5", "dc5"],
  "fantasy-5": ["fantasy5", "fantasy-5", "fab5", "fab-5"],
  "cash-pop": ["cashpop", "cash-pop"],
  lotto: ["lotto", "classic-lotto"],
}

/**
 * State abbreviation to full name mapping
 */
export const STATE_ABBREVIATIONS: Record<string, string> = {
  al: "alabama",
  ak: "alaska",
  az: "arizona",
  ar: "arkansas",
  ca: "california",
  co: "colorado",
  ct: "connecticut",
  de: "delaware",
  dc: "district-of-columbia",
  fl: "florida",
  ga: "georgia",
  hi: "hawaii",
  id: "idaho",
  il: "illinois",
  in: "indiana",
  ia: "iowa",
  ks: "kansas",
  ky: "kentucky",
  la: "louisiana",
  me: "maine",
  md: "maryland",
  ma: "massachusetts",
  mi: "michigan",
  mn: "minnesota",
  ms: "mississippi",
  mo: "missouri",
  mt: "montana",
  ne: "nebraska",
  nv: "nevada",
  nh: "new-hampshire",
  nj: "new-jersey",
  nm: "new-mexico",
  ny: "new-york",
  nc: "north-carolina",
  nd: "north-dakota",
  oh: "ohio",
  ok: "oklahoma",
  or: "oregon",
  pa: "pennsylvania",
  pr: "puerto-rico",
  ri: "rhode-island",
  sc: "south-carolina",
  sd: "south-dakota",
  tn: "tennessee",
  tx: "texas",
  ut: "utah",
  vt: "vermont",
  va: "virginia",
  vi: "us-virgin-islands",
  wa: "washington",
  wv: "west-virginia",
  wi: "wisconsin",
  wy: "wyoming",
}

/**
 * Generate a list of possible logo filenames for a given game and state
 */
export function generatePossibleLogoPaths(
  gameSlug: string,
  stateSlug?: string
): string[] {
  const paths: string[] = []
  const normalizedGame = normalizeSlug(gameSlug)
  const baseDir = "/logos/lotteries"
  
  // If state-specific, try state-prefixed versions first
  if (stateSlug) {
    const normalizedState = normalizeSlug(stateSlug)
    // Try exact state-game combination
    paths.push(`${baseDir}/${normalizedState}-${normalizedGame}.svg`)
    paths.push(`${baseDir}/${normalizedState}-${normalizedGame}.png`)
    paths.push(`${baseDir}/${normalizedState}-${normalizedGame}.webp`)
    
    // Try without hyphens
    const gameNoHyphens = normalizedGame.replace(/-/g, "")
    paths.push(`${baseDir}/${normalizedState}-${gameNoHyphens}.svg`)
    
    // Try with -1 suffix (for duplicates)
    paths.push(`${baseDir}/${normalizedState}-${normalizedGame}-1.svg`)
    paths.push(`${baseDir}/${normalizedState}-${gameNoHyphens}-1.svg`)
  }
  
  // Try canonical/national game logo
  paths.push(`${baseDir}/${normalizedGame}.svg`)
  paths.push(`${baseDir}/${normalizedGame}.png`)
  
  return paths
}

/**
 * Normalize a slug for matching
 */
export function normalizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Extract initials from a game name for fallback display
 */
export function getGameInitials(gameName: string): string {
  const words = gameName.split(/[\s-_]+/).filter(Boolean)
  
  if (words.length === 1) {
    // Single word: use first 2 characters
    return words[0].substring(0, 2).toUpperCase()
  }
  
  // Multiple words: use first letter of each (max 3)
  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}

/**
 * Generate a consistent background color based on game name
 * Returns a tailwind-compatible color class
 */
export function getFallbackBgColor(gameName: string): string {
  const colors = [
    "bg-blue-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-violet-600",
    "bg-cyan-600",
    "bg-orange-600",
    "bg-indigo-600",
  ]
  
  // Generate a consistent hash from the game name
  let hash = 0
  for (let i = 0; i < gameName.length; i++) {
    hash = ((hash << 5) - hash + gameName.charCodeAt(i)) | 0
  }
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Check if a game slug matches a multi-state game
 */
export function isMultiStateGame(gameSlug: string): boolean {
  const normalized = normalizeSlug(gameSlug)
  
  // Direct match
  if (MULTI_STATE_LOGOS[normalized]) return true
  
  // Check aliases
  for (const [, entry] of Object.entries(MULTI_STATE_LOGOS)) {
    if (entry.aliases?.some((alias) => normalized.includes(normalizeSlug(alias)))) {
      return true
    }
  }
  
  // Check if the slug contains a multi-state game name
  const multiStateNames = ["powerball", "mega-millions", "megamillions", "lucky-for-life", "cash4life", "lotto-america", "2by2"]
  return multiStateNames.some((name) => normalized.includes(normalizeSlug(name)))
}

/**
 * Get the canonical multi-state game slug
 */
export function getCanonicalMultiStateSlug(gameSlug: string): string | null {
  const normalized = normalizeSlug(gameSlug)
  
  // Direct match
  if (MULTI_STATE_LOGOS[normalized]) return normalized
  
  // Check for powerball variants
  if (normalized.includes("powerball")) return "powerball"
  
  // Check for mega millions variants
  if (normalized.includes("megamillions") || normalized.includes("mega-millions")) {
    return "mega-millions"
  }
  
  // Check aliases
  for (const [slug, entry] of Object.entries(MULTI_STATE_LOGOS)) {
    if (entry.aliases?.some((alias) => normalized.includes(normalizeSlug(alias)))) {
      return slug
    }
  }
  
  return null
}
