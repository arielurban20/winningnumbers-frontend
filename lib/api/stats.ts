import { apiGet } from "./client"
import type { StatItem } from "@/types/api"

// All possible backend response shapes
type StatsResponseShape =
  | StatItem[]
  | { count?: number; items?: unknown[] }
  | { data?: unknown[] }
  | { stats?: unknown[] }
  | { results?: unknown[] }
  | { most_frequent?: unknown[] | { items?: unknown[] } }
  | { least_frequent?: unknown[] | { items?: unknown[] } }

/**
 * Normalize any backend response into a flat StatItem[].
 */
function normalizeStatsArray(
  raw: StatsResponseShape | null,
  legacyKey?: "most_frequent" | "least_frequent"
): StatItem[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw as StatItem[]
  if (typeof raw !== "object") return []

  if ("items" in raw && Array.isArray((raw as { items?: unknown[] }).items))
    return (raw as { items: StatItem[] }).items

  if ("data" in raw && Array.isArray((raw as { data?: unknown[] }).data))
    return (raw as { data: StatItem[] }).data

  if ("stats" in raw && Array.isArray((raw as { stats?: unknown[] }).stats))
    return (raw as { stats: StatItem[] }).stats

  if ("results" in raw && Array.isArray((raw as { results?: unknown[] }).results))
    return (raw as { results: StatItem[] }).results

  if (legacyKey && legacyKey in raw) {
    const val = (raw as Record<string, unknown>)[legacyKey]
    if (Array.isArray(val)) return val as StatItem[]
    if (val && typeof val === "object" && "items" in (val as object)) {
      const nested = (val as { items?: unknown[] }).items
      if (Array.isArray(nested)) return nested as StatItem[]
    }
  }

  return []
}

/**
 * Try fetching stats from a list of candidate URLs in order.
 * Returns the first successful non-empty result.
 * NEVER returns mock data — if all fail, returns empty array with backendUnavailable: true.
 */
async function tryStatUrls(
  urls: string[],
  legacyKey: "most_frequent" | "least_frequent"
): Promise<{ items: StatItem[]; backendUnavailable: boolean }> {
  for (const url of urls) {
    const { data, error } = await apiGet<StatsResponseShape>(url)
    console.log("[stats]", url, "→ error:", error?.message ?? null, "| data keys:", data ? Object.keys(data as object) : null)
    if (!error && data !== null) {
      const items = normalizeStatsArray(data, legacyKey)
      console.log("[stats]", url, "→ normalizedItems.length:", items.length, "| sample:", items.slice(0, 2))
      if (items.length > 0) return { items, backendUnavailable: false }
    }
  }
  return { items: [], backendUnavailable: true }
}

/**
 * Build the ordered list of stat URLs to try.
 *
 * WHEN stateSlug is provided (state-specific pages like /states/tx/powerball/stats):
 *   1. /api/stats/{gameSlug}-{stateSlug}/{endpoint}  → e.g. powerball-tx  (PRIMARY)
 *   2. /api/stats/{stateSlug}/{gameSlug}/{endpoint}   → e.g. tx/powerball  (FALLBACK)
 *   NEVER falls back to /api/stats/{gameSlug}/... alone — that could return
 *   generic national data masquerading as state-specific results.
 *
 * WHEN stateSlug is absent (national pages like /games/powerball):
 *   1. /api/stats/{gameSlug}/{endpoint}               → e.g. powerball     (ONLY option)
 *
 * "matchingGames[0].slug" from the API is passed as gameSlug — it is already
 * the correct raw slug (e.g. "powerball", "cash-5", "jackpot-triple-play").
 * The compound form (powerball-tx, cash-5-pa, etc.) is built here.
 */
function buildStatUrls(
  gameSlug: string,
  endpoint: "most-frequent" | "least-frequent",
  days: number,
  top: number,
  stateSlug?: string
): string[] {
  const qs = `?days=${days}&top=${top}`
  const urls: string[] = []

  if (stateSlug) {
    // Primary: compound slug "{gameSlug}-{stateSlug}" (e.g. powerball-tx, cash-5-pa)
    const compound = `${gameSlug}-${stateSlug}`
    urls.push(`/api/stats/${encodeURIComponent(compound)}/${endpoint}${qs}`)

    // Fallback: state-prefixed path /{stateSlug}/{gameSlug}
    urls.push(
      `/api/stats/${encodeURIComponent(stateSlug)}/${encodeURIComponent(gameSlug)}/${endpoint}${qs}`
    )

    // DO NOT add plain /api/stats/{gameSlug}/... here —
    // it would return national/generic data on state-specific routes.
  } else {
    // National pages only — no stateSlug available
    urls.push(`/api/stats/${encodeURIComponent(gameSlug)}/${endpoint}${qs}`)
  }

  return urls
}

