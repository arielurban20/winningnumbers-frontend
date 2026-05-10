import type { State, Game, GameFamily, GameSession } from "@/types/api"

/**
 * Known state slugs from the API - used for safe link building
 * This map ensures we never generate 404 links
 */
export const KNOWN_STATE_SLUGS: Record<string, string> = {
  "Alabama": "al",
  "Arizona": "az",
  "Arkansas": "ar",
  "California": "ca",
  "Colorado": "co",
  "Connecticut": "ct",
  "Delaware": "de",
  "Florida": "fl",
  "Georgia": "ga",
  "Idaho": "id",
  "Illinois": "il",
  "Indiana": "in",
  "Iowa": "ia",
  "Kansas": "ks",
  "Kentucky": "ky",
  "Louisiana": "la",
  "Maine": "me",
  "Maryland": "md",
  "Massachusetts": "ma",
  "Michigan": "mi",
  "Minnesota": "mn",
  "Missouri": "mo",
  "Montana": "mt",
  "Nebraska": "ne",
  "New Hampshire": "nh",
  "New Jersey": "nj",
  "New Mexico": "nm",
  "New York": "ny",
  "North Carolina": "nc",
  "North Dakota": "nd",
  "Ohio": "oh",
  "Oklahoma": "ok",
  "Oregon": "or",
  "Pennsylvania": "pa",
  "Puerto Rico": "puerto-rico",
  "Rhode Island": "ri",
  "South Carolina": "sc",
  "South Dakota": "sd",
  "Tennessee": "tn",
  "Texas": "tx",
  "Vermont": "vt",
  "Virginia": "va",
  "Washington": "wa",
  "Washington DC": "dc",
  "West Virginia": "wv",
  "Wisconsin": "wi",
  "Wyoming": "wy",
}

/**
 * Popular states with verified slugs for footer and CTAs
 */
export const POPULAR_STATES = [
  { name: "California", slug: "ca" },
  { name: "Florida", slug: "fl" },
  { name: "Texas", slug: "tx" },
  { name: "New York", slug: "ny" },
  { name: "Georgia", slug: "ga" },
  { name: "Pennsylvania", slug: "pa" },
]

/**
 * Build a safe state URL
 */
export function buildStateUrl(stateSlug: string): string {
  return `/states/${stateSlug}`
}

/**
 * Build a safe game family URL
 */
export function buildFamilyUrl(stateSlug: string, familySlug: string): string {
  return `/states/${stateSlug}/${familySlug}`
}

/**
 * Build a safe session URL
 */
export function buildSessionUrl(
  stateSlug: string,
  familySlug: string,
  sessionSlug: string
): string {
  if (!sessionSlug) return buildFamilyUrl(stateSlug, familySlug)
  return `/states/${stateSlug}/${familySlug}/${sessionSlug}`
}

/**
 * Build stats URL for a game family
 */
export function buildStatsUrl(stateSlug: string, familySlug: string): string {
  return `/states/${stateSlug}/${familySlug}/stats`
}

/**
 * Build historical URL for a game family
 */
export function buildHistoricalUrl(stateSlug: string, familySlug: string): string {
  return `/states/${stateSlug}/${familySlug}/historical`
}

/**
 * Get state URL from state object safely
 */
export function getStateUrl(state: State): string {
  return buildStateUrl(state.slug)
}

/**
 * Get family URL from family object safely
 */
export function getFamilyUrl(family: GameFamily): string {
  return buildFamilyUrl(family.state_slug || "", family.familySlug)
}

/**
 * Get session URL from session and family objects
 */
export function getSessionUrl(family: GameFamily, session: GameSession): string {
  const sessionSlug = session.sessionDisplaySlug || ""
  return buildSessionUrl(family.state_slug || "", family.familySlug, sessionSlug)
}

/**
 * Check if a state slug is valid (from known states or API data)
 */
export function isValidStateSlug(slug: string, apiStates?: State[]): boolean {
  // Check against API states if provided
  if (apiStates) {
    return apiStates.some((s) => s.slug === slug)
  }
  // Check against known states
  return Object.values(KNOWN_STATE_SLUGS).includes(slug)
}

/**
 * Get the slug for a state by name
 */
export function getStateSlugByName(name: string): string | undefined {
  return KNOWN_STATE_SLUGS[name]
}

/**
 * Generate state links from API states, with fallback to popular states
 */
