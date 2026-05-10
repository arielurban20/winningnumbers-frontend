import type { Game } from "@/types/api"

/**
 * Historical game info from /api/historical/games.
 * Supports both new backend format (game_slug, game_name, source_game_slug)
 * and legacy format (id, slug, name).
 */
export interface HistoricalGame {
  // New backend format (official sources)
  game_slug?: string
  game_name?: string
  source_game_slug?: string
  // Legacy format
  id?: number
  slug?: string
  name?: string
  state_slug: string
  state_name: string
}

// ─── Helpers to read fields regardless of format ───────────────────────────

function getSlug(g: HistoricalGame): string {
  return g.game_slug || g.slug || ""
}

function getName(g: HistoricalGame): string {
  return g.game_name || g.name || ""
}

function getSourceSlug(g: HistoricalGame): string {
  return g.source_game_slug || g.slug || ""
}

// ───────────────────────────────────────────────────────────────────────────

/**
 * Normalize a string for comparison
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

/**
 * Resolve the correct historical game slug from the available historical games.
 *
 * @param familySlug      - The family slug from the URL (e.g., "cash-3")
 * @param sessionSlug     - Optional session slug (e.g., "midday")
 * @param stateSlug       - The state slug (e.g., "ga")
 * @param historicalGames - List of available historical games from API
 * @returns The matching game slug or null if not found
 */
export function resolveHistoricalGameSlug(
  familySlug: string,
  sessionSlug: string | null,
  stateSlug: string,
  historicalGames: HistoricalGame[]
): string | null {
  const normalizedFamily = normalize(familySlug)
  const normalizedSession = sessionSlug ? normalize(sessionSlug) : null

  // Filter games by state
  const stateGames = historicalGames.filter((g) => g.state_slug === stateSlug)

  if (stateGames.length === 0) {
    return null
  }

  // If we have a session, try to find exact session match first
  if (normalizedSession) {
    const exactMatch = stateGames.find((g) => {
      const normalizedGameName = normalize(getName(g))
      const normalizedSourceSlug = normalize(getSourceSlug(g))
      return (
        (normalizedGameName.includes(normalizedFamily) &&
          normalizedGameName.includes(normalizedSession)) ||
        (normalizedSourceSlug.includes(normalizedFamily) &&
          normalizedSourceSlug.includes(normalizedSession))
      )
    })

    if (exactMatch) {
      return getSlug(exactMatch)
    }
  }

  // Try family-only match (for single-session games or family-level views)
  const familyMatches = stateGames.filter((g) => {
    const normalizedGameName = normalize(getName(g))
    const normalizedSourceSlug = normalize(getSourceSlug(g))
    return (
      normalizedGameName.includes(normalizedFamily) ||
      normalizedSourceSlug.includes(normalizedFamily)
    )
  })

  // If only one match, return it
  if (familyMatches.length === 1) {
    return getSlug(familyMatches[0])
  }

  // If multiple matches, prefer non-session game first
  if (familyMatches.length > 0) {
    const sorted = familyMatches.sort((a, b) => {
      const aHasSession = /midday|evening|day|night|morning/i.test(getName(a))
      const bHasSession = /midday|evening|day|night|morning/i.test(getName(b))
      if (aHasSession && !bHasSession) return 1
      if (!aHasSession && bHasSession) return -1
      return 0
    })
    return getSlug(sorted[0])
  }

  return null
}

/**
 * Get all historical games for a family and state
 */
export function getAllFamilyHistoricalGames(
  familySlug: string,
  stateSlug: string,
  historicalGames: HistoricalGame[]
): HistoricalGame[] {
  const normalizedFamily = normalize(familySlug)

  return historicalGames.filter((g) => {
    if (g.state_slug !== stateSlug) return false
    const normalizedGameName = normalize(getName(g))
    const normalizedSourceSlug = normalize(getSourceSlug(g))
    return (
      normalizedGameName.includes(normalizedFamily) ||
      normalizedSourceSlug.includes(normalizedFamily)
    )
  })
}

/**
 * Check if historical data is available for a game family
 */
export function hasHistoricalDataAvailable(
  familySlug: string,
  stateSlug: string,
  historicalGames: HistoricalGame[]
): boolean {
  return getAllFamilyHistoricalGames(familySlug, stateSlug, historicalGames).length > 0
}
