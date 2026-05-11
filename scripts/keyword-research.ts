import { promises as fs } from "node:fs"
import path from "node:path"
import * as XLSX from "xlsx"
import {
  LOGS_DIR,
  SITE_URL,
  buildRouteInventory,
  getStatesFromApi,
  normalizePath,
  toCsv,
  writeTextFile,
  type RouteEntry,
  type RouteType,
  type StateLite,
} from "./_auditCommon"

const DATA_DIR = path.resolve(process.cwd(), "data")
const KEYWORD_CSV_PATH = path.resolve(LOGS_DIR, "keyword_research.csv")
const KEYWORD_XLSX_PATH = path.resolve(LOGS_DIR, "keyword_research.xlsx")
const BACKLINK_CSV_PATH = path.resolve(LOGS_DIR, "backlink_priority.csv")
const BACKLINK_XLSX_PATH = path.resolve(LOGS_DIR, "backlink_priority.xlsx")
const SUMMARY_TXT_PATH = path.resolve(LOGS_DIR, "keyword_research_summary.txt")

const SEARCH_CONSOLE_CSV = path.resolve(DATA_DIR, "search-console.csv")
const KEYWORD_PLANNER_CSV = path.resolve(DATA_DIR, "keyword-planner.csv")
const SEARCH_CONSOLE_TEMPLATE_CSV = path.resolve(DATA_DIR, "search-console-template.csv")
const KEYWORD_PLANNER_TEMPLATE_CSV = path.resolve(DATA_DIR, "keyword-planner-template.csv")

const BRAND_NAME = "Winning Numbers"
const BRAND_DOMAIN = "winningnumbers.us"

type SearchIntent = "informational" | "navigational" | "historical" | "stats"
type BacklinkIntent = "commercial/backlink target"
type OpportunityTier = "HIGH" | "MEDIUM" | "LOW"
type BacklinkTier = "Tier 1" | "Tier 2" | "Tier 3"
type CompetitionTier = "HIGH" | "MEDIUM" | "LOW"

type AllowedRouteType =
  | "home"
  | "national"
  | "state"
  | "game_family"
  | "session"
  | "historical"
  | "stats"

interface TargetPage {
  path: string
  type: AllowedRouteType
  stateSlug: string
  stateName: string
  familySlug: string
  gameName: string
  sessionSlug: string
  pageImportance: number
  likelyCompetition: CompetitionTier
}

interface SearchConsoleMetric {
  query: string
  pagePath: string
  clicks: number
  impressions: number
  ctr: number | null
  position: number | null
}

interface SearchConsoleAggregate {
  clicks: number
  impressions: number
  weightedCtrNumerator: number
  weightedCtrDenominator: number
  weightedPositionNumerator: number
  weightedPositionDenominator: number
}

interface KeywordMetrics {
  monthlySearches: string
  monthlySearchesSource: string
  difficulty: string
  difficultySource: string
  cpc: string
  cpcSource: string
  competitionRaw: string
  competitionSource: string
}

interface ContentImprovementRow {
  pagePath: string
  issueType: string
  severity: "HIGH" | "MEDIUM" | "LOW" | "INFO"
  details: string
  recommendation: string
  source: string
}

interface KeywordRow {
  keyword: string
  target_page: string
  page_type: AllowedRouteType
  state_slug: string
  state_name: string
  game_family_slug: string
  game_name: string
  session_slug: string
  primary_intent: SearchIntent
  backlink_intent: BacklinkIntent
  page_importance_score: number
  intent_match_score: number
  competition_tier: CompetitionTier
  competition_score: number
  ranking_opportunity_score: number
  backlink_value_score: number
  priority_score: number
  opportunity_tier: OpportunityTier
  backlink_priority_tier: BacklinkTier
  monthly_searches: string
  difficulty: string
  cpc: string
  metrics_source: string
  gsc_clicks: string
  gsc_impressions: string
  gsc_ctr: string
  gsc_position: string
  ranking_signal: string
  needs_data_fields: string
}

interface PagePriorityRow {
  target_page: string
  page_type: AllowedRouteType
  state_slug: string
  state_name: string
  game_name: string
  page_importance_score: number
  keyword_count: number
  avg_priority_score: number
  best_keyword_score: number
  opportunity_tier_mix: string
  backlink_priority_tier: BacklinkTier
  backlinks_value_score: number
  can_rank_fastest: string
  content_readiness: string
  content_issues: string
  anchor_mix_rule: string
}

interface AnchorPlanRow {
  target_page: string
  page_type: AllowedRouteType
  exact_match_anchors: string
  partial_match_anchors: string
  branded_anchors: string
  url_anchors: string
  generic_safe_anchors: string
  anchor_mix: string
}

interface ImportSummary {
  searchConsoleFound: boolean
  searchConsoleRows: number
  keywordPlannerFound: boolean
  keywordPlannerRows: number
  externalToolsFound: number
  externalRows: number
  externalFiles: string[]
}

const ALLOWED_TYPES = new Set<AllowedRouteType>([
  "home",
  "national",
  "state",
  "game_family",
  "session",
  "historical",
  "stats",
])

const STATE_MARKET_BOOST: Record<string, number> = {
  ca: 8,
  tx: 8,
  fl: 7,
  ny: 7,
  pr: 6,
  nj: 6,
  pa: 6,
  ga: 5,
  oh: 5,
  mi: 5,
  nc: 5,
  il: 5,
  va: 4,
  az: 4,
  ma: 4,
  wa: 4,
  md: 4,
  tn: 3,
  in: 3,
  mo: 3,
}

const FAMILY_BOOST: Record<string, number> = {
  powerball: 8,
  "mega-millions": 8,
  pick3: 5,
  "pick-3": 5,
  pick4: 4,
  "pick-4": 4,
  cash5: 4,
  "cash-5": 4,
  lotto: 4,
  keno: 3,
  jackpot: 3,
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function normalizeKey(value: string): string {
  return normalizeText(value).replace(/\s+/g, " ")
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "")
}

function titleCaseSlug(slug: string): string {
  if (!slug) return ""
  return slug
    .split("-")
    .filter(Boolean)
    .map((token) => (token.length <= 2 ? token.toUpperCase() : `${token[0].toUpperCase()}${token.slice(1)}`))
    .join(" ")
}

function toKeywordGameName(familySlug: string): string {
  if (!familySlug) return ""
  if (familySlug === "mega-millions") return "mega millions"
  return familySlug.replace(/-/g, " ").toLowerCase()
}

function toKeywordStateName(stateName: string, stateSlug: string): string {
  if (stateName) return stateName.toLowerCase()
  return stateSlug.toLowerCase()
}

