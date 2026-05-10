import { getStates, getStateGames } from "@/lib/api/states"
import { getDrawResult } from "@/lib/api/draws"
import type { DrawResult, State, Game } from "@/types/api"

/**
 * Resolved national game result with metadata
 */
export interface NationalGameResolution {
  result: DrawResult | null
  stateSlug: string | null
  stateName: string | null
  gameSlug: string | null
  gameName: string | null
  canonicalUrl: string
  availableStateLinks: Array<{ stateSlug: string; stateName: string; href: string }>
}

/**
 * Game alias mapping - maps various slug/name formats to canonical slugs
 */
const GAME_ALIASES: Record<string, string[]> = {
  "powerball": ["powerball", "power-ball", "power ball"],
  "mega-millions": ["mega-millions", "megamillions", "mega millions", "mega_millions"],
  "lotto-america": ["lotto-america", "lotto america", "lottoamerica"],
  "lucky-for-life": ["lucky-for-life", "lucky for life", "luckyforlife"],
  "cash4life": ["cash4life", "cash-4-life", "cash 4 life", "cash4-life"],
  "2by2": ["2by2", "2-by-2", "two by two", "twoby2"],
  "tri-state-megabucks": ["tri-state-megabucks", "tri state megabucks", "megabucks", "megabucks plus", "tri-state megabucks plus", "tsmegabucks"],
  "millionaire-for-life": ["millionaire-for-life", "millionaire for life", "millionaireforlife"],
  "gimme-5": ["gimme-5", "gimme 5", "gimme5", "tsgimme5"],
}

/**
 * National games that have dedicated /games/{slug} pages
 */
const NATIONAL_GAME_PAGES: Record<string, string> = {
  "powerball": "/games/powerball",
  "mega-millions": "/games/mega-millions",
}

/**
 * Priority states to check first (high population, reliable data)
 */
const PRIORITY_STATES = ["ny", "ca", "tx", "fl", "pa", "ga", "nc", "va", "az", "oh", "nj", "ma"]

/**
 * Cache for resolved results (in-memory, cleared on server restart)
 * Key: canonicalSlug, Value: { resolution, timestamp }
 */
const resolutionCache = new Map<string, { resolution: NationalGameResolution; timestamp: number }>()
// Short cache to ensure fresh results while avoiding excessive API calls
const CACHE_TTL_MS = 60 * 1000 // 1 minute

// Development debug logging
const DEBUG = process.env.NODE_ENV === "development"

function debugLog(message: string, data?: Record<string, unknown>) {
  if (DEBUG) {
    console.log(`[NationalResolver] ${message}`, data ? JSON.stringify(data, null, 2) : "")
  }
}

/**
 * Normalize a game slug to its canonical form
 */
export function normalizeGameSlug(input: string): string | null {
  const normalized = input.toLowerCase().trim()
  
  for (const [canonical, aliases] of Object.entries(GAME_ALIASES)) {
    if (aliases.some(alias => normalized === alias || normalized.includes(alias))) {
      return canonical
    }
  }
  
  return null
}

/**
 * Check if a game matches a canonical slug
 */
function gameMatchesCanonical(game: Game, canonicalSlug: string): boolean {
  const gameSlug = (game.slug || "").toLowerCase()
  const gameName = (game.name || "").toLowerCase()
  
  const aliases = GAME_ALIASES[canonicalSlug] || [canonicalSlug]
  
  return aliases.some(alias => 
    gameSlug === alias || 
    gameSlug.includes(alias.replace(/ /g, "-")) ||
    gameName === alias ||
    gameName.includes(alias)
  )
}

/**
 * Score a result for comparison - higher is better
 */
function scoreResult(result: DrawResult): number {
  let score = 0
  
  // Has main numbers
  if (result.main_numbers && result.main_numbers.length > 0) score += 100
  if (result.main_items && result.main_items.length > 0) score += 100
  
  // Has bonus items
  if (result.bonus_items && result.bonus_items.length > 0) score += 50
  
  // Has jackpot info
  if (result.jackpot_next) score += 30
  if (result.jackpot_change) score += 10
  
  // Has next draw info
  if (result.next_draw_text) score += 40
  if (result.next_draw_relative) score += 40
  
  // Status is green (most recent/verified)
  if (result.draw_status_color === "green") score += 50
  
  // Has date
  if (result.draw_date) score += 20
  
  return score
}

