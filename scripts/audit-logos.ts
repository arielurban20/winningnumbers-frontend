/**
 * Full logo audit for winningnumbers frontend catalog.
 *
 * Run:
 *   corepack pnpm tsx scripts/audit-logos.ts
 */

import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import { MULTI_STATE_LOGOS } from "../lib/logos/logoRegistry"

const ROOT = process.cwd()
const API_BASE = process.env.LOGO_AUDIT_API_BASE || "https://winningnumbers.us/api"
const LOGO_BASE_URL =
  process.env.NEXT_PUBLIC_LOGO_BASE_URL || "https://winningnumbers.us/assets/logos"
const PUBLIC_LOGOS_DIR = path.join(ROOT, "public", "logos")
const GAME_LOGO_TSX = path.join(ROOT, "components", "cards", "GameLogo.tsx")
const LOGS_DIR = path.join(ROOT, "logs")

const SUMMARY_JSON = path.join(LOGS_DIR, "logo_audit_summary.json")
const SUMMARY_TXT = path.join(LOGS_DIR, "logo_audit_summary.txt")
const MISSING_CSV = path.join(LOGS_DIR, "logo_audit_missing.csv")
const UNUSED_CSV = path.join(LOGS_DIR, "logo_audit_unused_files.csv")
const DUPLICATES_CSV = path.join(LOGS_DIR, "logo_audit_duplicates.csv")

const STATE_ABBREVS = [
  "al",
  "ak",
  "az",
  "ar",
  "ca",
  "co",
  "ct",
  "de",
  "dc",
  "fl",
  "ga",
  "hi",
  "id",
  "il",
  "in",
  "ia",
  "ks",
  "ky",
  "la",
  "me",
  "md",
  "ma",
  "mi",
  "mn",
  "ms",
  "mo",
  "mt",
  "ne",
  "nv",
  "nh",
  "nj",
  "nm",
  "ny",
  "nc",
  "nd",
  "oh",
  "ok",
  "or",
  "pa",
  "pr",
  "ri",
  "sc",
  "sd",
  "tn",
  "tx",
  "ut",
  "vt",
  "va",
  "wa",
  "wv",
  "wi",
  "wy",
  "xx",
]

const SESSION_SUFFIXES = [
  "morning",
  "midday",
  "daytime",
  "day",
  "evening",
  "eve",
  "night",
  "mid",
  "late-night",
  "early-bird",
  "matinee",
  "drive-time",
  "primetime",
  "prime-time",
  "night-owl",
  "lunch-rush",
  "clock-out-cash",
  "midnight-money",
  "morning-buzz",
  "after-hours",
  "coffee-break",
  "lunch-break",
  "rush-hour",
  "brunch",
  "suppertime",
  "afternoon",
  "late-morning",
  "1pm",
  "6pm",
  "9am",
  "10pm",
  "11pm",
  "4pm",
  "7pm",
  "1-50pm",
  "7-50pm",
  "11-30pm",
]

const MULTISTATE_GAMES = [
  "powerball",
  "mega-millions",
  "megamillions",
  "lotto-america",
  "lucky-for-life",
  "cash4life",
  "cash-4-life",
  "2by2",
  "millionaire-for-life",
  "powerball-double-play",
]

type Primitive = string | number | boolean | null | undefined

interface State {
  slug: string
  name: string
}

interface Game {
  slug: string
  name: string
  logo_url?: string
  logo?: string
  source_game_slug?: string
  is_multistate?: boolean
}

interface AuditGame {
  state_slug: string
  state_name: string
  game_slug: string
  game_name: string
  family_slug: string
  logo_url?: string
  logo?: string
  source_game_slug?: string
  is_multistate: boolean
  is_national_virtual: boolean
}

interface ResolutionResult {
  resolved_logo: string | null
  fallback_used: boolean
  expected_logo_key: string
  suggested_filename: string
  used_local_mapping: boolean
  local_mapping_key: string | null
  mapped_path_exists: boolean
}