function cleanPath(value: string): string {
  if (!value) return "/"
  try {
    if (/^https?:\/\//i.test(value)) {
      const url = new URL(value)
      return normalizePath(url.pathname || "/")
    }
  } catch {
    // ignore and normalize raw value
  }
  return normalizePath(value)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function parseNumber(value: string): number | null {
  if (!value) return null
  const numeric = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/)
  if (!numeric) return null
  const parsed = Number.parseFloat(numeric[0])
  return Number.isFinite(parsed) ? parsed : null
}

function parsePercent(value: string): number | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = parseNumber(trimmed)
  if (parsed === null) return null
  if (trimmed.includes("%")) return parsed / 100
  if (parsed > 1) return parsed / 100
  return parsed
}

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "needs data"
  return `${(value * 100).toFixed(2)}%`
}

function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "needs data"
  return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let inQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]
    const nextChar = text[index + 1]

    if (char === "\"") {
      if (inQuotes && nextChar === "\"") {
        cell += "\""
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === "," && !inQuotes) {
      row.push(cell)
      cell = ""
      continue
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1
      }
      row.push(cell)
      cell = ""
      if (row.some((entry) => entry.trim().length > 0)) {
        rows.push(row)
      }
      row = []
      continue
    }

    cell += char
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell)
    if (row.some((entry) => entry.trim().length > 0)) {
      rows.push(row)
    }
  }

  return rows
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function loadCsvRecords(filePath: string): Promise<Array<Record<string, string>>> {
  const exists = await fileExists(filePath)
  if (!exists) return []
  const raw = await fs.readFile(filePath, "utf8")
  const rows = parseCsv(raw)
  if (rows.length === 0) return []

  const header = rows[0].map((value) => normalizeHeader(value))
  const records: Array<Record<string, string>> = []

  for (const values of rows.slice(1)) {
    const record: Record<string, string> = {}
    for (let index = 0; index < header.length; index += 1) {
      const key = header[index]
      if (!key) continue
      record[key] = values[index] ? values[index].trim() : ""
    }
    records.push(record)
  }

  return records
}

function getRecordValue(record: Record<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    const key = normalizeHeader(alias)
    if (record[key] && record[key].trim().length > 0) return record[key].trim()
  }
  return ""
}

function inferRouteTypeFromPath(pathname: string): AllowedRouteType | null {
  if (pathname === "/") return "home"
  if (pathname === "/games/powerball" || pathname === "/games/mega-millions") return "national"

  const parts = pathname.split("/").filter(Boolean)
  if (parts[0] !== "states") return null
  if (parts.length === 2) return "state"
  if (parts.length === 3) return "game_family"
  if (parts.length === 4 && parts[3] === "historical") return "historical"
  if (parts.length === 4 && parts[3] === "stats") return "stats"
  if (parts.length === 4) return "session"
  return null
}

function routeParts(pathname: string): { stateSlug: string; familySlug: string; sessionSlug: string } {
  const parts = pathname.split("/").filter(Boolean)
  if (parts[0] === "games") {
    return {
      stateSlug: "",
      familySlug: parts[1] || "",
      sessionSlug: "",
    }
  }
  if (parts[0] !== "states") {
    return {
      stateSlug: "",
      familySlug: "",
      sessionSlug: "",
    }
  }
  return {
    stateSlug: parts[1] || "",
    familySlug: parts[2] || "",
    sessionSlug: parts[3] || "",
  }
}

function toAllowedRouteType(input: RouteType): AllowedRouteType | null {
  return ALLOWED_TYPES.has(input as AllowedRouteType) ? (input as AllowedRouteType) : null
}

function computeCompetitionTier(type: AllowedRouteType): CompetitionTier {
  if (type === "national" || type === "home") return "HIGH"
  if (type === "state" || type === "game_family") return "MEDIUM"
  return "LOW"
}

function computePageImportance(page: Omit<TargetPage, "pageImportance" | "likelyCompetition">): number {
  const baseByType: Record<AllowedRouteType, number> = {
    home: 72,
    national: 95,
    state: 82,
    game_family: 76,
    session: 68,
    historical: 64,
    stats: 62,
  }

  const stateBoost = STATE_MARKET_BOOST[page.stateSlug] || 0
  const familyBoost = Object.entries(FAMILY_BOOST).reduce((score, [token, boost]) => {
    if (!page.familySlug) return score
    return page.familySlug.includes(token) ? Math.max(score, boost) : score
  }, 0)
  const sessionPenalty = page.type === "session" ? -2 : 0
  return clamp(baseByType[page.type] + stateBoost + familyBoost + sessionPenalty, 35, 100)
}

function competitionTierToScore(tier: CompetitionTier): number {
  if (tier === "LOW") return 82
  if (tier === "MEDIUM") return 62
  return 52
}

function dedupeStrings(values: string[]): string[] {
  const unique = new Set(values.map((entry) => entry.trim()).filter(Boolean))
  return Array.from(unique)
}

function pageToKeywordTemplates(page: TargetPage): string[] {
  const state = toKeywordStateName(page.stateName, page.stateSlug)
  const gameBase = toKeywordGameName(page.familySlug || page.gameName)
  const session = page.sessionSlug ? page.sessionSlug.replace(/-/g, " ").toLowerCase() : ""
  const gameWithSession = session ? `${gameBase} ${session}`.trim() : gameBase

  if (page.type === "home") {
    return dedupeStrings([
      "lottery results today",
      "winning numbers today",
      "state lottery results",
      "powerball results",
      "mega millions results",
    ])
  }

  if (page.type === "national") {
    const game = toKeywordGameName(page.gameName || page.familySlug)
    return dedupeStrings([
      `${game} results`,
      `${game} numbers`,
      `${game} winning numbers`,
      `${game} results today`,
      `${game} past results`,
    ])
  }

  if (page.type === "state") {
    return dedupeStrings([
      `${state} lottery results`,
      `${state} lottery numbers`,
      `${state} winning numbers`,
      `${state} lottery results today`,
      `${state} lottery games`,
      `${state} lottery past results`,
    ])
  }

  if (page.type === "game_family" || page.type === "session") {
    const game = gameWithSession || gameBase
    return dedupeStrings([
      `${game} results`,
      `${game} winning numbers`,
      `${game} numbers today`,
      `${state} ${game} results`,
      `${state} ${game} winning numbers`,
      `${state} ${game} past results`,
    ])
  }

  if (page.type === "historical") {
    const game = gameBase
    return dedupeStrings([
      `${state} ${game} past results`,
      `${state} ${game} historical results`,
      `${state} ${game} results archive`,
      `${game} past winning numbers`,
    ])
  }

  const game = gameBase
  return dedupeStrings([
    `${state} ${game} hot numbers`,
    `${state} ${game} cold numbers`,
    `${game} most frequent numbers`,
    `${game} least frequent numbers`,
  ])
}

