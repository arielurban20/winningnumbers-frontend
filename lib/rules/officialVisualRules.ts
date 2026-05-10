import rawRulesData from "./officialVisualRules.data.json"

export type BonusPosition =
  | "none"
  | "separate_bonus"
  | "marked_special_main"
  | "add_on_separate"
  | "secondary_draw"
  | "unknown"

export type MultiplierDisplayType = "badge" | "none" | "ball" | "text" | "unknown"
export type DoublePlayDisplayType = "secondary_draw" | "none" | "unknown"

export interface OfficialVisualRule {
  rule_id?: number
  id?: string
  state_slug?: string | null
  state_code?: string | null
  game_slug_or_family?: string | null
  game_name?: string | null
  source_type?: string | null
  source_note?: string | null
  main_numbers_count?: number | null
  bonus_position?: BonusPosition | null
  bonus_name?: string | null
  bonus_color_hex_or_name?: string | null
  multiplier_name?: string | null
  multiplier_display_type?: MultiplierDisplayType | null
  has_double_play?: boolean | null
  double_play_display_type?: DoublePlayDisplayType | null
  has_jackpot?: boolean | null
  jackpot_type?: string | null
  top_prize?: string | null
  grouping_rule?: string | null
  frontend_expected_behavior?: string | null
  backend_expected_behavior?: string | null
  severity_if_wrong?: string | null
  expected_backend_fields?: string[] | null
  expected_frontend_behavior?: string | null
  provider_file_likely?: string | null
  fix_area?: string | null
  priority?: string | null
  needs_verification?: boolean | null
  // Global wildcard format
  applies_to_game_family?: string | null
  notes?: string | null
}

export interface VisualRuleLookupResult extends OfficialVisualRule {
  __match_type:
    | "exact_state_game"
    | "exact_game_or_family"
    | "state_family_rule"
    | "global_wildcard"
    | "generic_fallback"
  __rule_key: string
}

interface OfficialVisualRulesData {
  version?: string
  updated_at?: string
  rules_count?: number
  rules?: OfficialVisualRule[]
  global_rules?: OfficialVisualRule[]
}

const data = rawRulesData as OfficialVisualRulesData
const STATE_RULES = (data.rules || []).filter(Boolean)
const GLOBAL_RULES = (data.global_rules || []).filter(Boolean)

const SESSION_SUFFIXES = [
  "morning",
  "midday",
  "day",
  "afternoon",
  "evening",
  "night",
  "noon",
  "lunch",
  "matinee",
  "prime-time",
  "primetime",
  "night-owl",
  "early-bird",
  "brunch",
  "supper-time",
  "dia",
  "noche",
]

const GENERIC_FALLBACK_RULE: VisualRuleLookupResult = {
  game_name: "Generic Lottery Rule",
  bonus_position: "unknown",
  multiplier_display_type: "badge",
  double_play_display_type: "none",
  has_double_play: false,
  has_jackpot: false,
  jackpot_type: "unknown",
  grouping_rule: "single_game",
  __match_type: "generic_fallback",
  __rule_key: "generic_fallback",
}

function normalize(value?: string | null): string {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function dedupe(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))]
}

function stripStateSuffix(gameSlug: string): string {
  const slug = normalize(gameSlug)
  const parts = slug.split("-")
  if (parts.length <= 1) return slug
  const tail = parts[parts.length - 1]
  if (/^[a-z]{2}$/.test(tail)) return parts.slice(0, -1).join("-")
  return slug
}

function stripSessionSuffix(gameSlug: string): string {
  const slug = normalize(gameSlug)
  for (const suffix of SESSION_SUFFIXES) {
    if (slug.endsWith(`-${suffix}`)) {
      return slug.slice(0, -(suffix.length + 1))
    }
  }
  return slug
}

function buildCandidates(gameSlug?: string, gameFamilySlug?: string): string[] {
  const slug = normalize(gameSlug)
  const family = normalize(gameFamilySlug)

  const base = stripStateSuffix(slug)
  const withoutSession = stripSessionSuffix(base)
  const familyCandidate = family || withoutSession

  const candidates = [
    slug,
    base,
    withoutSession,
    family,
    familyCandidate,
    familyCandidate ? `${familyCandidate}-family` : "",
    withoutSession ? `${withoutSession}-family` : "",
  ]

  // Common "family" aliases for pick-style games
  if (withoutSession.startsWith("pick-2")) candidates.push("pick-2-family")
  if (withoutSession.startsWith("pick-3")) candidates.push("pick-3-family", "pick-3-pick-4-family")
  if (withoutSession.startsWith("pick-4")) candidates.push("pick-4-family", "pick-3-pick-4-family")
  if (withoutSession.startsWith("pick-5")) candidates.push("pick-5-family")
  if (withoutSession.startsWith("pega-2")) candidates.push("pega-2-family")
  if (withoutSession.startsWith("pega-3")) candidates.push("pega-3-family")
  if (withoutSession.startsWith("pega-4")) candidates.push("pega-4-family")

  return dedupe(candidates.map(normalize))
}

