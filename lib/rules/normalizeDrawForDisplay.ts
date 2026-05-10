import type {
  BonusItem,
  DrawResult,
  ExtraItem,
  HistoricalResult,
  InPlaceBonusMeta,
  MainItem,
  PastDraw,
} from "@/types/api"
import {
  getOfficialVisualRule,
  resolveRuleColorHex,
  type VisualRuleLookupResult,
  type BonusPosition,
} from "./officialVisualRules"

export type DrawDisplayContext = "latest" | "past" | "historical"
export type NormalizableDraw = DrawResult | PastDraw | HistoricalResult

export interface NormalizeDrawForDisplayOptions {
  stateSlug?: string
  gameSlug?: string
  gameFamilySlug?: string
  context: DrawDisplayContext
  visualRule?: VisualRuleLookupResult
}

export interface NormalizedDisplayMeta {
  applied_visual_rule_key: string
  applied_visual_rule_match_type: VisualRuleLookupResult["__match_type"]
  data_quality_warnings: string[]
}

const SESSION_SUFFIXES = [
  "morning",
  "midday",
  "day",
  "afternoon",
  "evening",
  "night",
  "noon",
  "dia",
  "noche",
]

const MULTIPLIER_LABELS = [
  "xtra",
  "power play",
  "powerplay",
  "megaplier",
  "all star bonus",
  "multiplier",
  "kicker",
  "ez match",
  "ezmatch",
  "doubler",
  "multiplicador",
]

const ADD_ON_LABELS = [
  "fireball",
  "wild ball",
  "super ball",
  "sum it up",
  "bullseye",
  "bulls-eye",
  "bulls eye",
  "kicker",
  "ez match",
  "ezmatch",
]
const IN_PLACE_LABELS = ["bullseye", "bulls-eye", "bulls eye", "pega", "bulls eye"]