function inferPrimaryIntent(page: TargetPage, keyword: string): SearchIntent {
  const normalized = normalizeText(keyword)
  if (page.type === "historical" || /\b(historical|past|archive)\b/.test(normalized)) return "historical"
  if (page.type === "stats" || /\b(hot|cold|frequent|least frequent)\b/.test(normalized)) return "stats"
  if (page.type === "national" && /\b(powerball|mega millions)\b/.test(normalized)) return "navigational"
  return "informational"
}

function expectedCtrForPosition(position: number): number {
  if (position <= 1.5) return 0.27
  if (position <= 2.5) return 0.16
  if (position <= 3.5) return 0.1
  if (position <= 5) return 0.07
  if (position <= 10) return 0.04
  if (position <= 20) return 0.02
  return 0.01
}

function computeRankingOpportunity(metric: SearchConsoleAggregate | undefined): {
  score: number
  signal: string
} {
  if (!metric || metric.impressions <= 0 || metric.weightedPositionDenominator <= 0) {
    return { score: 50, signal: "needs Search Console data" }
  }

  const position = metric.weightedPositionNumerator / metric.weightedPositionDenominator
  const ctr =
    metric.weightedCtrDenominator > 0 ? metric.weightedCtrNumerator / metric.weightedCtrDenominator : 0

  const impressionsScore = clamp(Math.log10(metric.impressions + 1) * 28, 0, 100)
  const positionOpportunity =
    position <= 3 ? 28 : position <= 10 ? 92 : position <= 20 ? 80 : position <= 35 ? 62 : 45
  const ctrGap = clamp((expectedCtrForPosition(position) - ctr) * 1000, 0, 100)
  const score = clamp(impressionsScore * 0.35 + positionOpportunity * 0.4 + ctrGap * 0.25, 0, 100)

  const signalParts = [
    `impressions=${metric.impressions.toLocaleString()}`,
    `position=${position.toFixed(2)}`,
    `ctr=${(ctr * 100).toFixed(2)}%`,
  ]
  if (ctrGap > 0) signalParts.push("ctr_gap=high")
  return { score, signal: signalParts.join(" | ") }
}

function scoreToOpportunityTier(score: number): OpportunityTier {
  if (score >= 73) return "HIGH"
  if (score >= 57) return "MEDIUM"
  return "LOW"
}

function scoreToBacklinkTier(score: number, contentHasHighRisk: boolean): BacklinkTier {
  if (contentHasHighRisk) {
    if (score >= 70) return "Tier 2"
    return "Tier 3"
  }
  if (score >= 76) return "Tier 1"
  if (score >= 58) return "Tier 2"
  return "Tier 3"
}

function summarizeMissingFields(row: KeywordRow): string {
  const missing: string[] = []
  if (row.monthly_searches === "needs data") missing.push("monthly_searches")
  if (row.difficulty === "needs data") missing.push("difficulty")
  if (row.cpc === "needs data") missing.push("cpc")
  if (row.gsc_impressions === "needs data" || row.gsc_position === "needs data") missing.push("search_console")
  return missing.join("|")
}

function makeDefaultKeywordMetrics(): KeywordMetrics {
  return {
    monthlySearches: "needs data",
    monthlySearchesSource: "needs data",
    difficulty: "needs data",
    difficultySource: "needs data",
    cpc: "needs data",
    cpcSource: "needs data",
    competitionRaw: "needs data",
    competitionSource: "needs data",
  }
}

function pickMetricValue(current: string, incoming: string): string {
  if (!incoming || incoming === "needs data") return current
  if (!current || current === "needs data") return incoming
  return current
}

async function ensureDataTemplates(importSummary: ImportSummary): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })

  if (!importSummary.searchConsoleFound) {
    const template = [
      "Query,Page,Clicks,Impressions,CTR,Position",
      "powerball results,https://winningnumbers.us/games/powerball,0,0,0.00%,0",
    ].join("\n")
    await fs.writeFile(SEARCH_CONSOLE_TEMPLATE_CSV, `${template}\n`, "utf8")
  }

  if (!importSummary.keywordPlannerFound) {
    const template = [
      "Keyword,AvgMonthlySearches,Competition,CPC,Difficulty",
      "powerball results,needs data,needs data,needs data,needs data",
    ].join("\n")
    await fs.writeFile(KEYWORD_PLANNER_TEMPLATE_CSV, `${template}\n`, "utf8")
  }
}

async function loadRouteFallbackFromLogs(): Promise<RouteEntry[]> {
  const fallbackPath = path.resolve(LOGS_DIR, "seo_route_status.csv")
  const rows = await loadCsvRecords(fallbackPath)
  if (rows.length === 0) return []

  const routes: RouteEntry[] = []
  for (const row of rows) {
    const pathname = cleanPath(getRecordValue(row, ["path", "url"]))
    const type = inferRouteTypeFromPath(pathname)
    if (!type) continue

    const parsed = routeParts(pathname)
    routes.push({
      path: pathname,
      url: `${SITE_URL}${pathname}`,
      type,
      stateSlug: parsed.stateSlug || undefined,
      familySlug: parsed.familySlug || undefined,
      sessionSlug: parsed.sessionSlug || undefined,
      expectedContent: "html",
      indexableExpected: true,
    })
  }
  return routes
}

async function getStateNameMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  try {
    const states = await getStatesFromApi()
    for (const state of states) {
      const slug = String(state.slug || "").toLowerCase().trim()
      const name = String(state.name || "").trim()
      if (!slug) continue
      map.set(slug, name || slug.toUpperCase())
    }
  } catch {
    // Keep empty map fallback
  }
  return map
}

function buildTargetPage(route: RouteEntry, stateNames: Map<string, string>): TargetPage | null {
  const type = toAllowedRouteType(route.type)
  if (!type) return null

  const { stateSlug, familySlug, sessionSlug } = routeParts(route.path)
  let gameName = ""
  if (type === "national") {
    gameName = route.path.includes("powerball") ? "Powerball" : "Mega Millions"
  } else if (familySlug) {
    gameName = titleCaseSlug(familySlug)
  }

  const stateName = stateSlug ? stateNames.get(stateSlug) || stateSlug.toUpperCase() : ""
  const pageDraft: Omit<TargetPage, "pageImportance" | "likelyCompetition"> = {
    path: route.path,
    type,
    stateSlug,
    stateName,
    familySlug,
    gameName,
    sessionSlug: type === "session" ? sessionSlug : "",
  }

  const page: TargetPage = {
    ...pageDraft,
    pageImportance: computePageImportance(pageDraft),
    likelyCompetition: computeCompetitionTier(type),
  }
  return page
}

