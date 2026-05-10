import { apiGet, apiGetCached } from "./client"
import { resolveNationalGameResult } from "@/lib/utils/resolveNationalGameResult"
import {
  normalizeDrawForDisplay as normalizeWithVisualRules,
  type DrawDisplayContext,
} from "@/lib/rules/normalizeDrawForDisplay"
import type {
  DrawResult,
  PastDraw,
  HistoricalResult,
  PowerballMegaResponse,
  PowerballMegaAPIResponse,
} from "@/types/api"

interface DrawResultResponse {
  data?: DrawResult
  result?: DrawResult
  item?: DrawResult
}

interface PastDrawsResponse {
  count?: number
  items?: PastDraw[]
  data?: PastDraw[]
  draws?: PastDraw[]
  results?: PastDraw[]
}

interface RecentDrawsResponse {
  count?: number
  items?: DrawResult[]
  data?: DrawResult[]
}

interface NormalizeHints {
  context: DrawDisplayContext
  stateSlug?: string
  gameSlug?: string
  gameFamilySlug?: string
}

function normalizeDraw<T extends DrawResult | PastDraw | HistoricalResult>(
  draw: T,
  hints: NormalizeHints
): T {
  return normalizeWithVisualRules(draw, {
    context: hints.context,
    stateSlug: hints.stateSlug || (draw as DrawResult).state_slug || (draw as DrawResult).state?.slug,
    gameSlug: hints.gameSlug || (draw as DrawResult).game_slug || (draw as DrawResult).game?.slug,
    gameFamilySlug: hints.gameFamilySlug,
  }) as unknown as T
}

function unwrapDrawResult(data: DrawResult | DrawResultResponse): DrawResult | null {
  if (!data || typeof data !== "object") return null

  if ("data" in data && data.data) return data.data
  if ("result" in data && data.result) return data.result
  if ("item" in data && data.item) return data.item
  if ("draw_date" in data) return data as DrawResult

  return null
}

function unwrapPastDraws(data: PastDraw[] | PastDrawsResponse): PastDraw[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== "object") return []

  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.data)) return data.data
  if (Array.isArray(data.draws)) return data.draws
  if (Array.isArray(data.results)) return data.results

  return []
}

function unwrapRecentDraws(data: DrawResult[] | RecentDrawsResponse): DrawResult[] {
  if (Array.isArray(data)) return data
  if (!data || typeof data !== "object") return []

  if (Array.isArray(data.items)) return data.items
  if (Array.isArray(data.data)) return data.data

  return []
}

export function normalizeDrawResult(draw: DrawResult): DrawResult {
  return normalizeDraw(draw, {
    context: "latest",
    stateSlug: draw.state_slug || draw.state?.slug,
    gameSlug: draw.game_slug || draw.game?.slug,
  })
}

export function normalizeDrawForDisplay<T extends DrawResult | PastDraw | HistoricalResult>(
  draw: T,
  options?: {
    context?: DrawDisplayContext
    stateSlug?: string
    gameSlug?: string
    gameFamilySlug?: string
  }
): T {
  return normalizeDraw(draw, {
    context: options?.context || "latest",
    stateSlug: options?.stateSlug,
    gameSlug: options?.gameSlug,
    gameFamilySlug: options?.gameFamilySlug,
  })
}

export async function getDrawResult(
  gameSlug: string,
  stateSlug: string,
  gameFamilySlug?: string
): Promise<DrawResult | null> {
  const { data, error } = await apiGet<DrawResult | DrawResultResponse>(
    `/api/draws/result?game_slug=${encodeURIComponent(gameSlug)}&state_slug=${encodeURIComponent(stateSlug)}`
  )

  if (error || !data) {
    console.error(`Failed to fetch draw result for ${gameSlug}:`, error?.message)
    return null
  }

  const result = unwrapDrawResult(data)
  if (!result) return null

  return normalizeDraw(result, {
    context: "latest",
    stateSlug,
    gameSlug,
    gameFamilySlug,
  })
}

export async function getPast365Draws(
  stateSlug: string,
  gameSlug: string,
  gameFamilySlug?: string
): Promise<PastDraw[]> {
  const { data, error } = await apiGetCached<PastDraw[] | PastDrawsResponse>(
    `/api/draws/past-365?state_slug=${encodeURIComponent(stateSlug)}&game_slug=${encodeURIComponent(gameSlug)}`,
    300
  )

  if (error || !data) {
    console.error(`Failed to fetch past draws for ${gameSlug}:`, error?.message)
    return []
  }

  return unwrapPastDraws(data).map((draw) =>
    normalizeDraw(draw, {
      context: "past",
      stateSlug,
      gameSlug,
      gameFamilySlug,
    })
  )
}

