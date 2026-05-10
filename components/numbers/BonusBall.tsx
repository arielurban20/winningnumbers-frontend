"use client"

import { cn } from "@/lib/utils"

interface BonusBallProps {
  number: number | string
  colorHex?: string | null
  label: string
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
}

// Mobile-first sizes - smaller on mobile, larger on desktop
const sizeClasses = {
  xs: "h-7 w-7 text-xs sm:h-8 sm:w-8 sm:text-sm",
  sm: "h-8 w-8 text-sm sm:h-9 sm:w-9",
  md: "h-9 w-9 text-sm sm:h-11 sm:w-11 sm:text-base",
  lg: "h-11 w-11 text-base sm:h-14 sm:w-14 sm:text-lg",
}

/**
 * Determine if a color is light or dark for text contrast
 */
function isLightColor(hex: string): boolean {
  const color = hex.replace("#", "")
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

/**
 * Darken a hex color by a percentage
 */
function darkenColor(hex: string, percent: number): string {
  const color = hex.replace("#", "")
  const r = Math.max(0, parseInt(color.substring(0, 2), 16) * (1 - percent))
  const g = Math.max(0, parseInt(color.substring(2, 4), 16) * (1 - percent))
  const b = Math.max(0, parseInt(color.substring(4, 6), 16) * (1 - percent))
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`
}

/**
 * Bonus ball component with premium styling
 * CRITICAL: Always uses color_hex from API - never overridden by status color
 */
export function BonusBall({
  number,
  colorHex,
  label,
  size = "md",
  className,
}: BonusBallProps) {
  // Handle null/undefined colorHex with fallback color
  const defaultColor = "#d32f2f"
  const validColorHex = colorHex || defaultColor
  const normalizedColor = validColorHex.startsWith("#") ? validColorHex : `#${validColorHex}`
  const textColor = isLightColor(normalizedColor) ? "#1a1a1a" : "#ffffff"
  const darkerColor = darkenColor(normalizedColor, 0.25)

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold tabular-nums flex-shrink-0",
        "transition-all duration-200 hover:scale-105",
        "ring-2 ring-background shadow-lg",
        "shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.3)]",
        "dark:shadow-[0_2px_8px_rgba(0,0,0,0.5),inset_0_1px_2px_rgba(255,255,255,0.15)]",
        sizeClasses[size],
        className
      )}
      style={{
        background: `linear-gradient(to bottom, ${normalizedColor}, ${darkerColor})`,
        color: textColor,
      }}
      role="img"
      aria-label={`${label} number ${number}`}
    >
      {number}
    </div>
  )
}