async function collectTargetPages(): Promise<TargetPage[]> {
  const stateNames = await getStateNameMap()

  let routes: RouteEntry[] = []
  try {
    routes = await buildRouteInventory()
  } catch {
    routes = []
  }

  if (routes.length === 0) {
    routes = await loadRouteFallbackFromLogs()
  }

  const requiredCorePaths = ["/", "/games/powerball", "/games/mega-millions"]
  for (const requiredPath of requiredCorePaths) {
    if (!routes.some((entry) => entry.path === requiredPath)) {
      const type = inferRouteTypeFromPath(requiredPath)
      if (type) {
        const parsed = routeParts(requiredPath)
        routes.push({
          path: requiredPath,
          url: `${SITE_URL}${requiredPath}`,
          type,
          stateSlug: parsed.stateSlug || undefined,
          familySlug: parsed.familySlug || undefined,
          sessionSlug: parsed.sessionSlug || undefined,
          expectedContent: "html",
          indexableExpected: true,
        })
      }
    }
  }

  const uniquePages = new Map<string, TargetPage>()
  for (const route of routes) {
    const page = buildTargetPage(route, stateNames)
    if (!page) continue
    uniquePages.set(page.path, page)
  }

  return Array.from(uniquePages.values()).sort((a, b) => a.path.localeCompare(b.path))
}

function accumulateSearchConsoleMetric(
  map: Map<string, SearchConsoleAggregate>,
  key: string,
  metric: SearchConsoleMetric
): void {
  if (!key.trim()) return
  const existing = map.get(key) || {
    clicks: 0,
    impressions: 0,
    weightedCtrNumerator: 0,
    weightedCtrDenominator: 0,
    weightedPositionNumerator: 0,
    weightedPositionDenominator: 0,
  }
  existing.clicks += metric.clicks
  existing.impressions += metric.impressions
  if (metric.ctr !== null) {
    const weight = Math.max(metric.impressions, 1)
    existing.weightedCtrNumerator += metric.ctr * weight
    existing.weightedCtrDenominator += weight
  }
  if (metric.position !== null) {
    const weight = Math.max(metric.impressions, 1)
    existing.weightedPositionNumerator += metric.position * weight
    existing.weightedPositionDenominator += weight
  }
  map.set(key, existing)
}

async function loadSearchConsoleData(): Promise<{
  byKeyword: Map<string, SearchConsoleAggregate>
  byKeywordPage: Map<string, SearchConsoleAggregate>
  rowCount: number
  exists: boolean
}> {
  const records = await loadCsvRecords(SEARCH_CONSOLE_CSV)
  const byKeyword = new Map<string, SearchConsoleAggregate>()
  const byKeywordPage = new Map<string, SearchConsoleAggregate>()

  for (const record of records) {
    const query = getRecordValue(record, ["query", "queries", "keyword", "keywords"])
    const rawPage = getRecordValue(record, ["page", "landing page", "landingpage", "url"])
    if (!query) continue

    const metric: SearchConsoleMetric = {
      query,
      pagePath: cleanPath(rawPage || "/"),
      clicks: parseNumber(getRecordValue(record, ["clicks"])) ?? 0,
      impressions: parseNumber(getRecordValue(record, ["impressions"])) ?? 0,
      ctr: parsePercent(getRecordValue(record, ["ctr", "click through rate", "clickthroughrate"])),
      position: parseNumber(getRecordValue(record, ["position", "avg position", "averageposition"])),
    }

    const queryKey = normalizeKey(metric.query)
    const pageKey = cleanPath(metric.pagePath)
    accumulateSearchConsoleMetric(byKeyword, queryKey, metric)
    accumulateSearchConsoleMetric(byKeywordPage, `${queryKey}|${pageKey}`, metric)
  }

  return {
    byKeyword,
    byKeywordPage,
    rowCount: records.length,
    exists: records.length > 0,
  }
}

async function discoverExternalCsvFiles(): Promise<string[]> {
  const exists = await fileExists(DATA_DIR)
  if (!exists) return []
  const entries = await fs.readdir(DATA_DIR, { withFileTypes: true })
  const matches: string[] = []

  for (const entry of entries) {
    if (!entry.isFile()) continue
    const lower = entry.name.toLowerCase()
    if (!lower.endsWith(".csv")) continue
    if (lower === "search-console.csv" || lower === "keyword-planner.csv") continue
    if (lower.endsWith("-template.csv")) continue
    if (/(ahrefs|semrush|dataforseo)/.test(lower)) {
      matches.push(path.resolve(DATA_DIR, entry.name))
    }
  }

  return matches.sort((a, b) => a.localeCompare(b))
}

async function loadKeywordMetrics(): Promise<{
  metricsByKeyword: Map<string, KeywordMetrics>
  plannerRows: number
  plannerExists: boolean
  externalRows: number
  externalFiles: string[]
}> {
  const metricsByKeyword = new Map<string, KeywordMetrics>()
  const plannerRecords = await loadCsvRecords(KEYWORD_PLANNER_CSV)

  for (const record of plannerRecords) {
    const keyword = getRecordValue(record, ["keyword", "query", "search term", "searchterm"])
    if (!keyword) continue
    const key = normalizeKey(keyword)
    const current = metricsByKeyword.get(key) || makeDefaultKeywordMetrics()

    const monthlySearches = getRecordValue(record, [
      "avg monthly searches",
      "avg. monthly searches",
      "avgmonthlysearches",
      "monthly searches",
      "monthlysearches",
      "search volume",
      "searchvolume",
    ])
    const difficulty = getRecordValue(record, ["difficulty", "keyword difficulty", "keyworddifficulty", "kd"])
    const cpc = getRecordValue(record, [
      "cpc",
      "top of page bid (low range)",
      "top of page bid (high range)",
      "topofpagebidlowrange",
      "topofpagebidhighrange",
      "cost per click",
      "costperclick",
    ])
    const competition = getRecordValue(record, ["competition", "competition index", "competitionindex"])

    current.monthlySearches = pickMetricValue(current.monthlySearches, monthlySearches || "needs data")
    current.monthlySearchesSource =
      current.monthlySearches !== "needs data" ? "keyword-planner.csv" : current.monthlySearchesSource
    current.difficulty = pickMetricValue(current.difficulty, difficulty || "needs data")
    current.difficultySource = current.difficulty !== "needs data" ? "keyword-planner.csv" : current.difficultySource
    current.cpc = pickMetricValue(current.cpc, cpc || "needs data")
    current.cpcSource = current.cpc !== "needs data" ? "keyword-planner.csv" : current.cpcSource
    current.competitionRaw = pickMetricValue(current.competitionRaw, competition || "needs data")
    current.competitionSource =
      current.competitionRaw !== "needs data" ? "keyword-planner.csv" : current.competitionSource

    metricsByKeyword.set(key, current)
  }

  const externalFiles = await discoverExternalCsvFiles()
  let externalRows = 0

  for (const csvPath of externalFiles) {
    const records = await loadCsvRecords(csvPath)
    externalRows += records.length
    const sourceName = path.basename(csvPath)

    for (const record of records) {
      const keyword = getRecordValue(record, ["keyword", "query", "search term", "term"])
      if (!keyword) continue
      const key = normalizeKey(keyword)
      const current = metricsByKeyword.get(key) || makeDefaultKeywordMetrics()

      const volume = getRecordValue(record, ["volume", "search volume", "searchvolume", "avg monthly searches"])
      const difficulty = getRecordValue(record, ["difficulty", "keyword difficulty", "keyworddifficulty", "kd"])
      const cpc = getRecordValue(record, ["cpc", "cost per click", "costperclick"])
      const competition = getRecordValue(record, ["competition", "competition index", "competitionindex"])

      if (volume) {
        current.monthlySearches = volume
        current.monthlySearchesSource = sourceName
      }
      if (difficulty) {
        current.difficulty = difficulty
        current.difficultySource = sourceName
      }
      if (cpc) {
        current.cpc = cpc
        current.cpcSource = sourceName
      }
      if (competition) {
        current.competitionRaw = competition
        current.competitionSource = sourceName
      }

      metricsByKeyword.set(key, current)
    }
  }

  return {
    metricsByKeyword,
    plannerRows: plannerRecords.length,
    plannerExists: plannerRecords.length > 0,
    externalRows,
    externalFiles,
  }
}

