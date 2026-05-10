import { apiGetCached } from "./client"
import type { State, Game } from "@/types/api"

// API returns { count: number, items: State[] }
interface StatesResponse {
  count?: number
  items?: State[]
  data?: State[]
  states?: State[]
}

function normalizeStatesResponse(data: State[] | StatesResponse): State[] {
  if (Array.isArray(data)) return data
  if (typeof data === "object" && data !== null) {
    if ("items" in data && Array.isArray(data.items)) return data.items
    if ("data" in data && Array.isArray(data.data)) return data.data
    if ("states" in data && Array.isArray(data.states)) return data.states
  }
  return []
}

interface GetStatesOptions {
  /** When true, appends ?include_today_results=true so each state includes
   *  has_today_results and today_results_count from the backend. */
  includeTodayResults?: boolean
}

// Cache states list for 5 minutes (states don't change often)
export async function getStates(options: GetStatesOptions = {}): Promise<State[]> {
  const endpoint = options.includeTodayResults
    ? "/api/states?include_today_results=true"
    : "/api/states"

  const { data, error } = await apiGetCached<State[] | StatesResponse>(endpoint, 300)

  if (error || !data) {
    console.error("Failed to fetch states:", error?.message)
    return []
  }

  return normalizeStatesResponse(data)
}

// API returns { state, count, items: Game[] }
interface GamesResponse {
  count?: number
  items?: Game[]
  data?: Game[]
  games?: Game[]
}

// Cache games list for 5 minutes (games list doesn't change often)
export async function getStateGames(stateSlug: string): Promise<Game[]> {
  const { data, error } = await apiGetCached<Game[] | GamesResponse>(`/api/states/${stateSlug}/games`, 300)

  if (error || !data) {
    console.error(`Failed to fetch games for state ${stateSlug}:`, error?.message)
    return []
  }

  if (Array.isArray(data)) return data

  if (typeof data === "object" && data !== null) {
    if ("items" in data && Array.isArray(data.items)) return data.items
    if ("data" in data && Array.isArray(data.data)) return data.data
    if ("games" in data && Array.isArray(data.games)) return data.games
  }

  console.error("[v0] Unexpected games response structure:", typeof data)
  return []
}

export async function getStateBySlug(stateSlug: string): Promise<State | null> {
  const states = await getStates()
  return states.find((state) => state.slug === stateSlug) || null
}
