import { apiGetCached } from "./client"
import type { State, Game } from "@/types/api"
import { cache } from "react"

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

const STATES_DEFAULT_REVALIDATE_SECONDS = 300
const STATES_TODAY_REVALIDATE_SECONDS = 60

// Keep state-level "today/current" indicators fresher than static state inventory.
const getStatesCached = cache(async (includeTodayResults: boolean): Promise<State[]> => {
  const endpoint = includeTodayResults
    ? "/api/states?include_today_results=true"
    : "/api/states"
  const revalidateSeconds = includeTodayResults
    ? STATES_TODAY_REVALIDATE_SECONDS
    : STATES_DEFAULT_REVALIDATE_SECONDS

  const { data, error } = await apiGetCached<State[] | StatesResponse>(endpoint, revalidateSeconds)

  if (error || !data) {
    console.error("Failed to fetch states:", error?.message)
    return []
  }

  return normalizeStatesResponse(data)
})

export async function getStates(options: GetStatesOptions = {}): Promise<State[]> {
  return getStatesCached(Boolean(options.includeTodayResults))
}

// API returns { state, count, items: Game[] }
interface GamesResponse {
  count?: number
  items?: Game[]
  data?: Game[]
  games?: Game[]
}

// Cache games list for 5 minutes (games list doesn't change often)
const getStateGamesCached = cache(async (stateSlug: string): Promise<Game[]> => {
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
})

export async function getStateGames(stateSlug: string): Promise<Game[]> {
  return getStateGamesCached(stateSlug)
}

const getStateBySlugCached = cache(async (stateSlug: string): Promise<State | null> => {
  const states = await getStates()
  return states.find((state) => state.slug === stateSlug) || null
})

export async function getStateBySlug(stateSlug: string): Promise<State | null> {
  return getStateBySlugCached(stateSlug)
}