/**
 * Compare two results - returns positive if a is better, negative if b is better
 */
function compareResults(a: DrawResult, b: DrawResult): number {
  // First compare by date (newer is better)
  if (a.draw_date && b.draw_date) {
    const dateA = new Date(a.draw_date).getTime()
    const dateB = new Date(b.draw_date).getTime()
    if (dateA !== dateB) return dateA - dateB
  }
  
  // If same date, compare by score
  return scoreResult(a) - scoreResult(b)
}

/**
 * Build canonical URL for a game
 */
function buildCanonicalUrl(canonicalSlug: string, stateSlug?: string, gameSlug?: string): string {
  // National games have dedicated pages
  if (NATIONAL_GAME_PAGES[canonicalSlug]) {
    return NATIONAL_GAME_PAGES[canonicalSlug]
  }
  
  // Other multi-state games use state pages
  if (stateSlug && gameSlug) {
    return `/states/${stateSlug}/${gameSlug}`
  }
  
  // Fallback
  return "/games"
}

/**
 * Get state name from slug
 */
const STATE_NAMES: Record<string, string> = {
  "al": "Alabama", "az": "Arizona", "ar": "Arkansas", "ca": "California",
  "co": "Colorado", "ct": "Connecticut", "de": "Delaware", "fl": "Florida",
  "ga": "Georgia", "id": "Idaho", "il": "Illinois", "in": "Indiana",
  "ia": "Iowa", "ks": "Kansas", "ky": "Kentucky", "la": "Louisiana",
  "me": "Maine", "md": "Maryland", "ma": "Massachusetts", "mi": "Michigan",
  "mn": "Minnesota", "mo": "Missouri", "mt": "Montana", "ne": "Nebraska",
  "nh": "New Hampshire", "nj": "New Jersey", "nm": "New Mexico", "ny": "New York",
  "nc": "North Carolina", "nd": "North Dakota", "oh": "Ohio", "ok": "Oklahoma",
  "or": "Oregon", "pa": "Pennsylvania", "ri": "Rhode Island", "sc": "South Carolina",
  "sd": "South Dakota", "tn": "Tennessee", "tx": "Texas", "vt": "Vermont",
  "va": "Virginia", "wa": "Washington", "dc": "Washington DC", "wv": "West Virginia",
  "wi": "Wisconsin", "wy": "Wyoming",
}

function getStateName(stateSlug: string): string {
  return STATE_NAMES[stateSlug.toLowerCase()] || stateSlug
}

/**
 * Find all states that have a specific game
 */
async function findStatesWithGame(
  canonicalSlug: string,
  states: State[]
): Promise<Array<{ state: State; game: Game }>> {
  const matches: Array<{ state: State; game: Game }> = []
  
  // Order states: priority states first, then others
  const orderedStates = [
    ...PRIORITY_STATES.map(slug => states.find(s => s.slug === slug)).filter((s): s is State => s !== undefined),
    ...states.filter(s => !PRIORITY_STATES.includes(s.slug))
  ]
  
  // Fetch games for all states in parallel (but limit concurrency)
  const batchSize = 10
  for (let i = 0; i < orderedStates.length; i += batchSize) {
    const batch = orderedStates.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async (state) => {
        try {
          const games = await getStateGames(state.slug)
          const matchingGame = games.find(g => gameMatchesCanonical(g, canonicalSlug))
          if (matchingGame) {
            return { state, game: matchingGame }
          }
        } catch {
          // Ignore errors for individual states
        }
        return null
      })
    )
    
    for (const result of results) {
      if (result) matches.push(result)
    }
    
    // For national games, we can stop early if we have enough matches
    if (matches.length >= 5 && (canonicalSlug === "powerball" || canonicalSlug === "mega-millions")) {
      break
    }
  }
  
  return matches
}

/**
 * FAST FALLBACK: Known states for each national game
 * This avoids iterating all 47 states - we just try these first
 */
