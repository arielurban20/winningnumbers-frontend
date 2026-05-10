import type { Game, GameFamily, GameSession, DrawResult } from "@/types/api"

// Session words at the end of game names (longest first to avoid partial matches).
const SESSION_WORDS = [
  "After Hours",
  "Coffee Break",
  "Lunch Break",
  "Rush Hour",
  "Early Bird",
  "Night Owl",
  "Drive Time",
  "Prime Time",
  "Late Night",
  "Clock Out",
  "Supper Time",
  "Lunch Time",
  "Dinner Time",
  "Mid Day",
  "Drawing 1",
  "Drawing 2",
  "Session 1",
  "Session 2",
  "Morning Buzz",
  "PrimeTime",
  "Suppertime",
  "Lunchtime",
  "Dinnertime",
  "Daytime",
  "Breakfast",
  "Afternoon",
  "Midnight",
  "Evening",
  "Morning",
  "Midday",
  "Matinee",
  "Brunch",
  "Lunch",
  "Night",
  "Noche",
  "Nite",
  "Day",
  "Dia",
  "Eve",
  "Mid",
  "Early",
  "Late",
]

const TIME_SUFFIX_DISPLAY_PATTERN = /^(\d{1,2})(?::|-)?(\d{2})?\s*([ap]m)$/i

// Slug suffixes that indicate session variants.
// These are stripped ONLY from the end of slug-core to build the family key.
const SESSION_SLUG_SUFFIXES = [
  "morning-buzz",
  "lunch-break",
  "prime-time",
  "night-owl",
  "early-bird",
  "coffee-break",
  "rush-hour",
  "drive-time",
  "late-night",
  "clock-out",
  "session-1",
  "session-2",
  "drawing-1",
  "drawing-2",
  "supper-time",
  "lunch-time",
  "dinner-time",
  "suppertime",
  "lunchtime",
  "dinnertime",
  "daytime",
  "afternoon",
  "midnight",
  "primetime",
  "evening",
  "morning",
  "mid-day",
  "midday",
  "matinee",
  "brunch",
  "breakfast",
  "lunch",
  "night",
  "noche",
  "nite",
  "noon",
  "day",
  "dia",
  "eve",
  "mid",
]

const SESSION_SLUG_SUFFIXES_SORTED = [...SESSION_SLUG_SUFFIXES].sort(
  (a, b) => b.length - a.length
)

const SESSION_LABEL_BY_SLUG: Record<string, string> = {
  "morning-buzz": "Morning Buzz",
  "lunch-break": "Lunch Break",
  "prime-time": "Prime Time",
  "night-owl": "Night Owl",
  "early-bird": "Early Bird",
  "coffee-break": "Coffee Break",
  "rush-hour": "Rush Hour",
  "drive-time": "Drive Time",
  "late-night": "Late Night",
  "clock-out": "Clock Out",
  "session-1": "Session 1",
  "session-2": "Session 2",
  "drawing-1": "Drawing 1",
  "drawing-2": "Drawing 2",
  "supper-time": "Supper Time",
  "lunch-time": "Lunch Time",
  "dinner-time": "Dinner Time",
  suppertime: "Suppertime",
  lunchtime: "Lunchtime",
  dinnertime: "Dinnertime",
  daytime: "Daytime",
  afternoon: "Afternoon",
  midnight: "Midnight",
  primetime: "Prime Time",
  evening: "Evening",
  "mid-day": "Midday",
  midday: "Midday",
  matinee: "Matinee",
  brunch: "Brunch",
  breakfast: "Breakfast",
  lunch: "Lunch",
  morning: "Morning",
  night: "Night",
  nite: "Nite",
  noche: "Noche",
  day: "Day",
  dia: "Dia",
  eve: "Eve",
  mid: "Mid",
  noon: "Noon",
}

const SESSION_SORT_ORDER = [
  "early-bird",
  "morning",
  "coffee-break",
  "breakfast",
  "drive-time",
  "brunch",
  "midday",
  "mid",
  "matinee",
  "lunch",
  "lunch-break",
  "day",
  "daytime",
  "dia",
  "afternoon",
  "clock-out",
  "suppertime",
  "supper-time",
  "dinner-time",
  "dinnertime",
  "eve",
  "evening",
  "prime-time",
  "primetime",
  "rush-hour",
  "night-owl",
  "late-night",
  "night",
  "nite",
  "noche",
  "midnight",
  "session-1",
  "session-2",
  "drawing-1",
  "drawing-2",
  "main",
]

const TIME_PATTERN = /\s+(\d{1,2}:\d{2}\s*[ap]m)$/i
const HOUR_ONLY_TIME_PATTERN = /\s+(\d{1,2}\s*[ap]m)$/i

