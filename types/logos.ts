/**
 * Logo System Types
 */

export interface LogoEntry {
  /** The path to the logo file relative to /public */
  path: string
  /** The game slug this logo is for */
  gameSlug: string
  /** The state slug if state-specific (e.g., "ca", "fl") */
  stateSlug?: string
  /** Alternative game names/slugs this logo can match */
  aliases?: string[]
  /** Whether this is a multi-state/national game logo */
  isMultiState?: boolean
  /** Logo format */
  format: "svg" | "png" | "webp"
  /** Logo variant: wordmark (rectangular), icon (square), or fallback */
  variant?: "wordmark" | "icon" | "fallback"
  /** Scale factor for logos with extra whitespace (1.0 = no scale) */
  scale?: number
  /** Custom max-width for this specific logo */
  maxWidth?: string
  /** Custom max-height for this specific logo */
  maxHeight?: string
  /** CSS object-position for precise positioning */
  objectPosition?: string
}

export interface LogoResolverOptions {
  /** The game name to find a logo for */
  gameName?: string
  /** The game slug to find a logo for */
  gameSlug?: string
  /** The state slug for state-specific logos */
  stateSlug?: string
  /** The state name for fallback display */
  stateName?: string
  /** Optional logo URL from API (takes priority) */
  logoUrl?: string
  /** Fallback to initials if no logo found */
  fallbackToInitials?: boolean
}

export interface ResolvedLogo {
  /** The resolved logo path or URL */
  src: string | null
  /** Alt text for the logo */
  alt: string
  /** Whether this is a fallback/initials display */
  isFallback: boolean
  /** Initials to display if fallback */
  initials?: string
  /** Background color for initials fallback */
  fallbackBgColor?: string
}

export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl"

export interface LotteryLogoProps {
  gameName: string
  gameSlug?: string
  stateName?: string
  stateSlug?: string
  logoUrl?: string
  size?: LogoSize
  priority?: boolean
  className?: string
}