function normalizeSlug(value: string): string {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

function normalizeGameFamilySlug(gameSlug: string): string {
  let slug = normalizeSlug(gameSlug)
  for (const state of STATE_ABBREVS) {
    const statePattern = new RegExp(`-${state}$`, "i")
    if (statePattern.test(slug)) {
      slug = slug.replace(statePattern, "")
      break
    }
  }
  const sortedSuffixes = [...SESSION_SUFFIXES].sort((a, b) => b.length - a.length)
  for (const suffix of sortedSuffixes) {
    const sessionPattern = new RegExp(`-${suffix}$`, "i")
    if (sessionPattern.test(slug)) {
      slug = slug.replace(sessionPattern, "")
      break
    }
  }
  return slug
}

function stripStateSuffix(slug: string): string {
  return normalizeSlug(slug).replace(/-[a-z]{2}$/i, "")
}

function toCsvValue(value: Primitive): string {
  const raw = value == null ? "" : String(value)
  if (/[",\n]/.test(raw)) return `"${raw.replace(/"/g, "\"\"")}"`
  return raw
}

function writeCsv(filePath: string, headers: string[], rows: Array<Record<string, Primitive>>): Promise<void> {
  const lines = [headers.join(",")]
  for (const row of rows) {
    lines.push(headers.map((h) => toCsvValue(row[h])).join(","))
  }
  return fs.writeFile(filePath, `${lines.join("\n")}\n`, "utf-8")
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`HTTP ${response.status} ${url}`)
  return (await response.json()) as T
}

function extractItems<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    const candidate = payload as Record<string, unknown>
    if (Array.isArray(candidate.items)) return candidate.items as T[]
    if (Array.isArray(candidate.data)) return candidate.data as T[]
    if (Array.isArray(candidate.games)) return candidate.games as T[]
    if (Array.isArray(candidate.states)) return candidate.states as T[]
  }
  return []
}

async function readLocalLogoMap(): Promise<Map<string, string>> {
  const source = await fs.readFile(GAME_LOGO_TSX, "utf-8")
  const start = source.indexOf("const LOCAL_LOGOS")
  if (start === -1) return new Map()

  const openBrace = source.indexOf("{", start)
  if (openBrace === -1) return new Map()

  // Find closing brace of LOCAL_LOGOS object.
  let depth = 0
  let end = -1
  for (let i = openBrace; i < source.length; i++) {
    const ch = source[i]
    if (ch === "{") depth += 1
    if (ch === "}") {
      depth -= 1
      if (depth === 0) {
        end = i
        break
      }
    }
  }
  if (end === -1) return new Map()

  const block = source.slice(openBrace + 1, end)
  const map = new Map<string, string>()
  const entryRegex = /"([^"]+)"\s*:\s*"([^"]+)"/g
  let match: RegExpExecArray | null = null
  while ((match = entryRegex.exec(block))) {
    map.set(match[1], match[2])
  }
  return map
}

async function walkFiles(dir: string): Promise<string[]> {
  const out: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nested = await walkFiles(fullPath)
      out.push(...nested)
    } else if (entry.isFile()) {
      out.push(fullPath)
    }
  }
  return out
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

const urlExistsCache = new Map<string, Promise<boolean>>()

async function remoteUrlExists(url: string): Promise<boolean> {
  const cached = urlExistsCache.get(url)
  if (cached) return cached

  const runner = (async () => {
    try {
      const head = await fetch(url, { method: "HEAD", redirect: "follow" })
      if (head.ok) return true
      if (head.status !== 405 && head.status !== 403) return false
    } catch {
      // try GET fallback below
    }

    try {
      const getResp = await fetch(url, {
        method: "GET",
        headers: { Range: "bytes=0-0" },
        redirect: "follow",
      })
      return getResp.ok || getResp.status === 206
    } catch {
      return false
    }
  })()

  urlExistsCache.set(url, runner)
  return runner
}