const SESSION_PATTERN = new RegExp(
  `\\s+(${SESSION_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})$`,
  "i"
)

export interface ParsedGameName {
  familyName: string
  session: string | null
}

function normalize(value?: string | null): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

function normalizeSessionToken(value: string): string {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-+/g, "-")
}

function canonicalizeSessionDisplay(value: string): string {
  const clean = value.trim().replace(/\s+/g, " ")
  if (!clean) return clean

  const timeMatch = clean.match(TIME_SUFFIX_DISPLAY_PATTERN)
  if (timeMatch) {
    const hour = String(parseInt(timeMatch[1], 10))
    const minute = timeMatch[2]
    const meridiem = timeMatch[3].toLowerCase()
    if (minute) {
      return `${hour}:${minute}${meridiem}`
    }
    return `${hour}${meridiem}`
  }

  const token = normalizeSessionToken(clean)
  if (SESSION_LABEL_BY_SLUG[token]) {
    return SESSION_LABEL_BY_SLUG[token]
  }
  return titleCase(clean)
}

function stripStateSuffix(gameSlug: string): string {
  return normalize(gameSlug).replace(/-[a-z]{2}$/i, "")
}

function extractTimeSuffixFromSlugCore(slugCore: string): {
  familySlug: string
  sessionSlug: string
} | null {
  const tokens = slugCore.split("-").filter(Boolean)
  if (tokens.length < 2) return null

  const lastToken = tokens[tokens.length - 1].toLowerCase()

  // Hour-only time suffix: 1pm, 10pm, 12am, etc.
  const hourOnly = lastToken.match(/^(\d{1,2})(am|pm)$/)
  if (hourOnly) {
    const hour = parseInt(hourOnly[1], 10)
    if (hour >= 1 && hour <= 12) {
      const familySlug = tokens.slice(0, -1).join("-")
      if (familySlug) {
        return {
          familySlug,
          sessionSlug: lastToken,
        }
      }
    }
  }

  // Minute form split in slug tokens: 1-50pm, 7-30pm, etc.
  const minuteWithMeridiem = lastToken.match(/^([0-5]\d)(am|pm)$/)
  if (minuteWithMeridiem && tokens.length >= 3) {
    const hourToken = tokens[tokens.length - 2]
    if (/^\d{1,2}$/.test(hourToken)) {
      const hour = parseInt(hourToken, 10)
      if (hour >= 1 && hour <= 12) {
        const familySlug = tokens.slice(0, -2).join("-")
        if (familySlug) {
          return {
            familySlug,
            sessionSlug: `${hour}-${minuteWithMeridiem[1]}${minuteWithMeridiem[2]}`,
          }
        }
      }
    }
  }

  return null
}

function splitFamilyAndSessionFromSlug(gameSlug: string): {
  familySlug: string
  sessionSlug: string | null
} {
  const slugCore = stripStateSuffix(gameSlug)

  const parsedTime = extractTimeSuffixFromSlugCore(slugCore)
  if (parsedTime) {
    return parsedTime
  }

  for (const suffix of SESSION_SLUG_SUFFIXES_SORTED) {
    if (slugCore === suffix) continue
    const marker = `-${suffix}`
    if (slugCore.endsWith(marker)) {
      const familySlug = slugCore.slice(0, -marker.length)
      if (familySlug) {
        return {
          familySlug,
          sessionSlug: suffix,
        }
      }
    }
  }

  return {
    familySlug: slugCore,
    sessionSlug: null,
  }
}

function familyNameFromSlug(familySlug: string): string {
  return titleCase(familySlug.replace(/-/g, " "))
}

/**
 * Parse a game name to extract family/session using name suffixes.
 * Slug-based normalization is applied separately in groupGamesByFamily.
 */
export function parseGameName(gameName: string): ParsedGameName {
  const timeMatch = gameName.match(TIME_PATTERN)
  if (timeMatch) {
    return {
      familyName: gameName.slice(0, timeMatch.index).trim(),
      session: canonicalizeSessionDisplay(timeMatch[1]),
    }
  }

  const hourOnlyTimeMatch = gameName.match(HOUR_ONLY_TIME_PATTERN)
  if (hourOnlyTimeMatch) {
    return {
      familyName: gameName.slice(0, hourOnlyTimeMatch.index).trim(),
      session: canonicalizeSessionDisplay(hourOnlyTimeMatch[1]),
    }
  }

  const sessionMatch = gameName.match(SESSION_PATTERN)
  if (sessionMatch) {
    return {
      familyName: gameName.slice(0, sessionMatch.index).trim(),
      session: canonicalizeSessionDisplay(sessionMatch[1]),
    }
  }

  return {
    familyName: gameName,
    session: null,
  }
}

