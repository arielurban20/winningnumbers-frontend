import { getStates, getStateGames } from "./states"
import { parseGameName, generateFamilySlug } from "@/lib/utils/groupGames"
import type { Game } from "@/types/api"

/**
 * Individual game item for Browse by Game section
 * Each item represents a specific game in a specific state with optional session
 */
export interface IndividualGameItem {
  gameName: string           // e.g. "Pick 3 Midday", "Cash 3 Evening", "Powerball"
  gameSlug: string           // API game slug
  familySlug: string         // Family slug for URL routing
  stateName: string          // e.g. "Florida", "Georgia"
  stateSlug: string          // e.g. "fl", "ga"
  stateAbbr: string          // e.g. "FL", "GA"
  sessionLabel?: string      // e.g. "Midday", "Evening" (optional)
  sessionSlug?: string       // e.g. "midday", "evening" (optional)
  logoUrl?: string
  isMultistate: boolean
  href: string               // Pre-computed link to result page
}

// State name to abbreviation mapping
const STATE_ABBR: Record<string, string> = {
  "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
  "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
  "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
  "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
  "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
  "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
  "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
  "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
  "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
  "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
  "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
  "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
  "Wisconsin": "WI", "Wyoming": "WY", "District of Columbia": "DC",
  "Puerto Rico": "PR", "U.S. Virgin Islands": "VI",
}

// Multi-state games that have dedicated national pages
const NATIONAL_GAMES: Record<string, string> = {
  "powerball": "/games/powerball",
  "mega-millions": "/games/mega-millions",
}

// Multi-state games that should link to a real state page
const MULTI_STATE_FALLBACKS: Record<string, { stateSlug: string; familySlug: string }> = {
  "lucky-for-life": { stateSlug: "ct", familySlug: "lucky-for-life" },
  "cash4life": { stateSlug: "ny", familySlug: "cash4life" },
  "lotto-america": { stateSlug: "ia", familySlug: "lotto-america" },
  "2by2": { stateSlug: "ks", familySlug: "2by2" },
  "tri-state-megabucks": { stateSlug: "me", familySlug: "tri-state-megabucks" },
  "gimme-5": { stateSlug: "me", familySlug: "gimme-5" },
}

/**
 * Known multi-state game slugs
 */
const MULTI_STATE_SLUGS = new Set([
  "powerball", "mega-millions", "lucky-for-life", "cash4life", 
  "lotto-america", "2by2", "tri-state-megabucks", "gimme-5",
  "millionaire-for-life"
])

/**
 * Server-side cache for all games (refreshes every 5 minutes)
 */
let allGamesCache: { games: IndividualGameItem[]; timestamp: number } | null = null
const ALL_GAMES_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function getStateAbbr(stateName: string): string {
  return STATE_ABBR[stateName] || stateName.substring(0, 2).toUpperCase()
}

function isMultistateGame(gameSlug: string, gameName: string): boolean {
  const slug = gameSlug.toLowerCase()
  const name = gameName.toLowerCase()
  
  return MULTI_STATE_SLUGS.has(slug) ||
    name.includes("powerball") ||
    name.includes("mega millions") ||
    name.includes("lucky for life") ||
    name.includes("cash4life") ||
    name.includes("lotto america") ||
    name.includes("2by2") ||
    name.includes("megabucks")
}

/**
 * Build the correct href for a game
 */
function buildGameHref(
  gameSlug: string, 
  familySlug: string, 
  stateSlug: string, 
  sessionSlug?: string,
  isMultistate: boolean = false
): string {
  const normalizedSlug = familySlug.toLowerCase()
  
  // National games with dedicated pages
  if (NATIONAL_GAMES[normalizedSlug]) {
    return NATIONAL_GAMES[normalizedSlug]
  }
  
  // Multi-state games without national pages - use fallback state
  if (isMultistate && MULTI_STATE_FALLBACKS[normalizedSlug]) {
    const fallback = MULTI_STATE_FALLBACKS[normalizedSlug]
    return `/states/${fallback.stateSlug}/${fallback.familySlug}`
  }
  
  // State-specific games
  if (sessionSlug) {
    return `/states/${stateSlug}/${familySlug}/${sessionSlug}`
  }
  
  return `/states/${stateSlug}/${familySlug}`
}

/**
 * Parse session label from game name
 * e.g. "Pick 3 Midday" -> { baseName: "Pick 3", sessionLabel: "Midday", sessionSlug: "midday" }
 */
