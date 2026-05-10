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
  const sessionPatterns = [
    /-day$/,
    /-night$/,
    /-midday$/,
    /-evening$/,
    /-morning$/,
    /-afternoon$/,
    /-matutino$/,
    /-noche$/,
    /-dia$/,
  ]
  
  let familySlug = gameSlug
  for (const pattern of sessionPatterns) {
    familySlug = familySlug.replace(pattern, "")
  }
  
  return familySlug
}
