import { promises as fs } from "node:fs"
import path from "node:path"
import { groupGamesByFamily } from "../lib/utils/groupGames"

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us").replace(/\/+$/, "")
export const API_BASE_URL = (process.env.API_BASE_URL || SITE_URL).replace(/\/+$/, "")
export const LOGS_DIR = path.resolve(process.cwd(), "logs")

export interface StateLite {
  slug: string
  name?: string
}

export interface GameLite {
  slug: string
  name: string
  state_slug?: string
  state_name?: string
  logo_url?: string
  logo?: string
  icon_url?: string
}

export type RouteType =
  | "home"
  | "states_index"
  | "games_index"
  | "national"
  | "legal"
  | "state"
  | "game_family"
  | "session"
  | "historical"
  | "stats"
  | "sitemap_index"
  | "sitemap_child"
  | "robots"
  | "api_internal"

export interface RouteEntry {
  path: string
  url: string
  type: RouteType
  stateSlug?: string
  familySlug?: string
  sessionSlug?: string
  expectedContent: "html" | "xml" | "text" | "json"
  indexableExpected: boolean
}

export interface FetchSnapshot {
  url: string
  status: number
  ok: boolean
  contentType: string
  body: string
  finalUrl: string
  error?: string
}

const JSON_HEADERS = {
  Accept: "application/json",
  "User-Agent": "winningnumbers-seo-audit/1.0",
}

const TEXT_HEADERS = {
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "User-Agent": "winningnumbers-seo-audit/1.0",
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout | null = null
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms: ${label}`)), timeoutMs)
  })
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId)
  }) as Promise<T>
}

export async function fetchJson<T>(url: string, timeoutMs = 20000): Promise<T> {
  const response = await withTimeout(fetch(url, { headers: JSON_HEADERS }), timeoutMs, url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`)
  }
  return response.json() as Promise<T>
}

export async function fetchSnapshot(url: string, timeoutMs = 25000): Promise<FetchSnapshot> {
  try {
    const response = await withTimeout(fetch(url, { headers: TEXT_HEADERS, redirect: "follow" }), timeoutMs, url)
    const contentType = response.headers.get("content-type") || ""
    const body = await response.text()
    return {
      url,
      status: response.status,
      ok: response.ok,
      contentType,
      body,
      finalUrl: response.url,
    }
  } catch (error) {
    return {
      url,
      status: 0,
      ok: false,
      contentType: "",
      body: "",
      finalUrl: url,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export function normalizeArrayResponse<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (!payload || typeof payload !== "object") return []
  const maybe = payload as Record<string, unknown>
  if (Array.isArray(maybe.items)) return maybe.items as T[]
  if (Array.isArray(maybe.data)) return maybe.data as T[]
  if (Array.isArray(maybe.states)) return maybe.states as T[]
  if (Array.isArray(maybe.games)) return maybe.games as T[]
  return []
}

export async function getStatesFromApi(): Promise<StateLite[]> {
  const payload = await fetchJson<unknown>(`${API_BASE_URL}/api/states`)
  return normalizeArrayResponse<StateLite>(payload)
}

export async function getStateGamesFromApi(stateSlug: string): Promise<GameLite[]> {
  const payload = await fetchJson<unknown>(`${API_BASE_URL}/api/states/${stateSlug}/games`)
  return normalizeArrayResponse<GameLite>(payload)
}

export async function mapLimit<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return []
  const results: R[] = new Array(items.length)
  let cursor = 0

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++
      if (index >= items.length) break
      results[index] = await mapper(items[index], index)
    }
  })

  await Promise.all(workers)
  return results
}

export async function ensureLogsDir(): Promise<void> {
  await fs.mkdir(LOGS_DIR, { recursive: true })
}