function buildRemoteCandidates(
  game: AuditGame,
  stateSlug: string,
  familySlug: string
): string[] {
  const urls: string[] = []
  const seen = new Set<string>()

  const add = (url: string | undefined) => {
    if (!url) return
    const clean = String(url).trim()
    if (!clean || seen.has(clean)) return
    seen.add(clean)
    urls.push(clean)
  }

  add(game.logo_url)
  add(game.logo)

  const rawSlug = normalizeSlug(game.game_slug)
  const sourceSlug = normalizeSlug(game.source_game_slug || "")
  const state = normalizeSlug(stateSlug)

  add(`${LOGO_BASE_URL}/${state}-${rawSlug}.svg`)
  add(`${LOGO_BASE_URL}/${state}-${rawSlug}.png`)
  if (familySlug && familySlug !== rawSlug) {
    add(`${LOGO_BASE_URL}/${state}-${familySlug}.svg`)
    add(`${LOGO_BASE_URL}/${state}-${familySlug}.png`)
  }
  if (sourceSlug) {
    add(`${LOGO_BASE_URL}/${state}-${sourceSlug}.svg`)
    add(`${LOGO_BASE_URL}/${state}-${sourceSlug}.png`)
  }

  add(`${LOGO_BASE_URL}/${familySlug}.svg`)
  add(`${LOGO_BASE_URL}/${familySlug}.png`)
  add(`${LOGO_BASE_URL}/${rawSlug}.svg`)
  add(`${LOGO_BASE_URL}/${rawSlug}.png`)

  if (game.is_multistate) {
    for (const token of MULTISTATE_GAMES) {
      if (rawSlug.includes(token) || familySlug.includes(token)) {
        add(`${LOGO_BASE_URL}/${token}.svg`)
        add(`${LOGO_BASE_URL}/${token}.png`)
      }
    }
  }

  return urls
}

