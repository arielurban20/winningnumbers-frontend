import type { ExtraItem, BonusItem, MainItem } from "@/types/api"

/**
 * Labels that indicate a secondary drawing (not just a multiplier)
 * These contain multiple numbers that should be rendered as balls, not badges
 */
const SECONDARY_DRAWING_LABELS = [
  "double play drawing",
  "double play",
  "second chance drawing",
  "extra drawing",
  "bonus drawing",
  "second draw",
  "add-on drawing",
  "doubleplay",
  "double-play",
  // Colorado Lotto+ and similar "+PLUS" second draws
  "plus drawing",
  "+plus drawing",
  "plus draw",
  "lotto+ plus",
]

/**
 * Labels that should be converted from extra_items to bonus_items.
 * These are single add-on numbers that should render as bonus balls, NOT text badges.
 *
 * Fireball, Wild Ball, Super Ball: add-on draw numbers — render as colored ball inline.
 * Bullseye, Cash Ball, Bonus Ball: true bonus balls — render after "+" separator.
 */
const BONUS_BALL_LABELS = [
  // Add-on number balls (single extra draw number)
  "fireball",
  "fire ball",
  "wild ball",
  "super ball",
  "superball",
  // True bonus balls
  "bullseye",
  "bulls eye",
  "bull's eye",
  "cash ball",
  "cashball",
  "bonus ball",
  "lucky ball",
]

/**
 * Default fallback colors for add-on/bonus balls by label.
 * The API color_hex is always preferred over these.
 */
const BONUS_BALL_COLORS: Record<string, string> = {
  // Add-on balls
  fireball: "#f97316", // Orange/fire
  "fire ball": "#f97316",
  "wild ball": "#ec4899", // Pink
  "super ball": "#8b5cf6", // Purple
  superball: "#8b5cf6",
  // True bonus balls
  bullseye: "#8b5cf6",
  "bulls eye": "#8b5cf6",
  "bull's eye": "#8b5cf6",
  "cash ball": "#22c55e",
  cashball: "#22c55e",
  "bonus ball": "#f59e0b",
  "lucky ball": "#06b6d4",
}

/**
 * Labels that should NEVER be treated as secondary drawings
 * These are multipliers/extras that should remain as badges.
 *
 * IMPORTANT: "plus drawing" is NOT in this list — it IS a secondary drawing
 * (e.g. Colorado Lotto+ Plus Drawing). Only the bare word "plus" used as a
 * multiplier modifier is excluded. The check below uses exact-word logic to
 * avoid matching "plus drawing" when looking for the "plus" exclusion.
 */
/**
 * Labels that must never be treated as secondary drawings.
 * These are multipliers/add-ons that stay as badges or get promoted to bonus balls.
 * NOTE: fireball / wild ball / super ball are intentionally NOT here — they are
 * single-number add-ons that should be promoted to BonusBall, not badge text.
 */
const EXCLUDED_LABELS = [
  "power play",
  "powerplay",
  "megaplier",
  "multiplier",
  "ez match",
  "ezmatch",
  "xtra",
  "kicker",
  "cash option",
  "jackpot",
  "prize",
  "winner",
]

/**
 * Labels that should be excluded ONLY when they appear as a standalone word
 * (not as part of a longer phrase like "plus drawing").
 */
const EXCLUDED_STANDALONE = ["plus"]

export interface SecondaryDrawing {
  label: string
  numbers: (string | number)[]
  colorHex?: string | null
  mainItems?: MainItem[]
  highlightedMainNumbers?: (string | number)[]
  inPlaceBonus?: {
    label?: string
    value?: string | number
    position?: number
    target_position?: number
    color_class?: string | null
    color_hex?: string | null
  }
}

export interface ConvertedBonusItem extends BonusItem {
  _converted?: boolean
}

export interface ParsedExtraItems {
  /** Secondary drawings that should be rendered as number rows */
  secondaryDrawings: SecondaryDrawing[]
  /** Regular extra items that should remain as badges */
  regularExtras: ExtraItem[]
}

/**
 * Check if a label indicates a secondary drawing
 */
function isSecondaryDrawingLabel(label: string | undefined | null): boolean {
  if (!label) return false
  const normalized = label.toLowerCase().trim()

  // Check phrase-level exclusions first (e.g. "power play", "megaplier")
  if (EXCLUDED_LABELS.some((excluded) => normalized.includes(excluded))) {
    return false
  }

  // Check standalone-word exclusions.
  // "plus" alone (e.g. "Plus", "Xtra Plus") is a multiplier badge.
  // But "plus drawing" / "plus draw" must NOT be excluded — fall through to
  // the secondary drawing check below.
  const isStandaloneExcluded = EXCLUDED_STANDALONE.some((word) => {
    const wordRegex = new RegExp(`(?:^|\\s)${word}(?:\\s|$)`)
    return wordRegex.test(normalized)
  })

  if (isStandaloneExcluded) {
    // Allow through if the label ALSO matches a secondary drawing pattern
    const matchesSecondary = SECONDARY_DRAWING_LABELS.some((pattern) =>
      normalized.includes(pattern)
    )
    if (!matchesSecondary) return false
  }

  // Check if it matches secondary drawing patterns
  return SECONDARY_DRAWING_LABELS.some((pattern) => normalized.includes(pattern))
}