function aggregateForKeywordPage(
  keyword: string,
  pagePath: string,
  byKeyword: Map<string, SearchConsoleAggregate>,
  byKeywordPage: Map<string, SearchConsoleAggregate>
): SearchConsoleAggregate | undefined {
  const keywordKey = normalizeKey(keyword)
  const pageKey = cleanPath(pagePath)
  return byKeywordPage.get(`${keywordKey}|${pageKey}`) || byKeyword.get(keywordKey)
}

async function loadContentImprovements(): Promise<{
  rows: ContentImprovementRow[]
  highRiskByPage: Map<string, boolean>
}> {
  const rows: ContentImprovementRow[] = []
  const highRiskByPage = new Map<string, boolean>()

  const missingMetadataPath = path.resolve(LOGS_DIR, "seo_missing_metadata.csv")
  const duplicateMetadataPath = path.resolve(LOGS_DIR, "seo_duplicate_metadata.csv")
  const summaryPath = path.resolve(LOGS_DIR, "seo_audit_summary.json")

  const missingRecords = await loadCsvRecords(missingMetadataPath)
  for (const record of missingRecords) {
    const pagePath = cleanPath(getRecordValue(record, ["path", "url"]))
    if (!pagePath || pagePath === "/") continue
    const missingFields = getRecordValue(record, ["missing_fields"]).split("|").filter(Boolean)
    if (missingFields.length === 0) continue

    const hasCritical = missingFields.some((field) =>
      ["title", "meta_description", "canonical"].includes(field.toLowerCase())
    )
    const severity: ContentImprovementRow["severity"] = hasCritical ? "HIGH" : "MEDIUM"
    if (hasCritical) highRiskByPage.set(pagePath, true)

    rows.push({
      pagePath,
      issueType: "missing_metadata",
      severity,
      details: missingFields.join(", "),
      recommendation: "Complete metadata fields before buying backlinks for this page.",
      source: "logs/seo_missing_metadata.csv",
    })
  }

  const duplicateRecords = await loadCsvRecords(duplicateMetadataPath)
  for (const record of duplicateRecords) {
    const duplicateType = getRecordValue(record, ["duplicate_type"]) || "duplicate_metadata"
    const routesRaw = getRecordValue(record, ["routes"])
    if (!routesRaw) continue
    const paths = routesRaw
      .split("|")
      .map((entry) => cleanPath(entry.trim()))
      .filter(Boolean)

    for (const pagePath of paths) {
      rows.push({
        pagePath,
        issueType: duplicateType,
        severity: "MEDIUM",
        details: `Duplicate metadata group: ${getRecordValue(record, ["value"]).slice(0, 120)}`,
        recommendation: "Differentiate titles/descriptions to avoid cannibalization.",
        source: "logs/seo_duplicate_metadata.csv",
      })
    }
  }

  if (await fileExists(summaryPath)) {
    try {
      const parsed = JSON.parse(await fs.readFile(summaryPath, "utf8")) as Record<string, unknown>
      const siteUrl = String(parsed.site_url || "")
      const mediumPriority = (parsed.medium_priority || {}) as Record<string, unknown>

      const titleLengthExamples = Array.isArray(mediumPriority.title_length_examples)
        ? (mediumPriority.title_length_examples as Array<Record<string, unknown>>)
        : []
      for (const item of titleLengthExamples) {
        const pagePath = cleanPath(String(item.path || ""))
        if (!pagePath) continue
        rows.push({
          pagePath,
          issueType: "title_length",
          severity: "MEDIUM",
          details: `Title length ${String(item.length || "needs review")}`,
          recommendation: "Keep title tags roughly between 20 and 70 characters where possible.",
          source: "logs/seo_audit_summary.json",
        })
      }

      const descLengthExamples = Array.isArray(mediumPriority.description_length_examples)
        ? (mediumPriority.description_length_examples as Array<Record<string, unknown>>)
        : []
      for (const item of descLengthExamples) {
        const pagePath = cleanPath(String(item.path || ""))
        if (!pagePath) continue
        rows.push({
          pagePath,
          issueType: "description_length",
          severity: "MEDIUM",
          details: `Description length ${String(item.length || "needs review")}`,
          recommendation: "Keep description tags around 70 to 180 characters.",
          source: "logs/seo_audit_summary.json",
        })
      }

      const criticalBlockers = (parsed.critical_blockers || {}) as Record<string, unknown>
      const canonicalIssues = Array.isArray(criticalBlockers.canonical_invalid_or_mismatch)
        ? (criticalBlockers.canonical_invalid_or_mismatch as Array<Record<string, unknown>>)
        : []
      const localAudit = siteUrl.includes("localhost")
      if (!localAudit) {
        for (const item of canonicalIssues.slice(0, 200)) {
          const pagePath = cleanPath(String(item.path || ""))
          if (!pagePath) continue
          rows.push({
            pagePath,
            issueType: "canonical_review",
            severity: "HIGH",
            details: `Canonical mismatch/invalid domain: ${String(item.canonical || "missing")}`,
            recommendation: "Fix canonical target before active link acquisition.",
            source: "logs/seo_audit_summary.json",
          })
          highRiskByPage.set(pagePath, true)
        }
      }
    } catch {
      // If summary parsing fails, skip.
    }
  }

  return { rows, highRiskByPage }
}