function parseLocalPathToFs(logoPath: string): string | null {
  if (!logoPath.startsWith("/logos/")) return null
  return path.join(ROOT, "public", logoPath.replace(/^\//, ""))
}

async function resolveGameLogo(
  game: AuditGame,
  localMap: Map<string, string>
): Promise<ResolutionResult> {
  const state = normalizeSlug(game.state_slug || "xx")
  const rawSlug = normalizeSlug(game.game_slug)
  const familySlug = normalizeGameFamilySlug(rawSlug)
  const expectedLogoKey = `${state}-${familySlug}`
  const suggestedFilename = `${expectedLogoKey}.svg`

  const keysToTry = [
    `${state}-${familySlug}`,
    `${state}-${rawSlug}`,
    familySlug,
    rawSlug,
  ]

  let mappedPath: string | null = null
  let mappedKey: string | null = null
  for (const key of keysToTry) {
    const value = localMap.get(key)
    if (value) {
      mappedPath = value
      mappedKey = key
      break
    }
  }

  if (mappedPath) {
    const fsPath = parseLocalPathToFs(mappedPath)
    const exists = fsPath ? await fileExists(fsPath) : false
    if (exists) {
      return {
        resolved_logo: mappedPath,
        fallback_used: false,
        expected_logo_key: expectedLogoKey,
        suggested_filename: suggestedFilename,
        used_local_mapping: true,
        local_mapping_key: mappedKey,
        mapped_path_exists: true,
      }
    }
  }

  const remoteCandidates = buildRemoteCandidates(game, state, familySlug)
  let resolvedRemote: string | null = null
  for (const candidate of remoteCandidates) {
    if (candidate.startsWith("/logos/")) {
      const fsPath = parseLocalPathToFs(candidate)
      if (fsPath && (await fileExists(fsPath))) {
        resolvedRemote = candidate
        break
      }
      continue
    }

    // Skip obvious non-URL values.
    if (!/^https?:\/\//i.test(candidate)) continue
    if (await remoteUrlExists(candidate)) {
      resolvedRemote = candidate
      break
    }
  }

  return {
    resolved_logo: resolvedRemote,
    fallback_used: !resolvedRemote,
    expected_logo_key: expectedLogoKey,
    suggested_filename: suggestedFilename,
    used_local_mapping: Boolean(mappedPath),
    local_mapping_key: mappedKey,
    mapped_path_exists: Boolean(mappedPath && mappedPath.startsWith("/logos/")),
  }
}

function normalizedDuplicateBaseName(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase()
  const base = path.basename(fileName, ext).toLowerCase()
  return base
    .replace(/\s*\(copy\)\s*/g, "")
    .replace(/\s*copy\s*$/g, "")
    .replace(/-\d+$/g, "")
    .replace(/\(\d+\)$/g, "")
    .replace(/_copy$/g, "")
}

function extractFamilySlugForStats(gameSlug: string): string {
  const raw = stripStateSuffix(gameSlug)
  return normalizeGameFamilySlug(raw)
}

async function main() {
  await fs.mkdir(LOGS_DIR, { recursive: true })

  const localLogoMap = await readLocalLogoMap()
  const localLogoFilesAbs = await walkFiles(PUBLIC_LOGOS_DIR)
  const localLogoFilesRel = localLogoFilesAbs.map((abs) => {
    const relFromPublic = path.relative(path.join(ROOT, "public"), abs).replace(/\\/g, "/")
    return `/${relFromPublic}`
  })
  const localLogoFileSet = new Set(localLogoFilesRel)

  const statesPayload = await fetchJson<unknown>(`${API_BASE}/states`)
  const states = extractItems<State>(statesPayload)

  const allStateGames: AuditGame[] = []
  const multiStateFromApi = new Map<string, string>()

  for (const state of states) {
    const gamesPayload = await fetchJson<unknown>(`${API_BASE}/states/${state.slug}/games`)
    const games = extractItems<Game>(gamesPayload)
    for (const game of games) {
      const familySlug = extractFamilySlugForStats(game.slug)
      allStateGames.push({
        state_slug: state.slug,
        state_name: state.name,
        game_slug: game.slug,
        game_name: game.name,
        family_slug: familySlug,
        logo_url: game.logo_url,
        logo: game.logo,
        source_game_slug: game.source_game_slug,
        is_multistate: Boolean(game.is_multistate),
        is_national_virtual: false,
      })

      if (game.is_multistate) {
        multiStateFromApi.set(familySlug, game.name)
      }
    }
  }

  const nationalVirtualGames: AuditGame[] = []
  const canonicalNational = new Set<string>([
    ...Object.keys(MULTI_STATE_LOGOS),
    ...Array.from(multiStateFromApi.keys()),
  ])

  for (const familySlug of canonicalNational) {
    nationalVirtualGames.push({
      state_slug: "xx",
      state_name: "National",
      game_slug: familySlug,
      game_name: multiStateFromApi.get(familySlug) || familySlug,
      family_slug: familySlug,
      is_multistate: true,
      is_national_virtual: true,
    })
  }

  const auditGames = [...allStateGames, ...nationalVirtualGames]

  const missingRows: Array<Record<string, Primitive>> = []
  const resolvedRows: Array<
    AuditGame &
      ResolutionResult & {
        mapped_logo_path: string | null
      }
  > = []

  const mappedButMissingFiles: Array<{ key: string; logo_path: string }> = []
  for (const [key, logoPath] of localLogoMap.entries()) {
    if (!logoPath.startsWith("/logos/")) continue
    if (!localLogoFileSet.has(logoPath)) {
      mappedButMissingFiles.push({ key, logo_path: logoPath })
    }
  }

  const usedLocalFiles = new Set<string>()
  const usedMappedKeys = new Set<string>()
  const fallbackRows: typeof resolvedRows = []

  for (const game of auditGames) {
    const result = await resolveGameLogo(game, localLogoMap)
    const mappedPath = result.local_mapping_key ? localLogoMap.get(result.local_mapping_key) || null : null
    if (result.local_mapping_key) usedMappedKeys.add(result.local_mapping_key)
    if (result.resolved_logo?.startsWith("/logos/")) usedLocalFiles.add(result.resolved_logo)

    const merged = {
      ...game,
      ...result,
      mapped_logo_path: mappedPath,
    }
    resolvedRows.push(merged)

    if (result.fallback_used) {
      fallbackRows.push(merged)
      missingRows.push({
        state_slug: game.state_slug,
        state_name: game.state_name,
        game_slug: game.game_slug,
        game_name: game.game_name,
        family_slug: game.family_slug,
        resolved_logo: result.resolved_logo || "",
        fallback_used: "true",
        expected_logo_key: result.expected_logo_key,
        suggested_filename: result.suggested_filename,
      })
    }
  }

  const mappedFileSet = new Set(
    Array.from(localLogoMap.values()).filter((v) => v.startsWith("/logos/"))
  )

  const unusedRows: Array<Record<string, Primitive>> = []
  for (const file of localLogoFilesRel) {
    const mapped = mappedFileSet.has(file)
    const usedByCatalog = usedLocalFiles.has(file)
    if (!mapped || !usedByCatalog) {
      unusedRows.push({
        file_path: file,
        mapped_in_local_registry: mapped ? "true" : "false",
        used_by_any_catalog_game: usedByCatalog ? "true" : "false",
        reason: !mapped
          ? "exists_not_mapped"
          : "mapped_but_not_used_by_current_catalog",
      })
    }
  }

  // Duplicate detection:
  // 1) Name-pattern duplicates (suffix -1/-2/copy variants)
  // 2) Byte-identical file duplicates (same SHA1)
  // 3) National-logo style duplicates (same family suffix across many states)
  const byNormalizedBase = new Map<string, string[]>()
  const byHash = new Map<string, string[]>()
  const byFamilySuffix = new Map<string, string[]>()

  for (const absFile of localLogoFilesAbs) {
    const rel = `/${path.relative(path.join(ROOT, "public"), absFile).replace(/\\/g, "/")}`
    const fileName = path.basename(absFile)
    const ext = path.extname(fileName).toLowerCase()
    const base = path.basename(fileName, ext)

    const normalizedBase = normalizedDuplicateBaseName(fileName)
    const baseBucket = byNormalizedBase.get(normalizedBase) || []
    baseBucket.push(rel)
    byNormalizedBase.set(normalizedBase, baseBucket)

    const buffer = await fs.readFile(absFile)
    const sha1 = crypto.createHash("sha1").update(buffer).digest("hex")
    const hashBucket = byHash.get(sha1) || []
    hashBucket.push(rel)
    byHash.set(sha1, hashBucket)

    const statePrefixed = base.match(/^([a-z]{2})-(.+)$/i)
    if (statePrefixed) {
      const family = statePrefixed[2]
      const famBucket = byFamilySuffix.get(family) || []
      famBucket.push(rel)
      byFamilySuffix.set(family, famBucket)
    }
  }

  const duplicateRows: Array<Record<string, Primitive>> = []
  for (const [normalizedBase, files] of byNormalizedBase.entries()) {
    if (files.length < 2) continue
    for (const file of files) {
      duplicateRows.push({
        duplicate_type: "name_variant",
        group_key: normalizedBase,
        file_path: file,
        group_size: files.length,
      })
    }
  }

  for (const [hash, files] of byHash.entries()) {
    if (files.length < 2) continue
    for (const file of files) {
      duplicateRows.push({
        duplicate_type: "content_hash",
        group_key: hash,
        file_path: file,
        group_size: files.length,
      })
    }
  }

  const nationalTokens = new Set([
    "powerball",
    "mega-millions",
    "megamillions",
    "lottoamerica",
    "lotto-america",
    "cash4life",
    "lucky-for-life",
    "2by2",
    "millionaireforlife",
    "millionaire-for-life",
  ])
  for (const [familySuffix, files] of byFamilySuffix.entries()) {
    if (files.length < 2) continue
    if (!Array.from(nationalTokens).some((token) => familySuffix.includes(token))) continue
    for (const file of files) {
      duplicateRows.push({
        duplicate_type: "national_family_suffix_across_states",
        group_key: familySuffix,
        file_path: file,
        group_size: files.length,
      })
    }
  }

  const missingByState: Record<string, number> = {}
  const missingByFamily: Record<string, number> = {}
  for (const row of fallbackRows) {
    missingByState[row.state_slug] = (missingByState[row.state_slug] || 0) + 1
    missingByFamily[row.family_slug] = (missingByFamily[row.family_slug] || 0) + 1
  }

  const summary = {
    generated_at: new Date().toISOString(),
    api_base: API_BASE,
    logo_base_url: LOGO_BASE_URL,
    total_states: states.length,
    total_state_games: allStateGames.length,
    total_national_virtual_games: nationalVirtualGames.length,
    total_games_checked: auditGames.length,
    games_with_logo: resolvedRows.filter((r) => !r.fallback_used).length,
    games_missing_logo: fallbackRows.length,
    fallback_logo_count: fallbackRows.length,
    unused_logo_files_count: unusedRows.length,
    duplicate_logo_files_count: duplicateRows.length,
    local_logo_registry_key_count: localLogoMap.size,
    mapped_logo_path_missing_files_count: mappedButMissingFiles.length,
    missing_by_state: Object.fromEntries(
      Object.entries(missingByState).sort((a, b) => b[1] - a[1])
    ),
    missing_by_game_family: Object.fromEntries(
      Object.entries(missingByFamily).sort((a, b) => b[1] - a[1])
    ),
    mapped_logo_path_missing_files: mappedButMissingFiles,
    top_missing_examples: fallbackRows.slice(0, 80).map((r) => ({
      state_slug: r.state_slug,
      game_slug: r.game_slug,
      game_name: r.game_name,
      family_slug: r.family_slug,
      expected_logo_key: r.expected_logo_key,
      suggested_filename: r.suggested_filename,
    })),
  }

  await writeCsv(
    MISSING_CSV,
    [
      "state_slug",
      "state_name",
      "game_slug",
      "game_name",
      "family_slug",
      "resolved_logo",
      "fallback_used",
      "expected_logo_key",
      "suggested_filename",
    ],
    missingRows
  )

  await writeCsv(
    UNUSED_CSV,
    ["file_path", "mapped_in_local_registry", "used_by_any_catalog_game", "reason"],
    unusedRows
  )

  await writeCsv(
    DUPLICATES_CSV,
    ["duplicate_type", "group_key", "file_path", "group_size"],
    duplicateRows
  )

  await fs.writeFile(SUMMARY_JSON, JSON.stringify(summary, null, 2), "utf-8")

  const summaryLines = [
    "WinningNumbers Logo Audit",
    `generated_at=${summary.generated_at}`,
    `api_base=${summary.api_base}`,
    `logo_base_url=${summary.logo_base_url}`,
    "",
    `total_states=${summary.total_states}`,
    `total_state_games=${summary.total_state_games}`,
    `total_national_virtual_games=${summary.total_national_virtual_games}`,
    `total_games_checked=${summary.total_games_checked}`,
    `games_with_logo=${summary.games_with_logo}`,
    `games_missing_logo=${summary.games_missing_logo}`,
    `fallback_logo_count=${summary.fallback_logo_count}`,
    `unused_logo_files_count=${summary.unused_logo_files_count}`,
    `duplicate_logo_files_count=${summary.duplicate_logo_files_count}`,
    `mapped_logo_path_missing_files_count=${summary.mapped_logo_path_missing_files_count}`,
    "",
    "Missing by state:",
    ...Object.entries(summary.missing_by_state).map(([k, v]) => `- ${k}: ${v}`),
    "",
    "Missing by family:",
    ...Object.entries(summary.missing_by_game_family)
      .slice(0, 40)
      .map(([k, v]) => `- ${k}: ${v}`),
    "",
    `summary_json=${SUMMARY_JSON}`,
    `missing_csv=${MISSING_CSV}`,
    `unused_files_csv=${UNUSED_CSV}`,
    `duplicates_csv=${DUPLICATES_CSV}`,
  ]
  await fs.writeFile(SUMMARY_TXT, `${summaryLines.join("\n")}\n`, "utf-8")

  console.log(JSON.stringify({
    total_games_checked: summary.total_games_checked,
    games_with_logo: summary.games_with_logo,
    games_missing_logo: summary.games_missing_logo,
    fallback_logo_count: summary.fallback_logo_count,
    unused_logo_files_count: summary.unused_logo_files_count,
    duplicate_logo_files_count: summary.duplicate_logo_files_count,
    summary_json: SUMMARY_JSON,
    missing_csv: MISSING_CSV,
    unused_csv: UNUSED_CSV,
    duplicates_csv: DUPLICATES_CSV,
    summary_txt: SUMMARY_TXT,
  }))
}

main().catch((error) => {
  console.error("[logo-audit] failed:", error)
  process.exitCode = 1
})