export function toCsvValue(value: unknown): string {
  const text = String(value ?? "")
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`
  }
  return text
}

export function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const headerLine = headers.map(toCsvValue).join(",")
  const body = rows
    .map((row) => headers.map((header) => toCsvValue(row[header])).join(","))
    .join("\n")
  return `${headerLine}\n${body}\n`
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await ensureLogsDir()
  await fs.writeFile(filePath, content, "utf8")
}

function pushUniqueRoute(routeMap: Map<string, RouteEntry>, route: RouteEntry): void {
  if (!routeMap.has(route.path)) {
    routeMap.set(route.path, route)
  }
}

export async function buildRouteInventory(): Promise<RouteEntry[]> {
  const routes = new Map<string, RouteEntry>()

  const baseRoutes: Array<Omit<RouteEntry, "url">> = [
    { path: "/", type: "home", expectedContent: "html", indexableExpected: true },
    { path: "/states", type: "states_index", expectedContent: "html", indexableExpected: true },
    { path: "/games", type: "games_index", expectedContent: "html", indexableExpected: true },
    { path: "/games/powerball", type: "national", expectedContent: "html", indexableExpected: true },
    { path: "/games/mega-millions", type: "national", expectedContent: "html", indexableExpected: true },
    { path: "/about", type: "legal", expectedContent: "html", indexableExpected: true },
    { path: "/contact", type: "legal", expectedContent: "html", indexableExpected: true },
    { path: "/privacy-policy", type: "legal", expectedContent: "html", indexableExpected: true },
    { path: "/terms", type: "legal", expectedContent: "html", indexableExpected: true },
    { path: "/cookie-policy", type: "legal", expectedContent: "html", indexableExpected: true },
    { path: "/disclaimer", type: "legal", expectedContent: "html", indexableExpected: true },
    { path: "/sitemap.xml", type: "sitemap_index", expectedContent: "xml", indexableExpected: true },
    { path: "/sitemaps/static.xml", type: "sitemap_child", expectedContent: "xml", indexableExpected: true },
    { path: "/sitemaps/states.xml", type: "sitemap_child", expectedContent: "xml", indexableExpected: true },
    { path: "/sitemaps/games.xml", type: "sitemap_child", expectedContent: "xml", indexableExpected: true },
    { path: "/sitemaps/sessions.xml", type: "sitemap_child", expectedContent: "xml", indexableExpected: true },
    { path: "/sitemaps/stats.xml", type: "sitemap_child", expectedContent: "xml", indexableExpected: true },
    { path: "/sitemaps/historical.xml", type: "sitemap_child", expectedContent: "xml", indexableExpected: true },
    { path: "/sitemaps/legal.xml", type: "sitemap_child", expectedContent: "xml", indexableExpected: true },
    { path: "/robots.txt", type: "robots", expectedContent: "text", indexableExpected: true },
    { path: "/api/internal/states", type: "api_internal", expectedContent: "json", indexableExpected: false },
    { path: "/api/internal/historical/games", type: "api_internal", expectedContent: "json", indexableExpected: false },
    { path: "/api/internal/historical/results", type: "api_internal", expectedContent: "json", indexableExpected: false },
  ]

  for (const route of baseRoutes) {
    pushUniqueRoute(routes, { ...route, url: `${SITE_URL}${route.path}` })
  }

  const states = await getStatesFromApi()
  await mapLimit(states, 8, async (state) => {
    const statePath = `/states/${state.slug}`
    pushUniqueRoute(routes, {
      path: statePath,
      url: `${SITE_URL}${statePath}`,
      type: "state",
      stateSlug: state.slug,
      expectedContent: "html",
      indexableExpected: true,
    })

    const games = await getStateGamesFromApi(state.slug)
    const families = groupGamesByFamily(games as never[], undefined, state.slug, state.name || "")

    for (const family of families) {
      const familyPath = `/states/${state.slug}/${family.familySlug}`
      pushUniqueRoute(routes, {
        path: familyPath,
        url: `${SITE_URL}${familyPath}`,
        type: "game_family",
        stateSlug: state.slug,
        familySlug: family.familySlug,
        expectedContent: "html",
        indexableExpected: true,
      })

      const historicalPath = `${familyPath}/historical`
      pushUniqueRoute(routes, {
        path: historicalPath,
        url: `${SITE_URL}${historicalPath}`,
        type: "historical",
        stateSlug: state.slug,
        familySlug: family.familySlug,
        expectedContent: "html",
        indexableExpected: true,
      })

      const statsPath = `${familyPath}/stats`
      pushUniqueRoute(routes, {
        path: statsPath,
        url: `${SITE_URL}${statsPath}`,
        type: "stats",
        stateSlug: state.slug,
        familySlug: family.familySlug,
        expectedContent: "html",
        indexableExpected: true,
      })

      if (family.sessions.length > 1) {
        for (const session of family.sessions) {
          if (!session.sessionDisplaySlug) continue
          const sessionPath = `${familyPath}/${session.sessionDisplaySlug}`
          pushUniqueRoute(routes, {
            path: sessionPath,
            url: `${SITE_URL}${sessionPath}`,
            type: "session",
            stateSlug: state.slug,
            familySlug: family.familySlug,
            sessionSlug: session.sessionDisplaySlug,
            expectedContent: "html",
            indexableExpected: true,
          })
        }
      }
    }
  })

  return Array.from(routes.values()).sort((a, b) => a.path.localeCompare(b.path))
}

export function normalizePath(input: string): string {
  if (!input) return "/"
  const value = input.replace(SITE_URL, "")
  if (!value.startsWith("/")) return `/${value}`
  return value
}

export function removeTrailingSlash(pathname: string): string {
  if (pathname.length <= 1) return pathname
  return pathname.replace(/\/+$/, "")
}