function resolveExtraLabel(item: ExtraItem): string {
  return String(item.name || item.label || "").trim()
}

/**
 * Parse a value that might contain multiple numbers
 * Returns array of number strings, or null if not parseable as multiple numbers
 */
function parseMultipleNumbers(value: string | number | (string | number)[]): string[] | null {
  // If already an array, convert to strings
  if (Array.isArray(value)) {
    const numbers = value.map(v => String(v).trim()).filter(v => /^\d+$/.test(v))
    return numbers.length >= 2 ? numbers : null
  }
  
  const strValue = String(value).trim()
  
  // Try comma-separated
  if (strValue.includes(",")) {
    const parts = strValue.split(",").map(s => s.trim()).filter(s => /^\d+$/.test(s))
    if (parts.length >= 2) return parts
  }
  
  // Try space-separated
  if (strValue.includes(" ")) {
    const parts = strValue.split(/\s+/).map(s => s.trim()).filter(s => /^\d+$/.test(s))
    if (parts.length >= 2) return parts
  }
  
  // Try dash-separated (but not negative numbers)
  if (strValue.includes("-") && !/^-?\d+$/.test(strValue)) {
    const parts = strValue.split("-").map(s => s.trim()).filter(s => /^\d+$/.test(s))
    if (parts.length >= 2) return parts
  }
  
  return null
}

function parseNumbersArray(value: unknown): number[] | null {
  if (!Array.isArray(value)) return null
  const parsed = value
    .map((v) => {
      if (typeof v === "number") return v
      if (typeof v === "string") {
        const trimmed = v.trim()
        if (/^\d+$/.test(trimmed)) return Number(trimmed)
      }
      return null
    })
    .filter((v): v is number => v !== null)
  return parsed.length >= 2 ? parsed : null
}

/**
 * Parse extra_items to separate secondary drawings from regular extras
 * 
 * Secondary drawings are detected by:
 * 1. Label matching known patterns (Double Play Drawing, etc.)
 * 2. Value containing multiple numbers (comma-separated, space-separated, or array)
 * 
 * This prevents secondary drawings from being displayed as tiny badges
 * and allows them to be rendered as proper number rows.
 */
export function parseSecondaryDrawings(extraItems: ExtraItem[] | undefined): ParsedExtraItems {
  if (!extraItems || extraItems.length === 0) {
    return { secondaryDrawings: [], regularExtras: [] }
  }

  const secondaryDrawings: SecondaryDrawing[] = []
  const regularExtras: ExtraItem[] = []
  const secondaryKeys = new Set<string>()

  const pushSecondary = (drawing: SecondaryDrawing) => {
    const key = `${(drawing.label || "secondary").toLowerCase()}|${drawing.numbers
      .map((n) => String(n))
      .join(",")}`
    if (secondaryKeys.has(key)) return
    secondaryKeys.add(key)
    secondaryDrawings.push(drawing)
  }

  for (const item of extraItems) {
    const lowerType = (item.type ?? "").toLowerCase()
    const resolvedLabel = resolveExtraLabel(item)

    // Structured secondary drawing payload (official providers)
    // Example: { type:"secondary_drawing", main_numbers:[...], main_items:[...], in_place_bonus:{...} }
    if (lowerType === "secondary_drawing") {
      const structuredNumbers = parseNumbersArray(item.main_numbers)
      const fallbackNumbers = parseMultipleNumbers(item.value)
      const numbers = structuredNumbers ?? fallbackNumbers

      if (numbers && numbers.length >= 2) {
        pushSecondary({
          label: resolvedLabel || "Secondary Drawing",
          numbers,
          colorHex: item.color_hex,
          mainItems: item.main_items,
          highlightedMainNumbers: item.highlighted_main_numbers,
          inPlaceBonus: item.in_place_bonus,
        })
        continue
      }
    }

    // Check if this looks like a secondary drawing
    if (isSecondaryDrawingLabel(resolvedLabel)) {
      const numbers = parseMultipleNumbers(item.value)

      if (numbers && numbers.length >= 2) {
        // This is a secondary drawing with multiple numbers
        pushSecondary({
          label: resolvedLabel || "Secondary Drawing",
          numbers,
          colorHex: item.color_hex,
          mainItems: item.main_items,
          highlightedMainNumbers: item.highlighted_main_numbers,
          inPlaceBonus: item.in_place_bonus,
        })
        continue
      }
    }

    // Not a secondary drawing, keep as regular extra.
    // Preserve backend label from `name` when provided.
    regularExtras.push({
      ...item,
      label: resolvedLabel || item.label,
    })
  }

  return { secondaryDrawings, regularExtras }
}
export function hasSecondaryDrawings(extraItems: ExtraItem[] | undefined): boolean {
  if (!extraItems || extraItems.length === 0) return false
  
  return extraItems.some(item => {
    if (!isSecondaryDrawingLabel(resolveExtraLabel(item))) return false
    const numbers = parseMultipleNumbers(item.value)
    return numbers !== null && numbers.length >= 2
  })
}