const FAST_FALLBACK_STATES: Record<string, Array<{ stateSlug: string; gameSlug: string }>> = {
  "powerball": [
    { stateSlug: "az", gameSlug: "powerball" },
    { stateSlug: "ca", gameSlug: "powerball" },
    { stateSlug: "ny", gameSlug: "powerball" },
    { stateSlug: "fl", gameSlug: "powerball" },
    { stateSlug: "tx", gameSlug: "powerball" },
  ],
  "mega-millions": [
    { stateSlug: "az", gameSlug: "mega-millions" },
    { stateSlug: "ca", gameSlug: "mega-millions" },
    { stateSlug: "ny", gameSlug: "mega-millions" },
    { stateSlug: "fl", gameSlug: "mega-millions" },
    { stateSlug: "tx", gameSlug: "mega-millions" },
  ],
  "lotto-america": [
    { stateSlug: "ia", gameSlug: "lotto-america" },
    { stateSlug: "ks", gameSlug: "lotto-america" },
  ],
  "lucky-for-life": [
    { stateSlug: "ct", gameSlug: "lucky-for-life" },
    { stateSlug: "ma", gameSlug: "lucky-for-life" },
  ],
  "cash4life": [
    { stateSlug: "ny", gameSlug: "cash4life" },
    { stateSlug: "nj", gameSlug: "cash4life" },
  ],
  "2by2": [
    { stateSlug: "ks", gameSlug: "2by2" },
    { stateSlug: "ne", gameSlug: "2by2" },
  ],
}

/**
 * Resolve the best available result for a national/multi-state game
 * 
 * Strategy:
 * 1. FAST PATH: Try known fallback states in parallel
 * 2. Compare all results by draw_date (newest wins)
 * 3. If tied, compare by completeness score
 * 4. SLOW PATH: If fast path finds nothing valid, search all states
 * 
 * @param gameNameOrSlug - The game name or slug (e.g., "powerball", "Mega Millions")
 * @returns Resolution with the best result and metadata
 */