/**
 * Generate a normalized family slug from name.
 */
export function generateFamilySlug(familyName: string): string {
  return familyName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Generate a URL-safe session slug from session label.
 */
export function generateSessionSlug(sessionName: string): string {
  if (!sessionName || sessionName === "Main") return ""
  return sessionName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/:/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/-+/g, "-")
}

function deriveGroupingMeta(game: Game): {
  familyName: string
  familySlug: string
  sessionName: string | null
} {
  const parsed = parseGameName(game.name)
  const fromSlug = splitFamilyAndSessionFromSlug(game.slug)

  const familySlug = fromSlug.familySlug || generateFamilySlug(parsed.familyName)
  const hasNameSession = parsed.session && parsed.session !== "Main"
  const sessionFromSlug = fromSlug.sessionSlug
    ? canonicalizeSessionDisplay(fromSlug.sessionSlug)
    : null
  const sessionName = hasNameSession ? parsed.session : sessionFromSlug

  let familyName = parsed.familyName

  // If name parser did not strip a session but slug did, fallback to slug-derived family.
  if (!hasNameSession && sessionFromSlug) {
    familyName = familyNameFromSlug(familySlug)
  }

  return {
    familyName,
    familySlug,
    sessionName,
  }
}

export function getFamilySlugForGame(game: Pick<Game, "name" | "slug">): string {
  return deriveGroupingMeta(game as Game).familySlug
}

export function getFamilyNameForGame(game: Pick<Game, "name" | "slug">): string {
  return deriveGroupingMeta(game as Game).familyName
}

function parseTimeToMinutes(timeValue: string): number | null {
  const match = timeValue.toLowerCase().match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  const isPM = match[3] === "pm"
  if (isPM && hours !== 12) hours += 12
  if (!isPM && hours === 12) hours = 0
  return hours * 60 + minutes
}

function sessionSortKey(sessionName: string): string {
  const token = normalizeSessionToken(sessionName)
  if (token === "mid-day") return "midday"
  if (token === "primetime") return "prime-time"
  if (token === "dia") return "dia"
  return token
}

/**
 * Group games by family, combining session variants into one family card.
 */
export function groupGamesByFamily(
  games: Game[],
  drawResults?: Map<string, DrawResult>,
  stateSlug?: string,
  stateName?: string
): GameFamily[] {
  const familyMap = new Map<string, GameFamily>()

  for (const game of games) {
    const grouping = deriveGroupingMeta(game)

    const sessionData: GameSession = {
      sessionName: grouping.sessionName || "Main",
      sessionSlug: game.slug,
      sessionDisplaySlug: generateSessionSlug(grouping.sessionName || ""),
      game,
      latestDraw: drawResults?.get(game.slug),
    }

    if (familyMap.has(grouping.familySlug)) {
      const family = familyMap.get(grouping.familySlug)!
      family.sessions.push(sessionData)

      if (!family.logo_url && game.logo_url) family.logo_url = game.logo_url
      if (!family.logo && game.logo) family.logo = game.logo
      if (!family.icon_url && game.icon_url) family.icon_url = game.icon_url
    } else {
      familyMap.set(grouping.familySlug, {
        familyName: grouping.familyName,
        familySlug: grouping.familySlug,
        sessions: [sessionData],
        state_slug: stateSlug || game.state_slug || "",
        state_name: stateName || game.state_name || "",
        logo_url: game.logo_url,
        logo: game.logo,
        icon_url: game.icon_url,
      })
    }
  }

  for (const family of familyMap.values()) {
    family.sessions.sort((a, b) => {
      const aTime = parseTimeToMinutes(a.sessionName)
      const bTime = parseTimeToMinutes(b.sessionName)
      if (aTime !== null && bTime !== null) return aTime - bTime
      if (aTime !== null) return 1
      if (bTime !== null) return -1

      const aKey = sessionSortKey(a.sessionName)
      const bKey = sessionSortKey(b.sessionName)
      const aIndex = SESSION_SORT_ORDER.findIndex((key) => aKey === key)
      const bIndex = SESSION_SORT_ORDER.findIndex((key) => bKey === key)

      if (aIndex === -1 && bIndex === -1) {
        return a.sessionName.localeCompare(b.sessionName)
      }
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    })
  }

  return Array.from(familyMap.values()).sort((a, b) =>
    a.familyName.localeCompare(b.familyName)
  )
}

/**
 * Find games that belong to a family slug.
 */
export function findGamesByFamilySlug(games: Game[], familySlug: string): Game[] {
  const normalizedTarget = normalize(familySlug)
  return games.filter((game) => deriveGroupingMeta(game).familySlug === normalizedTarget)
}

