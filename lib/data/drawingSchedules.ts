import drawingSchedulesJson from "./drawingSchedules.json"

export interface DrawingScheduleDays {
  sun: string | null
  mon: string | null
  tue: string | null
  wed: string | null
  thu: string | null
  fri: string | null
  sat: string | null
}

export interface DrawingScheduleEntry {
  state_slug: string
  state_name: string
  game_name: string
  game_key: string
  family_name: string
  family_key: string
  session_label: string | null
  session_key: string
  days_active: string[]
  draw_time: string | null
  timezone: string | null
  timezone_label: string | null
  days: DrawingScheduleDays
}

interface DrawingScheduleDataset {
  meta: {
    source_file: string
    generated_at: string
    sheet: string
    total_states: number
    total_rows: number
  }
  entries: DrawingScheduleEntry[]
}

interface ScheduleLookupInput {
  stateSlug: string
  familyName: string
  familySlug: string
  sessionName: string
  gameName: string
  gameSlug: string
}

const drawingSchedules = drawingSchedulesJson as DrawingScheduleDataset
const ALL_ENTRIES: DrawingScheduleEntry[] = Array.isArray(drawingSchedules.entries)
  ? drawingSchedules.entries
  : []

const SESSION_ALIAS: Record<string, string[]> = {
  midday: ["midday", "mid day", "mid"],
  evening: ["evening", "eve"],
  night: ["night", "nite", "noche"],
  day: ["day", "dia", "daytime"],
  "prime-time": ["prime-time", "primetime", "prime time"],
  "primetime-pop": ["primetime-pop", "primetime pop"],
  "early-bird": ["early-bird", "early bird"],
  "night-owl": ["night-owl", "night owl"],
  "coffee-break": ["coffee-break", "coffee break"],
  "lunch-break": ["lunch-break", "lunch break"],
  "lunch-rush": ["lunch-rush", "lunch rush"],
  "rush-hour": ["rush-hour", "rush hour"],
  "clock-out-cash": ["clock-out-cash", "clock out cash"],
  "midnight-money": ["midnight-money", "midnight money"],
  "after-hours": ["after-hours", "after hours"],
}

const byState = new Map<string, DrawingScheduleEntry[]>()

for (const entry of ALL_ENTRIES) {
  const stateSlug = String(entry.state_slug || "").trim().toLowerCase()
  if (!stateSlug) continue
  const bucket = byState.get(stateSlug) || []
  bucket.push(entry)
  byState.set(stateSlug, bucket)
}

function normalizeLookupToken(value: string | null | undefined): string {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function normalizeSessionKey(value: string | null | undefined): string {
  return normalizeLookupToken(value).replace(/\s+/g, "-")
}

export function parseScheduleTimeToMinutes(drawTime: string | null | undefined): number | null {
  const value = String(drawTime || "").trim()
  if (!value) return null

  const match = value.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/i)
  if (!match) return null

  let hours = parseInt(match[1], 10)
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  const meridiem = match[3].toLowerCase()

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null

  if (meridiem === "pm" && hours !== 12) hours += 12
  if (meridiem === "am" && hours === 12) hours = 0

  return hours * 60 + minutes
}

function stripStateSuffix(slug: string): string {
  return String(slug || "")
    .toLowerCase()
    .replace(/-[a-z]{2}$/i, "")
}

function isMainSession(sessionName: string): boolean {
  const norm = normalizeLookupToken(sessionName)
  return !norm || norm === "main"
}

function getSessionLookupKeys(sessionName: string): string[] {
  const raw = normalizeSessionKey(sessionName)
  if (!raw || raw === "main") return []
  const keys = new Set<string>([raw])
  for (const [canonical, aliases] of Object.entries(SESSION_ALIAS)) {
    if (aliases.includes(raw) || canonical === raw) {
      keys.add(canonical)
      for (const alias of aliases) keys.add(alias)
    }
  }
  return Array.from(keys)
}

function makeLookupCandidates(input: ScheduleLookupInput): string[] {
  const candidates = new Set<string>()
  const familyFromSlug = stripStateSuffix(input.familySlug).replace(/-/g, " ")
  const gameFromSlug = stripStateSuffix(input.gameSlug).replace(/-/g, " ")
  const sessionKeys = getSessionLookupKeys(input.sessionName)
  const isMain = isMainSession(input.sessionName)

  const add = (value: string) => {
    const norm = normalizeLookupToken(value)
    if (norm) candidates.add(norm)
  }

  add(input.gameName)
  add(gameFromSlug)
  add(input.familyName)
  add(familyFromSlug)

  if (!isMain) {
    add(`${input.familyName} ${input.sessionName}`)
    add(`${familyFromSlug} ${input.sessionName}`)
    add(`${gameFromSlug} ${input.sessionName}`)
    for (const sessionKey of sessionKeys) {
      add(`${input.familyName} ${sessionKey.replace(/-/g, " ")}`)
      add(`${familyFromSlug} ${sessionKey.replace(/-/g, " ")}`)
    }
  }

  return Array.from(candidates)
}

function rankEntry(
  entry: DrawingScheduleEntry,
  candidate: string,
  input: ScheduleLookupInput
): number {
  const entryGame = normalizeLookupToken(entry.game_name)
  const entryFamily = normalizeLookupToken(entry.family_name)
  const entrySession = normalizeSessionKey(entry.session_label)
  const main = isMainSession(input.sessionName)
  const requestedSessions = new Set(getSessionLookupKeys(input.sessionName))

  let score = 0
  if (candidate === entryGame) score += 90
  if (candidate === normalizeLookupToken(input.gameName)) score += 70
  if (entryFamily === normalizeLookupToken(input.familyName)) score += 50

  if (main) {
    if (!entrySession) score += 35
  } else {
    if (entrySession && requestedSessions.has(entrySession)) score += 60
    if (!entrySession) score -= 10
  }

  return score
}

export function getDrawingScheduleForSession(
  input: ScheduleLookupInput
): DrawingScheduleEntry | null {
  const stateSlug = String(input.stateSlug || "").trim().toLowerCase()
  if (!stateSlug) return null

  const entries = byState.get(stateSlug)
  if (!entries || entries.length === 0) return null

  const candidates = makeLookupCandidates(input)
  if (candidates.length === 0) return null

  let best: { entry: DrawingScheduleEntry; score: number } | null = null

  for (const candidate of candidates) {
    for (const entry of entries) {
      const entryGame = normalizeLookupToken(entry.game_name)
      const entryFamily = normalizeLookupToken(entry.family_name)
      if (candidate !== entryGame && candidate !== entryFamily) continue

      const score = rankEntry(entry, candidate, input)
      if (!best || score > best.score) {
        best = { entry, score }
      }
    }
  }

  return best?.entry || null
}

export function getDrawingScheduleDatasetMeta() {
  return drawingSchedules.meta
}