export interface StatsResult {
  mostFrequent: StatItem[]
  leastFrequent: StatItem[]
  /** Most frequent bonus ball stats (empty if game has no bonus ball) */
  mostFrequentBonus: StatItem[]
  /** Least frequent bonus ball stats (empty if game has no bonus ball) */
  leastFrequentBonus: StatItem[]
  resolvedSlug: string
  mostUrls: string[]
  leastUrls: string[]
  backendUnavailable: boolean
}

/**
 * Fetch both most and least frequent stats in parallel.
 * Most and Least come from SEPARATE dedicated endpoints — never re-sorted from the same array.
 * Returns empty arrays (never mock data) when the backend is unreachable.
 *
 * Slug resolution examples:
 *   powerball   + tx → powerball-tx
 *   cash-5      + pa → cash-5-pa
 *   mega-millions + de → mega-millions-de
 *   jackpot-triple-play + fl → jackpot-triple-play-fl
 */
/**
 * Build URLs for bonus ball stats.
 * The backend may serve bonus ball stats at endpoints like:
 *   /api/stats/{slug}/most-frequent?type=bonus&days=365&top=10
 *   /api/stats/{slug}/bonus/most-frequent
 *   /api/stats/{slug}/bonus-most-frequent
 */
function buildBonusStatUrls(
  gameSlug: string,
  endpoint: "most-frequent" | "least-frequent",
  days: number,
  top: number,
  stateSlug?: string
): string[] {
  const qs = `?days=${days}&top=${top}`
  const bonusQs = `?days=${days}&top=${top}&type=bonus`
  const urls: string[] = []

  if (stateSlug) {
    const compound = `${gameSlug}-${stateSlug}`
    // Try bonus-type query param first (most likely)
    urls.push(`/api/stats/${encodeURIComponent(compound)}/${endpoint}${bonusQs}`)
    // Try /bonus/ sub-path
    urls.push(`/api/stats/${encodeURIComponent(compound)}/bonus/${endpoint}${qs}`)
    // Fallback state-prefixed
    urls.push(
      `/api/stats/${encodeURIComponent(stateSlug)}/${encodeURIComponent(gameSlug)}/${endpoint}${bonusQs}`
    )
  } else {
    urls.push(`/api/stats/${encodeURIComponent(gameSlug)}/${endpoint}${bonusQs}`)
    urls.push(`/api/stats/${encodeURIComponent(gameSlug)}/bonus/${endpoint}${qs}`)
  }

  return urls
}

export async function getStatsForGame(
  gameSlug: string,
  stateSlug: string,
  days = 365,
  top = 10
): Promise<StatsResult> {
  const resolvedSlug = `${gameSlug}-${stateSlug}`
  const mostUrls = buildStatUrls(gameSlug, "most-frequent", days, top, stateSlug)
  const leastUrls = buildStatUrls(gameSlug, "least-frequent", days, top, stateSlug)
  const mostBonusUrls = buildBonusStatUrls(gameSlug, "most-frequent", days, top, stateSlug)
  const leastBonusUrls = buildBonusStatUrls(gameSlug, "least-frequent", days, top, stateSlug)

  const [mostResult, leastResult, mostBonusResult, leastBonusResult] =
    await Promise.all([
      tryStatUrls(mostUrls, "most_frequent"),
      tryStatUrls(leastUrls, "least_frequent"),
      tryStatUrls(mostBonusUrls, "most_frequent"),
      tryStatUrls(leastBonusUrls, "least_frequent"),
    ])

  // Only surface bonus stats when the backend returned results tagged "bonus"
  // (type=bonus endpoint). If the same data comes back for both endpoints it
  // means the backend doesn't filter by type — discard it to avoid duplication.
  const bonusMostItems = mostBonusResult.items.filter((i) => i.type === "bonus")
  const bonusLeastItems = leastBonusResult.items.filter((i) => i.type === "bonus")

  return {
    mostFrequent: mostResult.items,
    leastFrequent: leastResult.items,
    mostFrequentBonus: bonusMostItems,
    leastFrequentBonus: bonusLeastItems,
    resolvedSlug,
    mostUrls,
    leastUrls,
    backendUnavailable:
      mostResult.backendUnavailable && leastResult.backendUnavailable,
  }
}

/**
 * Fetch most-frequent for national pages (no stateSlug).
 * NOT used on state-specific stat pages.
 */
export async function getMostFrequent(
  gameSlug: string,
  days = 365,
  top = 10
): Promise<StatItem[]> {
  const urls = buildStatUrls(gameSlug, "most-frequent", days, top)
  const { items } = await tryStatUrls(urls, "most_frequent")
  return items
}

/**
 * Fetch least-frequent for national pages (no stateSlug).
 * NOT used on state-specific stat pages.
 */
export async function getLeastFrequent(
  gameSlug: string,
  days = 365,
  top = 10
): Promise<StatItem[]> {
  const urls = buildStatUrls(gameSlug, "least-frequent", days, top)
  const { items } = await tryStatUrls(urls, "least_frequent")
  return items
}