/**
 * Find a session inside a family.
 */
export function findSessionInFamily(
  family: GameFamily,
  sessionSlug: string
): GameSession | undefined {
  const normalizedInput = sessionSlug.toLowerCase()
  const slugAsToken = normalizeSessionToken(normalizedInput)

  return family.sessions.find((session) => {
    if (session.sessionDisplaySlug === sessionSlug) return true
    if (session.sessionSlug === sessionSlug) return true
    if (session.sessionSlug.toLowerCase() === normalizedInput) return true

    const normalizedSessionSlug = generateSessionSlug(session.sessionName)
    if (normalizedSessionSlug === normalizedInput) return true

    if (sessionSortKey(session.sessionName) === slugAsToken) return true

    return false
  })
}

export function getSessionDisplayName(session: string | null): string {
  if (!session || session === "Main") return ""
  return session
}

export function hasMultipleSessions(family: GameFamily): boolean {
  return family.sessions.length > 1
}

export function buildFamilyUrl(stateSlug: string, familySlug: string): string {
  return `/states/${stateSlug}/${familySlug}`
}

export function buildSessionUrl(
  stateSlug: string,
  familySlug: string,
  sessionSlug: string
): string {
  if (!sessionSlug) return buildFamilyUrl(stateSlug, familySlug)
  return `/states/${stateSlug}/${familySlug}/${sessionSlug}`
}

function countSecondaryDrawings(draw?: DrawResult): number {
  if (!draw) return 0

  let count = 0
  const seen = new Set<string>()

  const remember = (label: string, numbers: string) => {
    const key = `${label}::${numbers}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }

  const addSecondary = (item: DrawResult["secondary_drawing"] | undefined) => {
    if (!item || typeof item !== "object") return
    const label = normalizeSessionToken(String(item.name || item.label || "secondary"))
    const nums = Array.isArray(item.main_numbers)
      ? item.main_numbers.map((n) => String(n)).join(",")
      : ""
    if (remember(label, nums)) count += 1
  }

  addSecondary(draw.secondary_drawing)
  for (const item of draw.secondary_drawings || []) addSecondary(item)

  for (const item of draw.extra_items || []) {
    if (!item || typeof item !== "object") continue
    if (String(item.type || "").toLowerCase() !== "secondary_drawing") continue
    const label = normalizeSessionToken(String(item.name || item.label || "secondary"))
    const nums = Array.isArray(item.main_numbers)
      ? item.main_numbers.map((n) => String(n)).join(",")
      : ""
    if (remember(label, nums)) count += 1
  }

  return count
}

function estimateFamilyCardWeight(family: GameFamily): number {
  const sessionsWithDraw = family.sessions.filter((s) => s.latestDraw)
  const sessionBlocks = Math.max(sessionsWithDraw.length, 1)
  const secondaryBlocks = sessionsWithDraw.reduce(
    (acc, session) => acc + countSecondaryDrawings(session.latestDraw),
    0
  )
  const addOnBadges = sessionsWithDraw.reduce((acc, session) => {
    const draw = session.latestDraw
    if (!draw) return acc
    const items = draw.extra_items || []
    const badgeCount = items.filter((item) => {
      if (!item || typeof item !== "object") return false
      const type = String(item.type || "").toLowerCase()
      const label = String(item.label || item.name || "")
      if (type === "secondary_drawing") return false
      if (label.startsWith("__")) return false
      return true
    }).length
    return acc + badgeCount
  }, 0)
  const familySlug = family.familySlug.toLowerCase()
  const highFrequencyBoost =
    familySlug.includes("cash-pop") || familySlug.includes("keno") ? 8 : 0

  // Session count is the strongest predictor of card height in state grids.
  return sessionBlocks * 100 + secondaryBlocks * 20 + addOnBadges * 5 + highFrequencyBoost
}

/**
 * Desktop-only display ordering helper:
 * short cards first, tall/multi-session cards later.
 *
 * This improves visual balance in state grids without changing URLs/grouping.
 */
export function sortGameFamiliesForDesktopLayout(families: GameFamily[]): GameFamily[] {
  const originalOrder = new Map<string, number>()
  families.forEach((family, idx) => originalOrder.set(family.familySlug, idx))

  return [...families].sort((a, b) => {
    const aWeight = estimateFamilyCardWeight(a)
    const bWeight = estimateFamilyCardWeight(b)
    if (aWeight !== bWeight) return aWeight - bWeight

    const aIdx = originalOrder.get(a.familySlug) ?? 0
    const bIdx = originalOrder.get(b.familySlug) ?? 0
    if (aIdx !== bIdx) return aIdx - bIdx

    return a.familyName.localeCompare(b.familyName)
  })
}