export function getPopularStateLinks(apiStates?: State[]): Array<{ name: string; href: string }> {
  if (apiStates && apiStates.length > 0) {
    // Find popular states from API data
    const popular = POPULAR_STATES
      .map((p) => {
        const state = apiStates.find((s) => 
          s.slug === p.slug || 
          s.name.toLowerCase() === p.name.toLowerCase()
        )
        return state ? { name: state.name, href: buildStateUrl(state.slug) } : null
      })
      .filter(Boolean) as Array<{ name: string; href: string }>
    
    return popular
  }
  
  // Fallback to known popular states
  return POPULAR_STATES.map((p) => ({
    name: p.name,
    href: buildStateUrl(p.slug),
  }))
}

/**
 * Reverse lookup: slug to full state name
 */
export const SLUG_TO_STATE_NAME: Record<string, string> = {
  "al": "Alabama",
  "az": "Arizona", 
  "ar": "Arkansas",
  "ca": "California",
  "co": "Colorado",
  "ct": "Connecticut",
  "de": "Delaware",
  "fl": "Florida",
  "ga": "Georgia",
  "id": "Idaho",
  "il": "Illinois",
  "in": "Indiana",
  "ia": "Iowa",
  "ks": "Kansas",
  "ky": "Kentucky",
  "la": "Louisiana",
  "me": "Maine",
  "md": "Maryland",
  "ma": "Massachusetts",
  "mi": "Michigan",
  "mn": "Minnesota",
  "mo": "Missouri",
  "mt": "Montana",
  "ne": "Nebraska",
  "nh": "New Hampshire",
  "nj": "New Jersey",
  "nm": "New Mexico",
  "ny": "New York",
  "nc": "North Carolina",
  "nd": "North Dakota",
  "oh": "Ohio",
  "ok": "Oklahoma",
  "or": "Oregon",
  "pa": "Pennsylvania",
  "puerto-rico": "Puerto Rico",
  "ri": "Rhode Island",
  "sc": "South Carolina",
  "sd": "South Dakota",
  "tn": "Tennessee",
  "tx": "Texas",
  "vt": "Vermont",
  "va": "Virginia",
  "wa": "Washington",
  "dc": "Washington DC",
  "wv": "West Virginia",
  "wi": "Wisconsin",
  "wy": "Wyoming",
}

/**
 * Known multi-state/national games that have dedicated pages
 */
export const NATIONAL_GAME_PAGES: Record<string, string> = {
  "powerball": "/games/powerball",
  "mega-millions": "/games/mega-millions",
}

/**
 * Build URL for the games index page
 */
export function buildGameIndexUrl(): string {
  return "/games"
}

/**
 * Build URL for a global game family page
 * Returns /games/{slug} for known national games, otherwise /games
 */
export function buildGlobalGameFamilyUrl(gameFamilySlug: string): string {
  const normalizedSlug = gameFamilySlug.toLowerCase()
  if (NATIONAL_GAME_PAGES[normalizedSlug]) {
    return NATIONAL_GAME_PAGES[normalizedSlug]
  }
  // For unknown games, link to the games index instead of 404
  return "/games"
}

/**
 * Build a safe game browse URL - never returns 404
 * Use this for Browse by Lottery Game section cards
 */
export function buildSafeGameBrowseUrl(gameFamilySlug: string): string {
  const normalizedSlug = gameFamilySlug.toLowerCase()
  // Only link to pages we know exist
  if (NATIONAL_GAME_PAGES[normalizedSlug]) {
    return NATIONAL_GAME_PAGES[normalizedSlug]
  }
  // For all other game types, link to games index
  return "/games"
}

/**
 * Check if a game family has a dedicated page
 */
export function hasGameFamilyPage(gameFamilySlug: string): boolean {
  return !!NATIONAL_GAME_PAGES[gameFamilySlug.toLowerCase()]
}

/**
 * Format state slug to full state name
 * Uses lookup table for abbreviations, falls back to title case for other slugs
 */
