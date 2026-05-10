// API Response Types for Winning Numbers

export interface State {
  id: number
  name: string
  slug: string
  abbreviation?: string
  timezone?: string
  source_url?: string
  icon_url?: string
  logo_url?: string
  logo?: string
  /** True when the backend confirms this state has results drawn today */
  has_today_results?: boolean
  /** Number of results drawn today for this state */
  today_results_count?: number
}

export interface Game {
  id: number
  name: string
  slug: string
  source_game_slug?: string
  source_url?: string
  is_multistate?: boolean
  state_id?: number
  state_slug?: string
  state_name?: string
  logo_url?: string
  logo?: string
  icon_url?: string
  draw_days?: string[]
  draw_time?: string
  price?: number
  odds?: string
  description?: string
  /** When true, this variant should be rendered inside its parent game card only. */
  display_in_parent_only?: boolean
  /** Parent slug used for grouped variants (e.g. Hoosier Lotto +PLUS under Hoosier Lotto). */
  parent_game_slug?: string
  /** Variant semantic type (e.g. secondary_draw). */
  variant_type?: string
}

export interface BonusItem {
  label: string
  value: string | number
  number?: number | string
  color_class?: string
  color_hex: string
}

export interface InPlaceBonusMeta {
  label?: string
  value?: string | number
  position?: number
  target_position?: number
  target?: string
  color_class?: string | null
  color_hex?: string | null
}

/**
 * Metadata for main numbers with special highlighting
 * Used by games like Jersey Cash 5 that have highlighted balls
 */
export interface MainItem {
  /** The number value (prefer this over number field) */
  value: number | string
  /** Legacy field - use value instead */
  number?: number
  /** Hex color for highlighted balls (e.g., "#C93442" for red) */
  color_hex?: string
  color_class?: string
  is_special?: boolean
  /** If true, render this ball with color_hex instead of statusColor */
  is_highlighted?: boolean
  label?: string
  /**
   * For Puerto Rico Pega games: the 1-indexed position of the target ball.
   * Only the ball at this position is colored — do NOT color by value matching.
   * Example: target_position=3 means the 3rd ball is highlighted.
   */
  target_position?: number
}

export interface ExtraItem {
  label: string
  /** Optional alternative label key sent by backend payloads. */
  name?: string
  value: string | number | (string | number)[]
  color_hex?: string | null
  color_class?: string | null
  /** For Poker Lotto cards - suit name (spades, hearts, clubs, diamonds) */
  suit?: string
  /** For Poker Lotto cards - card title like "Ace of Spades" */
  title?: string
  /**
   * Semantic type tag sent by the backend. Key value:
   * - "marked_special_main": this item highlights a specific main number position
   *   (e.g. Puerto Rico Pega target ball). It must NOT be rendered as a badge.
   *   Instead, apply its color_hex to the main number at `position` (1-indexed).
   */
  type?: string
  /**
   * 1-indexed position of the main number to highlight.
   * Used with type="marked_special_main".
   */
  position?: number
  /**
   * For structured secondary drawings (e.g. Double Play), backend may send
   * full number sets directly on extra_items entries.
   */
  main_numbers?: (string | number)[]
  main_items?: MainItem[]
  highlighted_main_numbers?: (string | number)[]
  in_place_bonus?: InPlaceBonusMeta
  target_value?: string | number
}

export interface DrawResult {
  id: number
  game_id?: number
  game_name?: string
  game_slug?: string
  game?: {
    id: number
    slug: string
    name: string
  }
  state_id?: number
  state_name?: string
  state_slug?: string
  state?: {
    slug: string
    name: string
    timezone?: string
  }
  draw_date: string
  draw_type?: string
  draw_time?: string
  main_numbers: number[]
  /**
   * Optional metadata for main numbers with special colors/highlighting.
   * If provided, use main_items[i].color_hex for individual ball colors.
   * If not provided, use draw_status_color for all main numbers.
   * Do NOT randomly highlight main numbers without API metadata.
   */
  main_items?: MainItem[]
  /**
   * Optional array of indices for highlighted main numbers.
   * Alternative to main_items for simpler highlighting.
   */
  highlighted_main_numbers?: (string | number)[]
  in_place_bonus?: InPlaceBonusMeta
  secondary_drawing?: ExtraItem
  secondary_drawings?: ExtraItem[]
  bonus_items: BonusItem[]
  extra_items: ExtraItem[]
  jackpot_next?: string
  jackpot_change?: string
  next_draw_text?: string
  next_draw_at_local?: string
  next_draw_timezone?: string
  next_draw_relative?: string
  /** Seconds until next draw for live countdown */
  countdown_seconds?: number
  draw_status?: string
  draw_status_color: "green" | "gray"
  source?: {
    provider: string
    url: string
  }
  logo_url?: string
  logo?: string
  icon_url?: string
  created_at?: string
  updated_at?: string
}

export interface PastDraw {
  id: number
  game_id: number
  game_name: string
  game_slug: string
  state_slug: string
  draw_date: string
  draw_time?: string
  main_numbers: number[]
  /** Optional metadata for main numbers with special colors/highlighting */
  main_items?: MainItem[]
  highlighted_main_numbers?: (string | number)[]
  in_place_bonus?: InPlaceBonusMeta
  bonus_items: BonusItem[]
  extra_items: ExtraItem[]
  jackpot_next?: string
  draw_status_color: "green" | "gray"
}

export interface StatItem {
  /** The number value — may be string or number depending on backend */
  number: number | string
  count: number
  percentage: number
  last_drawn?: string
  type: "main" | "bonus"
  label?: string
}

export interface HistoricalGame {
  // New backend format (official sources)
  game_slug?: string
  game_name?: string
  source_game_slug?: string
  // Legacy/alternate format
  id?: number
  name?: string
  slug?: string
  state_slug: string
  state_name: string
}

export interface HistoricalResult {
  id: number
  game_name: string
  game_slug: string
  state_name: string
  state_slug: string
  draw_date: string
  draw_time?: string
  main_numbers: number[]
  /** Optional metadata for main numbers with special colors/highlighting */
  main_items?: MainItem[]
  highlighted_main_numbers?: (string | number)[]
  in_place_bonus?: InPlaceBonusMeta
  bonus_items: BonusItem[]
  extra_items: ExtraItem[]
  jackpot_next?: string
  /** Optional — official backends may omit this; defaults to "gray" */
  draw_status_color?: "green" | "gray"
}

// API returns { count, items } where items are DrawResult objects
// We transform this to powerball/mega_millions structure for easier use
export interface PowerballMegaResponse {
  powerball?: DrawResult
  mega_millions?: DrawResult
}

// Raw API response format
export interface PowerballMegaAPIResponse {
  count: number
  items: DrawResult[]
}

// API Error Response
export interface APIError {
  message: string
  status: number
}

// Grouped types for UI
export interface GameSession {
  sessionName: string
  sessionSlug: string // Original API game slug for API calls
  sessionDisplaySlug?: string // URL-friendly slug for routing
  game: Game
  latestDraw?: DrawResult
}

export interface GameFamily {
  familyName: string
  familySlug: string
  sessions: GameSession[]
  state_slug: string
  state_name: string
  logo_url?: string
  logo?: string
  icon_url?: string
}