function buildAnchorVariants(page: TargetPage, topKeywords: string[]): AnchorPlanRow {
  const normalizedKeywords = topKeywords.map((keyword) => keyword.toLowerCase())
  const fallbackExact = normalizedKeywords.slice(0, 3)
  const state = toKeywordStateName(page.stateName, page.stateSlug)
  const game = toKeywordGameName(page.familySlug || page.gameName)
  const pageUrl = `https://${BRAND_DOMAIN}${page.path}`

  const exactAnchors = dedupeStrings(
    fallbackExact.length > 0 ? fallbackExact : [`${game || state} winning numbers`.trim(), "lottery results today"]
  )
  const partialAnchors = dedupeStrings([
    `${game || "lottery"} results today`,
    `${state ? `${state} ` : ""}${game || "lottery"} results`,
    `latest ${game || "lottery"} winning numbers`,
    `${state ? `${state} lottery` : "lottery"} past results`,
  ])
  const brandedAnchors = dedupeStrings([
    BRAND_NAME,
    `${BRAND_NAME} ${game || "Lottery Results"}`.trim(),
    `${BRAND_NAME} ${state ? titleCaseSlug(state.replace(/\s+/g, "-")) : "US"} Results`,
  ])
  const urlAnchors = dedupeStrings([pageUrl, `${BRAND_DOMAIN}${page.path}`])
  const genericAnchors = dedupeStrings(["view results", "check numbers", "read more"])

  return {
    target_page: page.path,
    page_type: page.type,
    exact_match_anchors: exactAnchors.join(" | "),
    partial_match_anchors: partialAnchors.join(" | "),
    branded_anchors: brandedAnchors.join(" | "),
    url_anchors: urlAnchors.join(" | "),
    generic_safe_anchors: genericAnchors.join(" | "),
    anchor_mix: "20% exact, 40% partial, 20% branded, 10% URL, 10% generic",
  }
}

function toRecordArray<T extends object>(rows: T[]): Record<string, unknown>[] {
  return rows as unknown as Record<string, unknown>[]
}

function writeWorkbook(
  filePath: string,
  sheets: Array<{ name: string; rows: Array<Record<string, unknown>> }>
): string {
  const workbook = XLSX.utils.book_new()
  for (const sheet of sheets) {
    const data = sheet.rows.length > 0 ? sheet.rows : [{ status: "no_data" }]
    const worksheet = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  }
  try {
    XLSX.writeFile(workbook, filePath)
    return filePath
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code !== "EBUSY" && code !== "EPERM") {
      throw error
    }

    const ext = path.extname(filePath)
    const base = filePath.slice(0, filePath.length - ext.length)
    const fallback = `${base}.${Date.now()}${ext}`
    XLSX.writeFile(workbook, fallback)
    console.warn(`[keyword-research] Workbook locked, wrote fallback file: ${fallback}`)
    return fallback
  }
}

function summarizeOpportunityMix(rows: KeywordRow[]): string {
  const counts = rows.reduce(
    (acc, row) => {
      acc[row.opportunity_tier] += 1
      return acc
    },
    { HIGH: 0, MEDIUM: 0, LOW: 0 } as Record<OpportunityTier, number>
  )
  return `HIGH:${counts.HIGH} | MEDIUM:${counts.MEDIUM} | LOW:${counts.LOW}`
}