export function formatStateName(slugOrName: string): string {
  // Check if it's an abbreviation we know
  const upperSlug = slugOrName.toLowerCase()
  if (SLUG_TO_STATE_NAME[upperSlug]) {
    return SLUG_TO_STATE_NAME[upperSlug]
  }
  
  // Otherwise format the slug as title case
  return slugOrName
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Get state name from state object or slug
 * Prefers state.name, falls back to formatting the slug
 */
export function getStateName(stateOrSlug: string | { name?: string; slug?: string }): string {
  if (typeof stateOrSlug === "string") {
    return formatStateName(stateOrSlug)
  }
  
  // If we have a name that's not just an abbreviation, use it
  if (stateOrSlug.name) {
    // Check if name is just an abbreviation
    if (stateOrSlug.name.length <= 3 && SLUG_TO_STATE_NAME[stateOrSlug.name.toLowerCase()]) {
      return SLUG_TO_STATE_NAME[stateOrSlug.name.toLowerCase()]
    }
    return stateOrSlug.name
  }
  
  if (stateOrSlug.slug) {
    return formatStateName(stateOrSlug.slug)
  }
  
  return "Unknown State"
}

/**
 * Multi-state game fallbacks - maps canonical slugs to best known state pages
 */
const MULTI_STATE_FALLBACKS: Record<string, { stateSlug: string; gameSlug: string }> = {
  "lucky-for-life": { stateSlug: "ct", gameSlug: "lucky-for-life" },
  "cash4life": { stateSlug: "ny", gameSlug: "cash4life" },
  "lotto-america": { stateSlug: "ia", gameSlug: "lotto-america" },
  "2by2": { stateSlug: "ks", gameSlug: "2by2" },
  "tri-state-megabucks": { stateSlug: "me", gameSlug: "tri-state-megabucks" },
  "gimme-5": { stateSlug: "me", gameSlug: "gimme-5" },
  "millionaire-for-life": { stateSlug: "va", gameSlug: "millionaire-for-life" },
}

/**
 * Build URL for actual game results based on game family slug
 * Maps common game types to known pages or the games index
 */
export function buildGameResultsUrl(gameFamilySlug: string): string {
  const normalizedSlug = gameFamilySlug.toLowerCase()
  
  // National games with dedicated pages
  if (NATIONAL_GAME_PAGES[normalizedSlug]) {
    return NATIONAL_GAME_PAGES[normalizedSlug]
  }
  
  // Multi-state games with fallback state pages
  if (MULTI_STATE_FALLBACKS[normalizedSlug]) {
    const fallback = MULTI_STATE_FALLBACKS[normalizedSlug]
    return `/states/${fallback.stateSlug}/${fallback.gameSlug}`
  }
  
  // For state-specific games, link to games index
  return "/games"
}

/**
 * Build national game URL - always returns /games/{slug} for known national games
 */
export function buildNationalGameUrl(gameSlug: string): string {
  const normalizedSlug = gameSlug.toLowerCase()
  
  if (normalizedSlug === "powerball" || normalizedSlug.includes("powerball")) {
    return "/games/powerball"
  }
  
  if (normalizedSlug === "mega-millions" || normalizedSlug.includes("mega") || normalizedSlug === "megamillions") {
    return "/games/mega-millions"
  }
  
  return "/games"
}

/**
 * Build the best URL for a multi-state game
 * For Powerball/Mega Millions: returns /games/{slug}
 * For other multi-state games: returns the best known state page
 */
export function buildBestMultiStateGameUrl(gameSlug: string): string {
  const normalizedSlug = gameSlug.toLowerCase()
  
  // National games with dedicated pages
  if (NATIONAL_GAME_PAGES[normalizedSlug]) {
    return NATIONAL_GAME_PAGES[normalizedSlug]
  }
  
  // Alias handling
  if (normalizedSlug.includes("powerball")) return "/games/powerball"
  if (normalizedSlug.includes("mega") || normalizedSlug === "megamillions") return "/games/mega-millions"
  
  // Multi-state games with fallback state pages
  if (MULTI_STATE_FALLBACKS[normalizedSlug]) {
    const fallback = MULTI_STATE_FALLBACKS[normalizedSlug]
    return `/states/${fallback.stateSlug}/${fallback.gameSlug}`
  }
  
  // Try to match aliases
  const aliasMap: Record<string, string> = {
    "lotto america": "lotto-america",
    "lottoamerica": "lotto-america",
    "lucky for life": "lucky-for-life",
    "luckyforlife": "lucky-for-life",
    "cash 4 life": "cash4life",
    "cash-4-life": "cash4life",
    "2-by-2": "2by2",
    "two by two": "2by2",
    "tri state megabucks": "tri-state-megabucks",
    "megabucks": "tri-state-megabucks",
    "gimme 5": "gimme-5",
    "gimme5": "gimme-5",
  }
  
  const aliasedSlug = aliasMap[normalizedSlug]
  if (aliasedSlug && MULTI_STATE_FALLBACKS[aliasedSlug]) {
    const fallback = MULTI_STATE_FALLBACKS[aliasedSlug]
    return `/states/${fallback.stateSlug}/${fallback.gameSlug}`
  }
  
  // Fallback to games index (should not happen for known games)
  return "/games"
}

/**
 * Build state game URL with proper validation
 */
export function buildStateGameUrl(stateSlug: string, gameFamilySlug: string): string {
  if (!stateSlug || !gameFamilySlug) return "/games"
  return `/states/${stateSlug}/${gameFamilySlug}`
}
