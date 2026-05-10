import { apiGet } from "./client"
import { normalizeDrawForDisplay } from "./draws"
import type { HistoricalResult, HistoricalGame } from "@/types/api"

interface HistoricalGamesResponse {
  count?: number
  items?: HistoricalGame[]
  data?: HistoricalGame[]
}

interface HistoricalResultsResponse {
  count?: number
  items?: HistoricalResult[]
  data?: HistoricalResult[]
  results?: HistoricalResult[]
}

export async function getHistoricalGames(): Promise<HistoricalGame[]> {
  const { data, error } = await apiGet<HistoricalGame[] | HistoricalGamesResponse>(
    "/api/historical/games"
  )

  if (error || !data) {
    console.error("Failed to fetch historical games:", error?.message)
    return []
  }

  if (Array.isArray(data)) {
    return data
  }

  if (typeof data === "object" && data !== null) {
    if ("items" in data && Array.isArray(data.items)) return data.items
    if ("data" in data && Array.isArray(data.data)) return data.data
  }

  return []
}

export async function getHistoricalResults(
  gameSlug: string,
  startDate: string,
  endDate: string
): Promise<HistoricalResult[]> {
  if (!gameSlug || !startDate || !endDate) {
    console.error("[v0] Missing required parameters for historical results")
    return []
  }

  const { data, error } = await apiGet<HistoricalResult[] | HistoricalResultsResponse>(
    `/api/historical/result?game_slug=${encodeURIComponent(gameSlug)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`
  )

  if (error || !data) {
    console.error(`Failed to fetch historical results for ${gameSlug}:`, error?.message)
    return []
  }

  let results: HistoricalResult[] = []
  if (Array.isArray(data)) {
    results = data
  } else if (typeof data === "object" && data !== null) {
    if ("items" in data && Array.isArray(data.items)) results = data.items
    else if ("data" in data && Array.isArray(data.data)) results = data.data
    else if ("results" in data && Array.isArray(data.results)) results = data.results
  }

  return results.map((result) =>
    normalizeDrawForDisplay(
      {
        ...result,
        draw_status_color: result.draw_status_color ?? "gray",
        main_numbers: result.main_numbers || [],
        bonus_items: result.bonus_items || [],
        extra_items: result.extra_items || [],
      },
      {
        context: "historical",
        stateSlug: result.state_slug,
        gameSlug: result.game_slug || gameSlug,
        gameFamilySlug: gameSlug,
      }
    )
  )
}