async function main(): Promise<void> {
  console.log("[keyword-research] Collecting target pages from routes/sitemaps...")
  const targetPages = await collectTargetPages()
  console.log(`[keyword-research] Target pages collected: ${targetPages.length}`)

  const searchConsole = await loadSearchConsoleData()
  const metricsData = await loadKeywordMetrics()
  const contentImprovements = await loadContentImprovements()

  const importSummary: ImportSummary = {
    searchConsoleFound: searchConsole.exists,
    searchConsoleRows: searchConsole.rowCount,
    keywordPlannerFound: metricsData.plannerExists,
    keywordPlannerRows: metricsData.plannerRows,
    externalToolsFound: metricsData.externalFiles.length,
    externalRows: metricsData.externalRows,
    externalFiles: metricsData.externalFiles.map((file) => path.basename(file)),
  }

  await ensureDataTemplates(importSummary)

  const keywordRows: KeywordRow[] = []
  const keywordCounter = new Map<string, number>()
  const keywordsByPage = new Map<string, string[]>()

  for (const page of targetPages) {
    const keywordIdeas = pageToKeywordTemplates(page)
    keywordsByPage.set(page.path, keywordIdeas)

    for (const keyword of keywordIdeas) {
      const metric = aggregateForKeywordPage(
        keyword,
        page.path,
        searchConsole.byKeyword,
        searchConsole.byKeywordPage
      )
      const ranking = computeRankingOpportunity(metric)
      const keywordData = metricsData.metricsByKeyword.get(normalizeKey(keyword)) || makeDefaultKeywordMetrics()
      const intent = inferPrimaryIntent(page, keyword)
      const intentMatchScore = 92
      const competitionScore = competitionTierToScore(page.likelyCompetition)
      const backlinkValueScore = clamp(page.pageImportance * 0.7 + (100 - competitionScore) * 0.3, 0, 100)

      const priorityScore = clamp(
        page.pageImportance * 0.3 +
          intentMatchScore * 0.2 +
          competitionScore * 0.15 +
          ranking.score * 0.2 +
          backlinkValueScore * 0.15,
        0,
        100
      )

      const opportunityTier = scoreToOpportunityTier(priorityScore)
      const pageHasHighRisk = contentImprovements.highRiskByPage.get(page.path) === true
      const backlinkTier = scoreToBacklinkTier(priorityScore, pageHasHighRisk)

      const position =
        metric && metric.weightedPositionDenominator > 0
          ? metric.weightedPositionNumerator / metric.weightedPositionDenominator
          : null
      const ctr =
        metric && metric.weightedCtrDenominator > 0
          ? metric.weightedCtrNumerator / metric.weightedCtrDenominator
          : null
      const clicks = metric ? metric.clicks : null
      const impressions = metric ? metric.impressions : null

      const metricsSource = [
        keywordData.monthlySearchesSource,
        keywordData.difficultySource,
        keywordData.cpcSource,
      ]
        .filter((entry) => entry !== "needs data")
        .join("|")

      const row: KeywordRow = {
        keyword,
        target_page: page.path,
        page_type: page.type,
        state_slug: page.stateSlug,
        state_name: page.stateName,
        game_family_slug: page.familySlug,
        game_name: page.gameName,
        session_slug: page.sessionSlug,
        primary_intent: intent,
        backlink_intent: "commercial/backlink target",
        page_importance_score: Number(page.pageImportance.toFixed(2)),
        intent_match_score: intentMatchScore,
        competition_tier: page.likelyCompetition,
        competition_score: Number(competitionScore.toFixed(2)),
        ranking_opportunity_score: Number(ranking.score.toFixed(2)),
        backlink_value_score: Number(backlinkValueScore.toFixed(2)),
        priority_score: Number(priorityScore.toFixed(2)),
        opportunity_tier: opportunityTier,
        backlink_priority_tier: backlinkTier,
        monthly_searches: keywordData.monthlySearches || "needs data",
        difficulty: keywordData.difficulty || "needs data",
        cpc: keywordData.cpc || "needs data",
        metrics_source: metricsSource || "needs data",
        gsc_clicks: clicks === null ? "needs data" : Math.round(clicks).toString(),
        gsc_impressions: impressions === null ? "needs data" : Math.round(impressions).toString(),
        gsc_ctr: formatPercent(ctr),
        gsc_position: formatNumber(position),
        ranking_signal: ranking.signal,
        needs_data_fields: "",
      }
      row.needs_data_fields = summarizeMissingFields(row)
      keywordRows.push(row)

      const counterKey = normalizeKey(keyword)
      keywordCounter.set(counterKey, (keywordCounter.get(counterKey) || 0) + 1)
    }
  }

  const keywordRowsSorted = [...keywordRows].sort((a, b) => {
    if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score
    if (b.page_importance_score !== a.page_importance_score) return b.page_importance_score - a.page_importance_score
    return a.keyword.localeCompare(b.keyword)
  })

  const pagePriorityRows: PagePriorityRow[] = []
  const anchorPlanRows: AnchorPlanRow[] = []
  const pageRowsByPath = new Map<string, KeywordRow[]>()
  for (const row of keywordRows) {
    if (!pageRowsByPath.has(row.target_page)) pageRowsByPath.set(row.target_page, [])
    pageRowsByPath.get(row.target_page)!.push(row)
  }

  for (const page of targetPages) {
    const rows = pageRowsByPath.get(page.path) || []
    if (rows.length === 0) continue

    const avgPriority = rows.reduce((acc, row) => acc + row.priority_score, 0) / rows.length
    const bestKeywordScore = rows.reduce((acc, row) => Math.max(acc, row.priority_score), 0)
    const pageHasHighRisk = contentImprovements.highRiskByPage.get(page.path) === true
    const backlinksValueScore = rows.reduce((acc, row) => acc + row.backlink_value_score, 0) / rows.length
    const fastestSignalScore = rows.reduce((acc, row) => acc + row.competition_score + row.ranking_opportunity_score, 0) / rows.length
    const backlinkTier = scoreToBacklinkTier(avgPriority, pageHasHighRisk)
    const canRankFastest =
      (page.type === "game_family" || page.type === "historical" || page.type === "stats" || page.type === "session") &&
      fastestSignalScore >= 130
        ? "YES"
        : "NO"

    const issues = contentImprovements.rows
      .filter((item) => item.pagePath === page.path)
      .map((item) => `${item.issueType}(${item.severity})`)

    pagePriorityRows.push({
      target_page: page.path,
      page_type: page.type,
      state_slug: page.stateSlug,
      state_name: page.stateName,
      game_name: page.gameName,
      page_importance_score: Number(page.pageImportance.toFixed(2)),
      keyword_count: rows.length,
      avg_priority_score: Number(avgPriority.toFixed(2)),
      best_keyword_score: Number(bestKeywordScore.toFixed(2)),
      opportunity_tier_mix: summarizeOpportunityMix(rows),
      backlink_priority_tier: backlinkTier,
      backlinks_value_score: Number(backlinksValueScore.toFixed(2)),
      can_rank_fastest: canRankFastest,
      content_readiness: pageHasHighRisk ? "NEEDS_FIXES" : "READY",
      content_issues: issues.length > 0 ? issues.join(" | ") : "none_detected",
      anchor_mix_rule: "20% exact | 40% partial | 20% branded | 10% URL | 10% generic",
    })

    const pageTopKeywords = rows
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 4)
      .map((row) => row.keyword)
    anchorPlanRows.push(buildAnchorVariants(page, pageTopKeywords))
  }

  const pagePrioritySorted = [...pagePriorityRows].sort((a, b) => {
    const tierOrder: Record<BacklinkTier, number> = { "Tier 1": 3, "Tier 2": 2, "Tier 3": 1 }
    if (tierOrder[b.backlink_priority_tier] !== tierOrder[a.backlink_priority_tier]) {
      return tierOrder[b.backlink_priority_tier] - tierOrder[a.backlink_priority_tier]
    }
    if (b.avg_priority_score !== a.avg_priority_score) return b.avg_priority_score - a.avg_priority_score
    return a.target_page.localeCompare(b.target_page)
  })

  const topKeywords50 = keywordRowsSorted.slice(0, 50)
  const topPages20 = pagePrioritySorted.slice(0, 20)

  const keywordsNeedingVolume = keywordRows.filter((row) => row.monthly_searches === "needs data").length
  const keywordsNeedingDifficulty = keywordRows.filter((row) => row.difficulty === "needs data").length
  const keywordsNeedingCpc = keywordRows.filter((row) => row.cpc === "needs data").length
  const keywordsWithGsc = keywordRows.filter((row) => row.gsc_impressions !== "needs data").length

  const missingDataRows: Array<Record<string, unknown>> = [
    {
      category: "Search Console",
      field: "query/page performance",
      status: importSummary.searchConsoleFound ? "loaded" : "needs data",
      file_path: importSummary.searchConsoleFound ? SEARCH_CONSOLE_CSV : SEARCH_CONSOLE_TEMPLATE_CSV,
      notes: importSummary.searchConsoleFound
        ? `Rows loaded: ${importSummary.searchConsoleRows}`
        : "Import Google Search Console export to unlock ranking/CTR opportunities.",
    },
    {
      category: "Keyword Planner",
      field: "monthly_searches",
      status: importSummary.keywordPlannerFound ? "loaded" : "needs data",
      file_path: importSummary.keywordPlannerFound ? KEYWORD_PLANNER_CSV : KEYWORD_PLANNER_TEMPLATE_CSV,
      notes: importSummary.keywordPlannerFound
        ? `Rows loaded: ${importSummary.keywordPlannerRows}`
        : "Import Keyword Planner export for actual monthly search estimates.",
    },
    {
      category: "Keyword Difficulty",
      field: "difficulty",
      status: keywordsNeedingDifficulty > 0 ? "needs data" : "loaded",
      file_path: "data/(ahrefs|semrush|dataforseo).csv",
      notes: `Keywords still missing difficulty: ${keywordsNeedingDifficulty}`,
    },
    {
      category: "CPC",
      field: "cpc",
      status: keywordsNeedingCpc > 0 ? "needs data" : "loaded",
      file_path: "data/keyword-planner.csv or third-party CSV",
      notes: `Keywords still missing CPC: ${keywordsNeedingCpc}`,
    },
    {
      category: "External SEO Tools",
      field: "volume/difficulty/cpc enrichment",
      status: importSummary.externalToolsFound > 0 ? "loaded" : "needs data",
      file_path:
        importSummary.externalToolsFound > 0
          ? importSummary.externalFiles.join(", ")
          : "data/ahrefs.csv or data/semrush.csv or data/dataforseo.csv",
      notes:
        importSummary.externalToolsFound > 0
          ? `External rows loaded: ${importSummary.externalRows}`
          : "Optional but recommended for real volume + keyword difficulty.",
    },
  ]

  const summaryRows: Array<Record<string, unknown>> = [
    { metric: "generated_at", value: new Date().toISOString() },
    { metric: "site_url", value: SITE_URL },
    { metric: "target_pages", value: targetPages.length },
    { metric: "keywords_generated", value: keywordRows.length },
    { metric: "unique_keywords", value: keywordCounter.size },
    { metric: "tier_1_pages", value: pagePriorityRows.filter((row) => row.backlink_priority_tier === "Tier 1").length },
    { metric: "tier_2_pages", value: pagePriorityRows.filter((row) => row.backlink_priority_tier === "Tier 2").length },
    { metric: "tier_3_pages", value: pagePriorityRows.filter((row) => row.backlink_priority_tier === "Tier 3").length },
    { metric: "keywords_with_search_console_data", value: keywordsWithGsc },
    { metric: "keywords_needing_monthly_searches", value: keywordsNeedingVolume },
    { metric: "keywords_needing_difficulty", value: keywordsNeedingDifficulty },
    { metric: "keywords_needing_cpc", value: keywordsNeedingCpc },
    {
      metric: "search_console_csv",
      value: importSummary.searchConsoleFound ? `loaded (${importSummary.searchConsoleRows} rows)` : "needs data",
    },
    {
      metric: "keyword_planner_csv",
      value: importSummary.keywordPlannerFound ? `loaded (${importSummary.keywordPlannerRows} rows)` : "needs data",
    },
    {
      metric: "external_csv_files",
      value:
        importSummary.externalToolsFound > 0
          ? importSummary.externalFiles.join(", ")
          : "needs data",
    },
  ]

  await writeTextFile(
    KEYWORD_CSV_PATH,
    toCsv(Object.keys(keywordRowsSorted[0] || { status: "" }), toRecordArray(keywordRowsSorted))
  )
  await writeTextFile(
    BACKLINK_CSV_PATH,
    toCsv(Object.keys(pagePrioritySorted[0] || { status: "" }), toRecordArray(pagePrioritySorted))
  )

  const topKeywordsSheet = topKeywords50.map((row, index) => ({
    rank: index + 1,
    keyword: row.keyword,
    target_page: row.target_page,
    priority_score: row.priority_score,
    opportunity_tier: row.opportunity_tier,
    backlink_priority_tier: row.backlink_priority_tier,
    monthly_searches: row.monthly_searches,
    difficulty: row.difficulty,
    gsc_impressions: row.gsc_impressions,
    gsc_position: row.gsc_position,
    needs_data_fields: row.needs_data_fields,
  }))

  const topPagesSheet = topPages20.map((row, index) => ({
    rank: index + 1,
    ...row,
  }))

  const contentImprovementsSheet = contentImprovements.rows.map((row) => ({
    page_path: row.pagePath,
    issue_type: row.issueType,
    severity: row.severity,
    details: row.details,
    recommendation: row.recommendation,
    source: row.source,
  }))

  const sheets = [
    { name: "Summary", rows: summaryRows },
    { name: "Top Keywords", rows: topKeywordsSheet },
    { name: "Backlink Priorities", rows: toRecordArray(pagePrioritySorted) },
    { name: "Pages to Target", rows: topPagesSheet },
    { name: "Anchor Text Plan", rows: toRecordArray(anchorPlanRows) },
    { name: "Content Improvements", rows: contentImprovementsSheet },
    { name: "Missing Data Needed", rows: missingDataRows },
  ]

  const keywordWorkbookPath = writeWorkbook(KEYWORD_XLSX_PATH, sheets)
  const backlinkWorkbookPath = writeWorkbook(BACKLINK_XLSX_PATH, sheets)

  const summaryTextLines = [
    "KEYWORD RESEARCH + BACKLINK PRIORITY SUMMARY",
    `Generated: ${new Date().toISOString()}`,
    `Site: ${SITE_URL}`,
    "",
    `Target pages: ${targetPages.length}`,
    `Keywords generated: ${keywordRows.length}`,
    `Unique keywords: ${keywordCounter.size}`,
    "",
    "Data imports:",
    `- Search Console CSV: ${importSummary.searchConsoleFound ? `loaded (${importSummary.searchConsoleRows} rows)` : "missing (template created)"}`,
    `- Keyword Planner CSV: ${importSummary.keywordPlannerFound ? `loaded (${importSummary.keywordPlannerRows} rows)` : "missing (template created)"}`,
    `- External SEO CSVs (Ahrefs/Semrush/DataForSEO): ${importSummary.externalToolsFound > 0 ? `${importSummary.externalToolsFound} file(s), ${importSummary.externalRows} rows` : "none found"}`,
    "",
    "Top 20 backlink target pages:",
    ...topPages20.map(
      (row, index) =>
        `${index + 1}. ${row.target_page} | ${row.backlink_priority_tier} | avg_score=${row.avg_priority_score} | readiness=${row.content_readiness}`
    ),
    "",
    "Top 50 keyword opportunities:",
    ...topKeywords50.map(
      (row, index) =>
        `${index + 1}. ${row.keyword} -> ${row.target_page} | score=${row.priority_score} | tier=${row.opportunity_tier} | backlinks=${row.backlink_priority_tier}`
    ),
    "",
    "Data still needed:",
    `- Keywords missing monthly_searches: ${keywordsNeedingVolume}`,
    `- Keywords missing difficulty: ${keywordsNeedingDifficulty}`,
    `- Keywords missing cpc: ${keywordsNeedingCpc}`,
    `- Keywords with Search Console metrics: ${keywordsWithGsc}/${keywordRows.length}`,
  ]

  summaryTextLines.push("")
  summaryTextLines.push(`Keyword workbook path: ${keywordWorkbookPath}`)
  summaryTextLines.push(`Backlink workbook path: ${backlinkWorkbookPath}`)

  await writeTextFile(SUMMARY_TXT_PATH, `${summaryTextLines.join("\n")}\n`)

  console.log(`[keyword-research] Wrote ${KEYWORD_CSV_PATH}`)
  console.log(`[keyword-research] Wrote ${KEYWORD_XLSX_PATH}`)
  console.log(`[keyword-research] Wrote ${BACKLINK_CSV_PATH}`)
  console.log(`[keyword-research] Wrote ${BACKLINK_XLSX_PATH}`)
  console.log(`[keyword-research] Wrote ${SUMMARY_TXT_PATH}`)
}

main().catch((error) => {
  console.error("[keyword-research] Failed:", error)
  process.exitCode = 1
})
