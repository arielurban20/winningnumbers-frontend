import type { Game, GameFamily, GameSession, DrawResult } from "@/types/api"

// Comprehensive session patterns to extract from game names
// Order matters - longer patterns first to avoid partial matches
const SESSION_WORDS = [
  // English multi-word sessions (longest first)
  "After Hours",
  "Coffee Break",
  "Lunch Break",
  "Rush Hour",
  "Early Bird",
  "Night Owl",
  "Drive Time",
  "Prime Time",
  "Primetime",
  "Late Night",
  "Mid Day",
  "Drawing 1",
  "Drawing 2",
  "Session 1",
  "Session 2",
  // Spanish multi-word
  "Medio Día",
  "Medio Dia",
  "Mediodía",
  "Mediodia",
  // Food/time-of-day sessions
  "Brunch",
  "Suppertime",
  "Supper Time",
  "Lunch",
  "Lunchtime",
  "Lunch Time",
  "Dinner",
  "Dinnertime",
  "Dinner Time",
  "Breakfast",
  // English single-word sessions
  "Day",
  "Night",
  "Midday",
  "Evening",
  "Morning",
  "Afternoon",
  "Early",
  "Late",
  "Matinee",
  // Spanish single-word
  "Día",
  "Dia",
  "Noche",
  "Tarde",
  "Mañana",
  "Manana",
  "Matutina",
  "Vespertina",
  "Nocturna",
  "Primera",
  "Segunda",
  "Tercera",
]

// Time pattern regex - matches times like "1:50pm", "7:50 PM", "11:30pm", "10:00am"
const TIME_PATTERN = /\s+(\d{1,2}:\d{2}\s*[ap]m)$/i

// Create regex pattern from session words (case insensitive, word boundary at end)
const SESSION_PATTERN = new RegExp(
  `\\s+(${SESSION_WORDS.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`,
  'i'
)

export interface ParsedGameName {
  familyName: string
  session: string | null
}

/**
 * Parse a game name to extract the family name and session
 * 
 * Examples:
 * - "Cash Pop Early Bird" -> { familyName: "Cash Pop", session: "Early Bird" }
 * - "Cash Pop Brunch" -> { familyName: "Cash Pop", session: "Brunch" }
 * - "Cash Pop Suppertime" -> { familyName: "Cash Pop", session: "Suppertime" }
 * - "Pick 3 Day" -> { familyName: "Pick 3", session: "Day" }
 * - "Pega 3 Día" -> { familyName: "Pega 3", session: "Día" }
 * - "DC-3 1:50pm" -> { familyName: "DC-3", session: "1:50pm" }
 * - "DC-4 7:50 PM" -> { familyName: "DC-4", session: "7:50 PM" }
 */
export function parseGameName(gameName: string): ParsedGameName {
  // First, check for time patterns (e.g., "1:50pm", "7:50 PM", "11:30pm")
  const timeMatch = gameName.match(TIME_PATTERN)
  if (timeMatch) {
    return {
      familyName: gameName.slice(0, timeMatch.index).trim(),
      session: timeMatch[1].trim(),
    }
  }
  
  // Then check for session word patterns
  const sessionMatch = gameName.match(SESSION_PATTERN)
  if (sessionMatch) {
    return {
      familyName: gameName.slice(0, sessionMatch.index).trim(),
      session: sessionMatch[1].trim(),
    }
  }
  
  return {
    familyName: gameName,
    session: null,
  }
}

/**
 * Generate a normalized family slug from the family name
 */
export function generateFamilySlug(familyName: string): string {
  return familyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Generate a session slug from session name
 * 
 * Examples:
 * - "Early Bird" -> "early-bird"
 * - "1:50pm" -> "1-50pm"
 * - "7:50 PM" -> "7-50pm"
 * - "11:30pm" -> "11-30pm"
 * - "Brunch" -> "brunch"
 */
export function generateSessionSlug(sessionName: string): string {
  if (!sessionName || sessionName === "Main") return ""
  return sessionName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/\s+/g, "") // Remove spaces (e.g., "7:50 PM" -> "7:50pm")
    .replace(/:/g, "-") // Replace colon with dash (e.g., "7:50pm" -> "7-50pm")
    .replace(/[^a-z0-9-]+/g, "-") // Replace other non-alphanumeric with dash
    .replace(/^-|-$/g, "") // Remove leading/trailing dashes
    .replace(/-+/g, "-") // Collapse multiple dashes
}

/**
 * Group games by family, combining sessions (Day/Night/Early Bird/etc.) into one GameFamily
 * @param games - Array of games from API
 * @param drawResults - Optional map of game slug to latest draw result
 * @param stateSlug - State slug from URL params (required for building session URLs)
 * @param stateName - Optional state name for display
 */