/**
 * Labels that are multipliers/modifiers and must NEVER be promoted to bonus balls.
 * This guard prevents Xtra (Jersey Cash 5), Power Play, Megaplier etc. from
 * being rendered as colored number balls.
 */
/**
 * True multipliers that must NEVER render as number balls.
 * Fireball / Wild Ball / Super Ball are NOT in this list — they ARE number add-ons
 * and should be promoted to BonusBall via BONUS_BALL_LABELS.
 */
const MULTIPLIER_LABELS_NEVER_BONUS = [
  "xtra",
  "power play",
  "powerplay",
  "megaplier",
  "multiplier",
  "ez match",
  "ezmatch",
  "kicker",
  "boost",
  "doubler",
  "all star bonus",
  "multiplicador",
]

/**
 * Check if a label should be converted to a bonus ball
 */
function isBonusBallLabel(label: string | undefined | null): boolean {
  if (!label) return false
  const normalized = label.toLowerCase().trim()
  // Never promote known multipliers to bonus balls
  if (MULTIPLIER_LABELS_NEVER_BONUS.some((m) => normalized.includes(m))) {
    return false
  }
  return BONUS_BALL_LABELS.some((pattern) => normalized.includes(pattern))
}

/**
 * Get the default color for a bonus ball label
 */
function getBonusBallColor(label: string | undefined | null): string {
  if (!label) return "#8b5cf6"
  const normalized = label.toLowerCase().trim()
  for (const [pattern, color] of Object.entries(BONUS_BALL_COLORS)) {
    if (normalized.includes(pattern)) {
      return color
    }
  }
  return "#8b5cf6" // Default purple
}

/**
 * Extract bonus balls from extra_items that should be rendered as bonus balls
 * This handles cases like Bullseye which may come as extra_items but should be rendered as balls
 * 
 * @param extraItems - Array of extra items from API
 * @returns Object with converted bonus items and remaining extra items
 */
export function extractBonusBallsFromExtras(
  extraItems: ExtraItem[] | undefined
): { bonusBalls: ConvertedBonusItem[]; remainingExtras: ExtraItem[] } {
  if (!extraItems || extraItems.length === 0) {
    return { bonusBalls: [], remainingExtras: [] }
  }

  const bonusBalls: ConvertedBonusItem[] = []
  const remainingExtras: ExtraItem[] = []

  for (const item of extraItems) {
    if (!item) continue

    // Keep structured secondary drawings intact. They can carry full rows in
    // `main_numbers` even when `value` is absent.
    if ((item.type ?? "").toLowerCase() === "secondary_drawing") {
      remainingExtras.push(item)
      continue
    }

    // Preserve metadata-only extras instead of dropping them.
    if (item.label == null || item.value == null) {
      remainingExtras.push(item)
      continue
    }

    // Check if this should be a bonus ball
    if (isBonusBallLabel(item.label)) {
      // Parse the value as a single number
      const value = item.value
      const numValue =
        typeof value === "number" ? value : typeof value === "string" ? parseInt(value, 10) : NaN

      if (!isNaN(numValue)) {
        bonusBalls.push({
          label: item.label,
          value: numValue,
          number: numValue,
          color_hex: item.color_hex || getBonusBallColor(item.label),
          _converted: true,
        })
        continue
      }
    }

    // Not a bonus ball, keep as extra
    remainingExtras.push(item)
  }

  return { bonusBalls, remainingExtras }
}
export interface FullParsedExtras {
  /** Items that should be rendered as bonus balls (Bullseye, etc.) */
  bonusBalls: ConvertedBonusItem[]
  /** Secondary drawings that should be rendered as number rows */
  secondaryDrawings: SecondaryDrawing[]
  /** Regular extra items that should remain as badges */
  regularExtras: ExtraItem[]
}

export function parseExtrasWithBonusBalls(extraItems: ExtraItem[] | undefined): FullParsedExtras {
  if (!extraItems || extraItems.length === 0) {
    return { bonusBalls: [], secondaryDrawings: [], regularExtras: [] }
  }

  // Strip marked_special_main items — they are handled by normalizeDrawResult and
  // applied to main_items with target_position. They must never appear as badges.
  const withoutMarked = extraItems.filter(
    (e) =>
      e.type !== "marked_special_main" &&
      !(e.label ?? "").toLowerCase().includes("marked_special_main")
  )

  // First extract bonus balls
  const { bonusBalls, remainingExtras } = extractBonusBallsFromExtras(withoutMarked)
  
  // Then parse remaining for secondary drawings
  const { secondaryDrawings, regularExtras } = parseSecondaryDrawings(remainingExtras)
  
  return { bonusBalls, secondaryDrawings, regularExtras }
}