export async function resolveNationalGameResult(
  gameNameOrSlug: string
): Promise<NationalGameResolution> {
  const canonicalSlug = normalizeGameSlug(gameNameOrSlug)
  
  if (!canonicalSlug) {
    return {
      result: null,
      stateSlug: null,
      stateName: null,
      gameSlug: null,
      gameName: null,
      canonicalUrl: "/games",
      availableStateLinks: [],
    }
  }
  
  // Check cache
  const cached = resolutionCache.get(canonicalSlug)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    debugLog("Cache hit", { canonicalSlug, cachedState: cached.resolution.stateSlug })
    return cached.resolution
  }
  
  debugLog("Cache miss, resolving", { canonicalSlug })
  
  // FAST PATH: Try known fallback states IN PARALLEL and compare results
  const fallbackStates = FAST_FALLBACK_STATES[canonicalSlug]
  let usedFastPath = false
  let statesChecked: string[] = []
  
  interface ResultWithMeta {
    result: DrawResult
    stateSlug: string
    gameSlug: string
  }
  
  let validResults: ResultWithMeta[] = []
  
  if (fallbackStates && fallbackStates.length > 0) {
    statesChecked = fallbackStates.map(f => f.stateSlug)
    
    // Fetch ALL fallback states in parallel
    const fastResults = await Promise.all(
      fallbackStates.map(async ({ stateSlug, gameSlug }) => {
        try {
          const result = await getDrawResult(gameSlug, stateSlug)
          if (result && (result.main_numbers?.length || result.main_items?.length)) {
            return { result, stateSlug, gameSlug }
          }
        } catch {
          // Ignore individual state errors
        }
        return null
      })
    )
    
    validResults = fastResults.filter((r): r is ResultWithMeta => r !== null)
    
    if (validResults.length > 0) {
      usedFastPath = true
      debugLog("Fast path found results", { 
        statesChecked, 
        resultsFound: validResults.length,
        states: validResults.map(r => r.stateSlug)
      })
    }
  }
  
  // SLOW PATH: If fast path found nothing, search all states
  if (validResults.length === 0) {
    debugLog("Fast path failed, using slow path", { canonicalSlug })
    
    const states = await getStates() as State[]
    const stateGamePairs = await findStatesWithGame(canonicalSlug, states)
    statesChecked = stateGamePairs.map(p => p.state.slug)
    
    if (stateGamePairs.length === 0) {
      debugLog("No states found with game", { canonicalSlug })
      const resolution: NationalGameResolution = {
        result: null,
        stateSlug: null,
        stateName: null,
        gameSlug: null,
        gameName: null,
        canonicalUrl: buildCanonicalUrl(canonicalSlug),
        availableStateLinks: [],
      }
      return resolution
    }
    
    // Fetch results from matching states in parallel (limit to first 5 for speed)
    const limitedPairs = stateGamePairs.slice(0, 5)
    const slowResults = await Promise.all(
      limitedPairs.map(async ({ state, game }) => {
        try {
          const result = await getDrawResult(game.slug, state.slug)
          if (result && (result.main_numbers?.length || result.main_items?.length)) {
            return { result, stateSlug: state.slug, gameSlug: game.slug }
          }
        } catch {
          // Ignore
        }
        return null
      })
    )
    
    validResults = slowResults.filter((r): r is ResultWithMeta => r !== null)
  }
  
  // No valid results from any path
  if (validResults.length === 0) {
    debugLog("No valid results found", { canonicalSlug, statesChecked })
    const resolution: NationalGameResolution = {
      result: null,
      stateSlug: null,
      stateName: null,
      gameSlug: null,
      gameName: null,
      canonicalUrl: buildCanonicalUrl(canonicalSlug),
      availableStateLinks: [],
    }
    resolutionCache.set(canonicalSlug, { resolution, timestamp: Date.now() })
    return resolution
  }
  
  // Sort by date (newest first), then by completeness score
  validResults.sort((a, b) => {
    // Compare by draw_date first (newer is better)
    if (a.result.draw_date && b.result.draw_date) {
      const dateA = new Date(a.result.draw_date).getTime()
      const dateB = new Date(b.result.draw_date).getTime()
      if (dateA !== dateB) return dateB - dateA // Descending (newest first)
    }
    // If same date, compare by completeness score
    return scoreResult(b.result) - scoreResult(a.result)
  })
  
  const best = validResults[0]
  
  debugLog("Selected best result", {
    usedFastPath,
    statesChecked,
    selectedState: best.stateSlug,
    selectedGameSlug: best.gameSlug,
    drawDate: best.result.draw_date,
    score: scoreResult(best.result),
  })
  
  // Build available state links
  const availableStateLinks = validResults.map(r => ({
    stateSlug: r.stateSlug,
    stateName: getStateName(r.stateSlug),
    href: `/states/${r.stateSlug}/${r.gameSlug}`,
  }))
  
  const resolution: NationalGameResolution = {
    result: best.result,
    stateSlug: best.stateSlug,
    stateName: getStateName(best.stateSlug),
    gameSlug: best.gameSlug,
    gameName: canonicalSlug === "powerball" ? "Powerball" : 
              canonicalSlug === "mega-millions" ? "Mega Millions" :
              best.gameSlug.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    canonicalUrl: buildCanonicalUrl(canonicalSlug, best.stateSlug, best.gameSlug),
    availableStateLinks,
  }
  
  // Cache the result
  resolutionCache.set(canonicalSlug, { resolution, timestamp: Date.now() })
  
  return resolution
}

/**
 * Resolve multiple national games in parallel
 */
export async function resolveMultipleNationalGames(
  gameSlugs: string[]
): Promise<Record<string, NationalGameResolution>> {
  const results = await Promise.all(
    gameSlugs.map(async (slug) => {
      const resolution = await resolveNationalGameResult(slug)
      return { slug: normalizeGameSlug(slug) || slug, resolution }
    })
  )
  
  return Object.fromEntries(results.map(r => [r.slug, r.resolution]))
}

/**
 * Get the best URL for a multi-state game
 * Returns /games/{slug} for national games, or the best state page for others
 */
export async function getBestMultiStateGameUrl(gameSlug: string): Promise<string> {
  const canonicalSlug = normalizeGameSlug(gameSlug)
  
  if (!canonicalSlug) return "/games"
  
  // National games have dedicated pages
  if (NATIONAL_GAME_PAGES[canonicalSlug]) {
    return NATIONAL_GAME_PAGES[canonicalSlug]
  }
  
  // For other multi-state games, resolve to find the best state
  const resolution = await resolveNationalGameResult(canonicalSlug)
  return resolution.canonicalUrl
}

/**
 * Check if a game slug is a known multi-state game
 */
export function isMultiStateGame(gameSlug: string): boolean {
  return normalizeGameSlug(gameSlug) !== null
}
