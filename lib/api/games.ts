import { apiGet } from "./client"
import type { Game, HistoricalGame } from "@/types/api"

export async function getGameBySlug(stateSlug: string, gameSlug: string): Promise<Game | null> {
  const { data, error } = await apiGet<Game[]>(`/api/states/${stateSlug}/games`)
  
  if (error || !data) {
    console.error(`Failed to fetch game ${gameSlug}:`, error?.message)
    return null
  }
  
  return data.find((game) => game.slug === gameSlug) || null
}

export async function getHistoricalGames(): Promise<HistoricalGame[]> {
  const { data, error } = await apiGet<HistoricalGame[]>("/api/historical/games")
  
  if (error || !data) {
    console.error("Failed to fetch historical games:", error?.message)
    return []
  }
  
  return data
}
