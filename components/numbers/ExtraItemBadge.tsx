"use client"

import { cn } from "@/lib/utils"

interface ExtraItemBadgeProps {
  label: string
  value: string | number | (string | number)[]
  colorHex?: string | null
  className?: string
}

function normalizeLabel(label: string): string {
  const normalized = label.trim().toLowerCase()
  if (normalized === "ezmatch") return "EZmatch"
  if (normalized === "ez match") return "EZ Match"
  if (normalized === "xtra") return "Xtra"
  if (normalized === "kicker") return "Kicker"
  return label
}

function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "")
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

/**
 * Extra item badge for Power Play, Megaplier, Fireball, etc.
 * Modern pill design with subtle color support
 */
export function ExtraItemBadge({
  label,
  value,
  colorHex,
  className,
}: ExtraItemBadgeProps) {
  const displayLabel = normalizeLabel(label)
  // Format value - arrays are joined with commas
  const displayValue = Array.isArray(value) ? value.join(", ") : value
  const hasCustomColor = colorHex && colorHex.length >= 6
  const normalizedColor = hasCustomColor
    ? colorHex!.startsWith("#") ? colorHex : `#${colorHex}`
    : null

  if (normalizedColor) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
          "text-xs font-semibold tracking-wide",
          "shadow-sm transition-all duration-200 hover:scale-105",
          className
        )}
        style={{
          backgroundColor: `${normalizedColor}20`,
          color: normalizedColor,
          border: `1px solid ${normalizedColor}40`,
        }}
      >
        <span className="opacity-80">{displayLabel}</span>
        <span className="font-bold">{displayValue}</span>
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
        "text-xs font-semibold tracking-wide",
        "bg-secondary text-secondary-foreground border border-border/50",
        "shadow-sm transition-all duration-200 hover:scale-105",
        className
      )}
    >
      <span className="opacity-80">{displayLabel}</span>
      <span className="font-bold">{displayValue}</span>
    </span>
  )
}
