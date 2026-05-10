export function toFamilyAnchorId(familySlug: string): string {
  const safeSlug = familySlug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  return `game-${safeSlug}`
}