export function groupGamesByFamily(
  games: Game[],
  drawResults?: Map<string, DrawResult>,
  stateSlug?: string,
  stateName?: string
): GameFamily[] {
  const familyMap = new Map<string, GameFamily>()
  
  for (const game of games) {
    const { familyName, session } = parseGameName(game.name)
    const familySlug = generateFamilySlug(familyName)
    
    const sessionData: GameSession = {
      sessionName: session || "Main",
      sessionSlug: game.slug, // Keep original API game slug for API calls
      sessionDisplaySlug: generateSessionSlug(session || ""), // URL-friendly slug
      game,
      latestDraw: drawResults?.get(game.slug),
    }
    
    if (familyMap.has(familySlug)) {
      const family = familyMap.get(familySlug)!
      family.sessions.push(sessionData)
      // Update logo if current game has one and family doesn't
      if (!family.logo_url && game.logo_url) {
        family.logo_url = game.logo_url
      }
      if (!family.logo && game.logo) {
        family.logo = game.logo
      }
      if (!family.icon_url && game.icon_url) {
        family.icon_url = game.icon_url
      }
    } else {
      familyMap.set(familySlug, {
        familyName,
        familySlug,
        sessions: [sessionData],
        state_slug: stateSlug || game.state_slug || "",
        state_name: stateName || game.state_name || "",
        logo_url: game.logo_url,
        logo: game.logo,
        icon_url: game.icon_url,
      })
    }
  }
  
  // Sort sessions within each family with comprehensive ordering
  const sessionOrder = [
    "early bird",
    "morning",
    "coffee break",
    "breakfast",
    "matutina",
    "mañana",
    "manana",
    "drive time",
    "brunch",
    "midday",
    "mid day",
    "mediodía",
    "mediodia",
    "medio día",
    "medio dia",
    "matinee",
    "lunch",
    "lunchtime",
    "day",
    "día",
    "dia",
    "afternoon",
    "tarde",
    "vespertina",
    "suppertime",
    "supper time",
    "dinner",
    "dinnertime",
    "evening",
    "prime time",
    "primetime",
    "rush hour",
    "night owl",
    "late night",
    "night",
    "after hours",
    "noche",
    "nocturna",
    "primera",
    "segunda",
    "tercera",
    "session 1",
    "session 2",
    "drawing 1",
    "drawing 2",
    "main",
  ]
  
  // Helper to parse time strings to minutes for sorting
  const parseTimeToMinutes = (timeStr: string): number | null => {
    const match = timeStr.toLowerCase().match(/(\d{1,2}):(\d{2})\s*(am|pm)/)
    if (!match) return null
    let hours = parseInt(match[1], 10)
    const minutes = parseInt(match[2], 10)
    const isPM = match[3] === "pm"
    if (isPM && hours !== 12) hours += 12
    if (!isPM && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  for (const family of familyMap.values()) {
    family.sessions.sort((a, b) => {
      const aLower = a.sessionName.toLowerCase()
      const bLower = b.sessionName.toLowerCase()
      
      // Check if both are time-based sessions
      const aTime = parseTimeToMinutes(aLower)
      const bTime = parseTimeToMinutes(bLower)
      
      // If both are times, sort chronologically
      if (aTime !== null && bTime !== null) {
        return aTime - bTime
      }
      
      // If only one is a time, times come after named sessions
      if (aTime !== null) return 1
      if (bTime !== null) return -1
      
      // Otherwise use the session order
      const aIndex = sessionOrder.findIndex((s) => aLower.includes(s) || aLower === s)
      const bIndex = sessionOrder.findIndex((s) => bLower.includes(s) || bLower === s)
      return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex)
    })
  }
  
  return Array.from(familyMap.values()).sort((a, b) => 
    a.familyName.localeCompare(b.familyName)
  )
}

/**
 * Find games that match a family slug
 */
export function findGamesByFamilySlug(games: Game[], familySlug: string): Game[] {
  return games.filter((game) => {
    const { familyName } = parseGameName(game.name)
    return generateFamilySlug(familyName) === familySlug
  })
}

/**
 * Find a specific session within a family
 * 
 * Handles various slug formats including time-based sessions:
 * - "early-bird" matches "Early Bird"
 * - "1-50pm" matches "1:50pm" or "1:50 PM"
 * - "7-50pm" matches "7:50pm" or "7:50 PM"
 */
export function findSessionInFamily(
  family: GameFamily,
  sessionSlug: string
): GameSession | undefined {
  const normalizedInput = sessionSlug.toLowerCase()
  
  return family.sessions.find((s) => {
    // Try exact sessionDisplaySlug match
    if (s.sessionDisplaySlug === sessionSlug) return true
    
    // Try normalized session name match
    const normalizedSessionSlug = generateSessionSlug(s.sessionName)
    if (normalizedSessionSlug === normalizedInput) return true
    
    // Try game slug match (for API compatibility)
    if (s.sessionSlug === sessionSlug) return true
    if (s.sessionSlug.toLowerCase() === normalizedInput) return true
    
    // Try matching time formats (e.g., "1-50pm" should match session "1:50pm")
    // Convert slug back to potential time format and compare
    const timeFromSlug = normalizedInput.replace(/-/g, ":")
    const sessionNameLower = s.sessionName.toLowerCase().replace(/\s+/g, "")
    if (sessionNameLower === timeFromSlug) return true
    
    return false
  })
}

/**
 * Get the display name for a session
 */
export function getSessionDisplayName(session: string | null): string {
  if (!session || session === "Main") return ""
  return session
}

/**
 * Check if a game family has multiple sessions
 */
export function hasMultipleSessions(family: GameFamily): boolean {
  return family.sessions.length > 1
}

/**
 * Build URL for a game family page
 */
export function buildFamilyUrl(stateSlug: string, familySlug: string): string {
  return `/states/${stateSlug}/${familySlug}`
}

/**
 * Build URL for a session page
 */
export function buildSessionUrl(
  stateSlug: string,
  familySlug: string,
  sessionSlug: string
): string {
  if (!sessionSlug) return buildFamilyUrl(stateSlug, familySlug)
  return `/states/${stateSlug}/${familySlug}/${sessionSlug}`
}