function wildcardMatch(pattern: string, candidate: string): boolean {
  const p = normalize(pattern)
  const c = normalize(candidate)
  if (!p || !c) return false
  if (p === c) return true
  if (p.endsWith("-*") && c === p.slice(0, -2)) return true
  if (!p.includes("*")) return false
  const regex = new RegExp(`^${p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`)
  return regex.test(c)
}

function withMeta(rule: OfficialVisualRule, matchType: VisualRuleLookupResult["__match_type"]): VisualRuleLookupResult {
  const key = normalize(rule.game_slug_or_family || rule.applies_to_game_family || rule.id || String(rule.rule_id || "rule"))
  const inferredBonusPosition: BonusPosition =
    (rule.bonus_position as BonusPosition) ||
    (rule.bonus_name ? "separate_bonus" : "none")

  return {
    ...rule,
    bonus_position: inferredBonusPosition,
    multiplier_display_type: (rule.multiplier_display_type || "badge") as MultiplierDisplayType,
    double_play_display_type: (rule.double_play_display_type || "none") as DoublePlayDisplayType,
    __match_type: matchType,
    __rule_key: key || "rule",
  }
}

export function getOfficialVisualRule(
  stateSlug?: string,
  gameSlug?: string,
  gameFamilySlug?: string
): VisualRuleLookupResult {
  const state = normalize(stateSlug)
  const candidates = buildCandidates(gameSlug, gameFamilySlug)
  const familyCandidates = candidates.filter((c) => c.endsWith("-family"))

  // 1) exact state + game slug/family
  for (const candidate of candidates) {
    const exactStateRule = STATE_RULES.find(
      (r) => normalize(r.state_slug) === state && normalize(r.game_slug_or_family) === candidate
    )
    if (exactStateRule) return withMeta(exactStateRule, "exact_state_game")
  }

  // 2) exact game slug/family (cross-state)
  for (const candidate of candidates) {
    const exactRule = STATE_RULES.find((r) => normalize(r.game_slug_or_family) === candidate)
    if (exactRule) return withMeta(exactRule, "exact_game_or_family")
  }

  // 3) state family rule
  for (const candidate of familyCandidates) {
    const familyRule = STATE_RULES.find(
      (r) => normalize(r.state_slug) === state && normalize(r.game_slug_or_family) === candidate
    )
    if (familyRule) return withMeta(familyRule, "state_family_rule")
  }

  // 4) global wildcard
  for (const globalRule of GLOBAL_RULES) {
    const pattern = normalize(globalRule.applies_to_game_family)
    if (!pattern) continue
    const matches = candidates.some((candidate) => wildcardMatch(pattern, candidate))
    if (matches) return withMeta(globalRule, "global_wildcard")
  }

  // 5) fallback
  return { ...GENERIC_FALLBACK_RULE }
}

const COLOR_NAME_TO_HEX: Record<string, string> = {
  red: "#d32f2f",
  blue: "#1976d2",
  "dark-blue": "#1565c0",
  navy: "#1565c0",
  green: "#2e7d32",
  yellow: "#f9a825",
  gold: "#fbc02d",
  orange: "#ff7043",
  pink: "#e91e63",
  magenta: "#e91e63",
  purple: "#8e24aa",
  white: "#ffffff",
  gray: "#6b7280",
  grey: "#6b7280",
  black: "#111827",
}

export function resolveRuleColorHex(color?: string | null): string | undefined {
  const value = normalize(color)
  if (!value) return undefined
  if (value.startsWith("#")) return value
  return COLOR_NAME_TO_HEX[value]
}

export function getRulesMetadata() {
  return {
    version: data.version,
    updated_at: data.updated_at,
    rules_count: data.rules_count,
    state_rules_count: STATE_RULES.length,
    global_rules_count: GLOBAL_RULES.length,
  }
}
