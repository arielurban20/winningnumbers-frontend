/**
 * Normalize a string to a URL-safe slug
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

/**
 * Convert a slug back to a readable name
 */
export function slugToName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Get initials from a name (for logo fallback)
 */
export function getInitials(name: string, maxLength: number = 2): string {
  const words = name.split(/\s+/)
  if (words.length === 1) {
    return name.substring(0, maxLength).toUpperCase()
  }
  return words
    .slice(0, maxLength)
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
}

/**
 * Check if a slug matches a family slug pattern
 * Handles cases like "pick-3-day" matching family "pick-3"
 */
export function slugMatchesFamily(gameSlug: string, familySlug: string): boolean {
  return (
    gameSlug === familySlug ||
    gameSlug.startsWith(`${familySlug}-`)
  )
}

/**
 * Extract game family slug from a game slug
 * Removes session suffixes like "-day", "-night", "-midday", "-evening"
 */
export function getGameFamilySlug(gameSlug: string): string {
  const sessionSuffixes = [
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
    "day",
    "dia",
    "eve",
    "mid",
  ].sort((a, b) => b.length - a.length)

  let familySlug = gameSlug.toLowerCase().replace(/-[a-z]{2}$/i, "")

  // Cash Pop has many session-variant suffixes by state. Treat all variants as
  // one family key for grouping/auditing.
  if (familySlug === "cash-pop") return "cash-pop"
  if (familySlug.startsWith("cash-pop-")) return "cash-pop"

  // Dynamic time suffixes:
  // - pick-4-1pm-or
  // - pick-4-10pm-or
  // - dc-3-1-50pm-dc
  const tokens = familySlug.split("-").filter(Boolean)
  if (tokens.length >= 2) {
    const lastToken = tokens[tokens.length - 1]
    const hourOnly = lastToken.match(/^(\d{1,2})(am|pm)$/i)
    if (hourOnly) {
      const hour = parseInt(hourOnly[1], 10)
      if (hour >= 1 && hour <= 12) {
        return tokens.slice(0, -1).join("-")
      }
    }

    const minuteWithMeridiem = lastToken.match(/^([0-5]\d)(am|pm)$/i)
    if (minuteWithMeridiem && tokens.length >= 3) {
      const hourToken = tokens[tokens.length - 2]
      if (/^\d{1,2}$/.test(hourToken)) {
        const hour = parseInt(hourToken, 10)
        if (hour >= 1 && hour <= 12) {
          return tokens.slice(0, -2).join("-")
        }
      }
    }
  }

  for (const suffix of sessionSuffixes) {
    const marker = `-${suffix}`
    if (familySlug.endsWith(marker)) {
      familySlug = familySlug.slice(0, -marker.length)
      break
    }
  }

  return familySlug
}