export async function getPast365(
  gameSlug: string,
  stateSlug: string,
  gameFamilySlug?: string
): Promise<PastDraw[]> {
  return getPast365Draws(stateSlug, gameSlug, gameFamilySlug)
}

export async function getPast365National(gameSlug: string): Promise<PastDraw[]> {
  let { data, error } = await apiGetCached<PastDraw[] | PastDrawsResponse>(
    `/api/draws/past-365?game_slug=${encodeURIComponent(gameSlug)}`,
    300
  )

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    const resolution = await resolveNationalGameResult(gameSlug)
    if (resolution.stateSlug && resolution.gameSlug) {
      const fallbackResult = await apiGetCached<PastDraw[] | PastDrawsResponse>(
        `/api/draws/past-365?state_slug=${encodeURIComponent(resolution.stateSlug)}&game_slug=${encodeURIComponent(resolution.gameSlug)}`,
        300
      )

      if (!fallbackResult.error && fallbackResult.data) {
        data = fallbackResult.data
        error = fallbackResult.error
      }
    }
  }

  if (error || !data) {
    console.error(`Failed to fetch past draws for national game ${gameSlug}:`, error?.message)
    return []
  }

  return unwrapPastDraws(data).map((draw) =>
    normalizeDraw(draw, {
      context: "past",
      stateSlug: draw.state_slug,
      gameSlug: draw.game_slug || gameSlug,
      gameFamilySlug: gameSlug,
    })
  )
}

export async function getRecentDraws(limit: number = 12): Promise<DrawResult[]> {
  const { data, error } = await apiGetCached<DrawResult[] | RecentDrawsResponse>(
    `/api/draws/recent?limit=${limit}`,
    60
  )

  if (error || !data) {
    return []
  }

  return unwrapRecentDraws(data).map((draw) =>
    normalizeDraw(draw, {
      context: "latest",
      stateSlug: draw.state_slug,
      gameSlug: draw.game_slug,
    })
  )
}

export async function getPowerballMega(): Promise<PowerballMegaResponse> {
  const { data, error } = await apiGetCached<PowerballMegaAPIResponse>("/api/draws/powerball-mega", 60)

  let powerball: DrawResult | undefined
  let megaMillions: DrawResult | undefined

  if (!error && data && Array.isArray(data.items)) {
    const items = data.items || []

    const pbFromApi = items.find((draw) => {
      const slug = draw.game_slug || draw.game?.slug || ""
      const name = draw.game_name || draw.game?.name || ""
      return slug.toLowerCase() === "powerball" || name.toLowerCase() === "powerball"
    })

    if (pbFromApi) {
      powerball = normalizeDraw(pbFromApi, {
        context: "latest",
        stateSlug: pbFromApi.state_slug,
        gameSlug: pbFromApi.game_slug || "powerball",
        gameFamilySlug: "powerball",
      })
    }

    const mmFromApi = items.find((draw) => {
      const slug = draw.game_slug || draw.game?.slug || ""
      const name = draw.game_name || draw.game?.name || ""
      return (
        slug.toLowerCase() === "mega-millions" ||
        slug.toLowerCase() === "mega_millions" ||
        name.toLowerCase().includes("mega millions")
      )
    })

    if (mmFromApi) {
      megaMillions = normalizeDraw(mmFromApi, {
        context: "latest",
        stateSlug: mmFromApi.state_slug,
        gameSlug: mmFromApi.game_slug || "mega-millions",
        gameFamilySlug: "mega-millions",
      })
    }
  }

  if (!powerball) {
    const pbResolution = await resolveNationalGameResult("powerball")
    if (pbResolution.result) {
      powerball = normalizeDraw(pbResolution.result, {
        context: "latest",
        stateSlug: pbResolution.stateSlug || pbResolution.result.state_slug,
        gameSlug: pbResolution.gameSlug || pbResolution.result.game_slug || "powerball",
        gameFamilySlug: "powerball",
      })
    }
  }

  if (!megaMillions) {
    const mmResolution = await resolveNationalGameResult("mega-millions")
    if (mmResolution.result) {
      megaMillions = normalizeDraw(mmResolution.result, {
        context: "latest",
        stateSlug: mmResolution.stateSlug || mmResolution.result.state_slug,
        gameSlug: mmResolution.gameSlug || mmResolution.result.game_slug || "mega-millions",
        gameFamilySlug: "mega-millions",
      })
    }
  }

  return {
    powerball,
    mega_millions: megaMillions,
  }
}