function parseSessionFromName(gameName: string): { 
  baseName: string
  sessionLabel?: string 
  sessionSlug?: string 
} {
  const sessionPatterns = [
    /\s+(Midday|Mid-Day|Mid Day)\s*$/i,
    /\s+(Evening|Eve|Night)\s*$/i,
    /\s+(Morning)\s*$/i,
    /\s+(Day)\s*$/i,
    /\s+(Afternoon)\s*$/i,
  ]
  
  for (const pattern of sessionPatterns) {
    const match = gameName.match(pattern)
    if (match) {
      const sessionLabel = match[1]
      const baseName = gameName.replace(pattern, "").trim()
      const sessionSlug = sessionLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      return { baseName, sessionLabel, sessionSlug }
    }
  }
  
  return { baseName: gameName }
}

/**
 * Get ALL individual games from ALL states
 * Returns each game as a separate item (not grouped)
 * 
 * OPTIMIZED: Uses server-side cache to avoid fetching from all 47 states on every request
 */
export async function getAllIndividualGames(limit?: number): Promise<IndividualGameItem[]> {
  try {
    // Check server cache first
    if (allGamesCache && Date.now() - allGamesCache.timestamp < ALL_GAMES_CACHE_TTL) {
      const cached = allGamesCache.games
      return limit && limit > 0 ? cached.slice(0, limit) : cached
    }
    
    const states = await getStates()
    
    if (states.length === 0) {
      return []
    }

    const allGames: IndividualGameItem[] = []
    const seenMultistate = new Set<string>() // Track multistate games to avoid duplicates
    
    // Fetch games from all states in parallel (uses cached API calls)
    await Promise.all(
      states.map(async (state) => {
        try {
          const games = await getStateGames(state.slug)
          
          for (const game of games) {
            const { familyName } = parseGameName(game.name)
            const familySlug = generateFamilySlug(familyName)
            const { baseName, sessionLabel, sessionSlug } = parseSessionFromName(game.name)
            const isMultistate = isMultistateGame(game.slug, game.name)
            
            // For multistate games, only add once (not per state)
            if (isMultistate) {
              const key = familySlug
              if (seenMultistate.has(key)) continue
              seenMultistate.add(key)
            }
            
            const href = buildGameHref(game.slug, familySlug, state.slug, sessionSlug, isMultistate)
            
            allGames.push({
              gameName: game.name,
              gameSlug: game.slug,
              familySlug,
              stateName: state.name,
              stateSlug: state.slug,
              stateAbbr: getStateAbbr(state.name),
              sessionLabel,
              sessionSlug,
              logoUrl: game.logo_url || game.logo,
              isMultistate,
              href,
            })
          }
        } catch {
          // Silently skip failed states
        }
      })
    )

    // Sort: multistate games first, then by game name, then by state
    const sorted = allGames.sort((a, b) => {
      // Multistate games first
      if (a.isMultistate && !b.isMultistate) return -1
      if (!a.isMultistate && b.isMultistate) return 1
      
      // Then alphabetically by game name
      const nameCompare = a.gameName.localeCompare(b.gameName)
      if (nameCompare !== 0) return nameCompare
      
      // Then by state
      return a.stateName.localeCompare(b.stateName)
    })
    
    // Update server cache
    allGamesCache = { games: sorted, timestamp: Date.now() }
    
    // Apply limit if specified
    return limit && limit > 0 ? sorted.slice(0, limit) : sorted
  } catch {
    return []
  }
}

/**
 * Build safe URL for multi-state game
 */
export function buildMultiStateGameUrl(gameSlug: string): string {
  const normalizedSlug = gameSlug.toLowerCase()
  
  // National games with dedicated pages
  if (NATIONAL_GAMES[normalizedSlug]) {
    return NATIONAL_GAMES[normalizedSlug]
  }
  
  // Multi-state games with fallback state pages
  if (MULTI_STATE_FALLBACKS[normalizedSlug]) {
    const fallback = MULTI_STATE_FALLBACKS[normalizedSlug]
    return `/states/${fallback.stateSlug}/${fallback.familySlug}`
  }
  
  // Fallback to games index (should not happen)
  return "/games"
}

// Keep old interface for backwards compatibility
export interface GameFamilyInfo {
  familyName: string
  familySlug: string
  stateCount: number
  states: string[]
  stateSlugs: string[]
  logoUrl?: string
}

/**
 * Aggregate all unique game families from ALL states (legacy function)
 */
export async function getAllGameFamilies(): Promise<GameFamilyInfo[]> {
  // This function is deprecated - use getAllIndividualGames instead
  return []
}