function normalize(value?: string | null): string {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function toInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = parseInt(value.trim(), 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isMultiplierLabel(label?: string | null): boolean {
  const normalized = normalize(label)
  return MULTIPLIER_LABELS.some((token) => normalized.includes(token))
}

function isAddOnLabel(label?: string | null): boolean {
  const normalized = normalize(label)
  return ADD_ON_LABELS.some((token) => normalized.includes(token))
}

function isInPlaceLabel(label?: string | null): boolean {
  const normalized = normalize(label)
  return IN_PLACE_LABELS.some((token) => normalized.includes(token))
}

function canonicalLabel(value?: string | null): string {
  return normalize(value).replace(/[^a-z0-9]/g, "")
}

function isRuleBonusNameMatch(label: string | null | undefined, rule: VisualRuleLookupResult): boolean {
  const bonusName = canonicalLabel(rule.bonus_name)
  const currentLabel = canonicalLabel(label)
  if (!bonusName || !currentLabel) return false
  return currentLabel.includes(bonusName) || bonusName.includes(currentLabel)
}

function extractInPlaceFromExtra(item: ExtraItem): InPlaceBonusMeta | null {
  if (item.in_place_bonus && isObject(item.in_place_bonus)) return item.in_place_bonus
  if ((item.type || "").toLowerCase() === "in_place_bonus") {
    return {
      label: item.label,
      value: item.value as string | number,
      position: item.position,
      color_class: item.color_class ?? undefined,
      color_hex: item.color_hex ?? undefined,
    }
  }
  return null
}

function guessPegaPosition(gameSlug: string, mainCount: number): number | null {
  const slug = normalize(gameSlug)
  const base = slug.replace(/-[a-z]{2}$/i, "")
  if (base.startsWith("pega-2")) return Math.min(2, mainCount)
  if (base.startsWith("pega-3")) return Math.min(3, mainCount)
  if (base.startsWith("pega-4")) return Math.min(4, mainCount)
  return null
}

function stripSessionSuffix(gameSlug: string): string {
  let slug = normalize(gameSlug)
  for (const suffix of SESSION_SUFFIXES) {
    if (slug.endsWith(`-${suffix}`)) {
      slug = slug.slice(0, -(suffix.length + 1))
      break
    }
  }
  return slug
}

function isPuertoRicoPegaGame(gameSlug: string): boolean {
  const slug = normalize(gameSlug)
  const base = slug.replace(/-[a-z]{2}$/i, "")
  return (
    base.startsWith("pega-2-") ||
    base.startsWith("pega-3-") ||
    base.startsWith("pega-4-")
  )
}

function bonusColorFromRule(rule: VisualRuleLookupResult): string | undefined {
  return resolveRuleColorHex(rule.bonus_color_hex_or_name)
}

function promoteTopLevelMetadata(draw: NormalizableDraw): {
  extraItems: ExtraItem[]
  inPlaceBonus?: InPlaceBonusMeta
  highlightedMainNumbers: (string | number)[]
} {
  const withOptional = draw as NormalizableDraw & {
    secondary_drawing?: ExtraItem
    secondary_drawings?: ExtraItem[]
    in_place_bonus?: InPlaceBonusMeta
    highlighted_main_numbers?: (string | number)[]
  }

  const extraItems = [...(draw.extra_items || [])]
  const highlightedMainNumbers = withOptional.highlighted_main_numbers || []
  const inPlaceBonus = withOptional.in_place_bonus

  if (withOptional.secondary_drawing && isObject(withOptional.secondary_drawing)) {
    const secondary = { ...(withOptional.secondary_drawing as ExtraItem) }
    if (!secondary.type) secondary.type = "secondary_drawing"
    extraItems.push(secondary)
  }

  if (Array.isArray(withOptional.secondary_drawings)) {
    for (const row of withOptional.secondary_drawings) {
      if (!isObject(row)) continue
      const secondary = { ...(row as ExtraItem) }
      if (!secondary.type) secondary.type = "secondary_drawing"
      extraItems.push(secondary)
    }
  }

  if (inPlaceBonus) {
    const hasInPlace = extraItems.some((item) => {
      const t = normalize(item.type)
      return t === "in_place_bonus" || isObject(item.in_place_bonus)
    })
    if (!hasInPlace) {
      extraItems.unshift({
        type: "in_place_bonus",
        label: inPlaceBonus.label || "In-place Bonus",
        value: inPlaceBonus.value ?? "",
        position: inPlaceBonus.position,
        color_class: inPlaceBonus.color_class,
        color_hex: inPlaceBonus.color_hex,
        in_place_bonus: inPlaceBonus,
      })
    }
  }

  return { extraItems, inPlaceBonus, highlightedMainNumbers }
}

function applyInPlaceHighlighting(params: {
  mainNumbers: number[]
  mainItems: MainItem[]
  extraItems: ExtraItem[]
  gameSlug: string
  rule: VisualRuleLookupResult
  highlightedMainNumbers: (string | number)[]
  dataQualityWarnings: string[]
}) {
  const {
    mainNumbers,
    mainItems,
    extraItems,
    gameSlug,
    rule,
    highlightedMainNumbers,
    dataQualityWarnings,
  } = params

  const highlightCandidates: Array<{ targetPosition: number; colorHex?: string; source: string }> = []
  const pegaPosition = guessPegaPosition(gameSlug, mainNumbers.length)
  const isPegaGame = pegaPosition !== null

  // Pega rules are strictly positional. Never trust value-based or stale incoming
  // highlight flags when repeated digits exist (e.g. 4-9-9 should highlight only #3).
  if (isPegaGame) {
    for (let i = 0; i < mainItems.length; i++) {
      mainItems[i] = {
        ...mainItems[i],
        is_highlighted: false,
      }
    }
  }

  // 1) explicit marked_special_main entries
  for (const item of extraItems) {
    const type = normalize(item.type)
    const label = normalize(item.label)
    if (type !== "marked_special_main" && !label.includes("marked_special_main")) continue

    let pos: number | null = null
    const explicitPos = toInt(item.position ?? item.in_place_bonus?.target_position ?? item.in_place_bonus?.position)
    if (explicitPos && explicitPos >= 1 && explicitPos <= mainNumbers.length) {
      pos = explicitPos
    } else if (!isPegaGame) {
      const target = toInt(item.target_value ?? item.value ?? item.in_place_bonus?.value)
      if (target !== null) {
        const valueIdx = mainNumbers.findIndex((n) => n === target)
        if (valueIdx !== -1) pos = valueIdx + 1
      }
    }
    if (pos) {
      highlightCandidates.push({
        targetPosition: pos,
        colorHex: item.color_hex || item.in_place_bonus?.color_hex || bonusColorFromRule(rule),
        source: "marked_special_main",
      })
    }
  }

  // 2) in_place_bonus entries
  for (const item of extraItems) {
    const inPlace = extractInPlaceFromExtra(item)
    if (!inPlace && !isInPlaceLabel(item.label)) continue
    const fallbackValue = toInt(inPlace?.value ?? item.value)
    let pos = toInt(inPlace?.target_position ?? inPlace?.position ?? item.position)
    if (!pos && fallbackValue !== null && !isPegaGame) {
      const idx = mainNumbers.findIndex((n) => n === fallbackValue)
      if (idx !== -1) pos = idx + 1
    }
    if (pos && pos >= 1 && pos <= mainNumbers.length) {
      highlightCandidates.push({
        targetPosition: pos,
        colorHex: inPlace?.color_hex || item.color_hex || bonusColorFromRule(rule),
        source: "in_place_bonus",
      })
    }
  }

  // 3) highlighted_main_numbers by value
  if (!isPegaGame) {
    for (const rawValue of highlightedMainNumbers) {
      const value = toInt(rawValue)
      if (value === null) continue
      const idx = mainNumbers.findIndex((n) => n === value)
      if (idx !== -1) {
        highlightCandidates.push({
          targetPosition: idx + 1,
          colorHex: bonusColorFromRule(rule),
          source: "highlighted_main_numbers",
        })
      }
    }
  }

  // 4) Pega fallback by rule and slug (no hardcoded component logic)
  if (normalize(rule.bonus_position) === "marked_special_main" && highlightCandidates.length === 0) {
    const pegaPos = pegaPosition
    if (pegaPos) {
      highlightCandidates.push({
        targetPosition: pegaPos,
        colorHex: bonusColorFromRule(rule),
        source: "rule_pega_fallback",
      })
    }
  }

  const seenPositions = new Set<number>()
  for (const candidate of highlightCandidates) {
    if (candidate.targetPosition < 1 || candidate.targetPosition > mainItems.length) continue
    if (seenPositions.has(candidate.targetPosition)) continue
    seenPositions.add(candidate.targetPosition)
    const idx = candidate.targetPosition - 1
    mainItems[idx] = {
      ...mainItems[idx],
      is_highlighted: true,
      color_hex: candidate.colorHex || mainItems[idx].color_hex || "#ef4444",
      target_position: candidate.targetPosition,
    }
  }

  if (normalize(rule.bonus_position) === "marked_special_main") {
    const hasHighlight = mainItems.some((item) => item.is_highlighted === true)
    if (!hasHighlight) {
      dataQualityWarnings.push(
        `rule_expected_marked_special_main_but_no_highlight_found:${gameSlug}`
      )
    }
  }
}

function normalizeBonusItems(
  bonusItems: BonusItem[],
  rule: VisualRuleLookupResult
): { bonusItems: BonusItem[]; movedExtras: ExtraItem[] } {
  const movedExtras: ExtraItem[] = []
  const fallbackColor = bonusColorFromRule(rule)
  const bonusPosition = normalize(rule.bonus_position) as BonusPosition

  let normalizedBonus = bonusItems.map((item) => {
    const value = item.value ?? item.number ?? ""
    return {
      ...item,
      value,
      color_hex: item.color_hex || fallbackColor || "#8b5cf6",
    }
  })

  // Multipliers should be badges, never balls.
  // Exception: for add_on_separate rules, items matching rule.bonus_name are
  // true add-ons (e.g. Kicker, EZmatch) and should stay in add-on flow.
  const multiplierAsExtras = normalizedBonus
    .filter((item) => {
      if (bonusPosition === "add_on_separate" && isRuleBonusNameMatch(item.label, rule)) {
        return false
      }
      return isMultiplierLabel(item.label)
    })
    .map<ExtraItem>((item) => ({
      type: "multiplier",
      label: item.label,
      value: item.value,
      color_hex: item.color_hex,
    }))
  if (multiplierAsExtras.length > 0) {
    movedExtras.push(...multiplierAsExtras)
    normalizedBonus = normalizedBonus.filter((item) => !isMultiplierLabel(item.label))
  }

  if (bonusPosition === "none") {
    normalizedBonus = []
  } else if (bonusPosition === "marked_special_main") {
    // For in-place games (MO Millions Bulls-Eye, PR Pega), never render "+" bonus balls.
    normalizedBonus = []
  } else if (bonusPosition === "add_on_separate") {
    movedExtras.push(
      ...normalizedBonus.map<ExtraItem>((item) => ({
        type: "add_on",
        label: item.label,
        value: item.value,
        color_hex: item.color_hex,
      }))
    )
    normalizedBonus = []
  } else if (bonusPosition === "separate_bonus") {
    normalizedBonus = normalizedBonus.map((item) => ({
      ...item,
      color_hex: item.color_hex || fallbackColor || "#8b5cf6",
    }))
  }

  return { bonusItems: normalizedBonus, movedExtras }
}

function buildMainItems(mainNumbers: number[], incoming?: MainItem[]): MainItem[] {
  if (!incoming || incoming.length !== mainNumbers.length) {
    return mainNumbers.map((value) => ({ value }))
  }
  return incoming.map((item, idx) => ({
    value: item?.value ?? item?.number ?? mainNumbers[idx],
    number: item?.number,
    color_hex: item?.color_hex ?? undefined,
    color_class: item?.color_class ?? undefined,
    is_highlighted: item?.is_highlighted === true,
    target_position: item?.target_position,
    label: item?.label,
  }))
}

export function normalizeDrawForDisplay<T extends NormalizableDraw>(
  rawDraw: T,
  options: NormalizeDrawForDisplayOptions
): T & NormalizedDisplayMeta {
  const stateSlug = normalize(options.stateSlug || (rawDraw as DrawResult).state_slug || (rawDraw as DrawResult).state?.slug)
  const gameSlug = normalize(options.gameSlug || (rawDraw as DrawResult).game_slug || (rawDraw as DrawResult).game?.slug)
  const baseFamily = stripSessionSuffix(gameSlug.replace(/-[a-z]{2}$/i, ""))
  const visualRule =
    options.visualRule || getOfficialVisualRule(stateSlug, gameSlug, options.gameFamilySlug || baseFamily)

  const dataQualityWarnings: string[] = []
  const mainNumbers = Array.isArray(rawDraw.main_numbers) ? rawDraw.main_numbers : []
  const incomingBonus = Array.isArray(rawDraw.bonus_items) ? rawDraw.bonus_items : []
  const incomingMainItems = Array.isArray((rawDraw as DrawResult).main_items)
    ? (rawDraw as DrawResult).main_items
    : undefined
  const isPegaGame = isPuertoRicoPegaGame(gameSlug)
  const usePegaSeparateBonusModel = isPegaGame && incomingBonus.length > 0
  const effectiveRule: VisualRuleLookupResult =
    usePegaSeparateBonusModel
      ? { ...visualRule, bonus_position: "separate_bonus" }
      : visualRule

  const promoted = promoteTopLevelMetadata(rawDraw)
  let extraItems = [...promoted.extraItems]
  let highlightedMainNumbers = promoted.highlightedMainNumbers

  if (usePegaSeparateBonusModel) {
    // Backend now sends explicit bonus_items for Pega 2/3/4. Ignore legacy in-place
    // markers to avoid painting the last main ball as bonus.
    extraItems = extraItems.filter((item) => {
      const type = normalize(item.type)
      const label = normalize(item.label)
      if (type === "marked_special_main" || type === "in_place_bonus") return false
      if (label.includes("marked_special_main") || isInPlaceLabel(label)) return false
      return true
    })
    highlightedMainNumbers = []
  }

  // Normalize bonus items by rule first
  const bonusNormalize = normalizeBonusItems(incomingBonus, effectiveRule)
  let bonusItems = bonusNormalize.bonusItems
  extraItems.push(...bonusNormalize.movedExtras)

  // Build main items and apply in-place/highlight behavior
  const mainItems = buildMainItems(mainNumbers, incomingMainItems)
  if (usePegaSeparateBonusModel) {
    for (let i = 0; i < mainItems.length; i++) {
      mainItems[i] = {
        ...mainItems[i],
        is_highlighted: false,
      }
    }
  }
  applyInPlaceHighlighting({
    mainNumbers,
    mainItems,
    extraItems,
    gameSlug,
    rule: effectiveRule,
    highlightedMainNumbers,
    dataQualityWarnings,
  })

  // Remove raw in-place/marked items from extras so renderer does not duplicate them.
  extraItems = extraItems.filter((item) => {
    const type = normalize(item.type)
    const label = normalize(item.label)
    if (type === "marked_special_main" || type === "in_place_bonus") return false
    if (label.includes("marked_special_main")) return false
    if (
      effectiveRule.bonus_position === "marked_special_main" &&
      type !== "secondary_drawing" &&
      isInPlaceLabel(item.label)
    ) return false
    return true
  })

  // Preserve explicit extra-item intent for cleaner frontend rendering.
  // If provider sends add-ons directly in extra_items, mark them as `add_on`
  // (without inventing values) so UI can separate add-ons from multipliers.
  extraItems = extraItems.map((item) => {
    const itemType = normalize(item.type)
    if (itemType) return item

    const label = item.label || item.name
    if (effectiveRule.bonus_position === "add_on_separate" && isRuleBonusNameMatch(label, effectiveRule)) {
      return {
        ...item,
        type: "add_on",
      }
    }

    if (isAddOnLabel(label)) {
      return {
        ...item,
        type: "add_on",
      }
    }

    if (isMultiplierLabel(label)) {
      return {
        ...item,
        type: "multiplier",
      }
    }

    return item
  })

  // Keep secondary drawings as dedicated typed extras
  const secondaryDrawings = extraItems.filter((item) => normalize(item.type) === "secondary_drawing")
  if ((effectiveRule.has_double_play || effectiveRule.double_play_display_type === "secondary_draw") && secondaryDrawings.length === 0) {
    dataQualityWarnings.push(`rule_expected_secondary_drawing_missing:${gameSlug}`)
  }

  // Data quality checks
  const expectedMainCount = effectiveRule.main_numbers_count
  if (typeof expectedMainCount === "number" && expectedMainCount > 0 && mainNumbers.length !== expectedMainCount) {
    dataQualityWarnings.push(
      `main_numbers_count_mismatch:expected=${expectedMainCount},actual=${mainNumbers.length},game=${gameSlug}`
    )
  }

  if (effectiveRule.bonus_position === "separate_bonus" && bonusItems.length === 0) {
    dataQualityWarnings.push(`rule_expected_separate_bonus_missing:${gameSlug}`)
  }

  if (effectiveRule.bonus_position === "none" && incomingBonus.length > 0) {
    dataQualityWarnings.push(`rule_disallows_bonus_but_bonus_received:${gameSlug}`)
  }

  const normalized = {
    ...(rawDraw as T),
    game_slug: gameSlug || (rawDraw as DrawResult).game_slug,
    state_slug: stateSlug || (rawDraw as DrawResult).state_slug,
    game_name: (rawDraw as DrawResult).game_name || (rawDraw as DrawResult).game?.name,
    state_name: (rawDraw as DrawResult).state_name || (rawDraw as DrawResult).state?.name,
    main_numbers: mainNumbers,
    main_items: mainItems,
    bonus_items: bonusItems,
    extra_items: extraItems,
    highlighted_main_numbers: highlightedMainNumbers,
    secondary_drawings: secondaryDrawings,
    secondary_drawing: secondaryDrawings[0],
    data_quality_warnings: dataQualityWarnings,
    applied_visual_rule_key: visualRule.__rule_key,
    applied_visual_rule_match_type: visualRule.__match_type,
  } as unknown as T & NormalizedDisplayMeta

  return normalized
}
