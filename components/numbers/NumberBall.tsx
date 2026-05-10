"use client"

import { cn } from "@/lib/utils"
import type { DrawStatusColor } from "@/types/lottery"

interface NumberBallProps {
  number: number | string
  statusColor: DrawStatusColor
  size?: "xs" | "sm" | "md" | "lg"
  className?: string
  /** Optional hex color for highlighted balls (from main_items[].color_hex) */
  colorHex?: string
  /** If true, use colorHex instead of statusColor */
  isHighlighted?: boolean
}

// Mobile-first sizes - smaller on mobile, larger on desktop
const sizeClasses = {
  xs: "h-7 w-7 text-xs sm:h-8 sm:w-8 sm:text-sm",
  sm: "h-8 w-8 text-sm sm:h-9 sm:w-9",
  md: "h-9 w-9 text-sm sm:h-11 sm:w-11 sm:text-base",
  lg: "h-11 w-11 text-base sm:h-14 sm:w-14 sm:text-lg",
}

/**
 * Main number ball component with premium styling
 * Color is determined ONLY by draw_status_color from the API:
 * - "green" = emerald green background (current draw)
 * - "gray" = gray background (past draw)
 * 
 * IMPORTANT: Do not randomly highlight main numbers. 
 * Highlight only when API provides metadata (main_items[], highlighted_main_numbers[]).
 * Currently the API does not provide special metadata for main numbers,
 * so all main numbers use the same draw_status_color.
 * 
 * NOTE: This uses a distinct emerald shade to differentiate from 
 * bonus balls that may have similar green colors (e.g., Cash Pop)
 */
// Default fallback color for highlighted balls when no color_hex provided
const DEFAULT_HIGHLIGHTED_COLOR = "#C93442"

export function NumberBall({
  number,
  statusColor,
  size = "md",
  className,
  colorHex,
  isHighlighted = false,
}: NumberBallProps) {
  // Use custom color only when explicitly highlighted AND a colorHex is provided.
  // If colorHex is absent but isHighlighted is true, fall back to DEFAULT_HIGHLIGHTED_COLOR.
  // The old `(colorHex || true)` was always truthy — this is the corrected version.
  const useCustomColor = isHighlighted === true
  const customColor = colorHex || DEFAULT_HIGHLIGHTED_COLOR
  const isGreen = statusColor === "green"

  // Generate gradient colors for custom hex
  const getCustomGradient = (hex: string) => {
    // Darken the color for gradient bottom
    return `linear-gradient(to bottom, ${hex}, ${hex}dd)`
  }

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold tabular-nums flex-shrink-0",
        "transition-all duration-200 hover:scale-105",
        "shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_2px_rgba(255,255,255,0.25)]",
        "dark:shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.1)]",
        sizeClasses[size],
        !useCustomColor && isGreen
          ? "bg-gradient-to-b from-lottery-green to-[oklch(0.42_0.22_155)] text-white"
          : !useCustomColor
          ? "bg-gradient-to-b from-lottery-gray to-[oklch(0.45_0.015_260)] text-white"
          : "text-white",
        className
      )}
      style={useCustomColor ? { background: getCustomGradient(customColor) } : undefined}
      role="img"
      aria-label={`Number ${number}${isHighlighted ? " (highlighted)" : ""}`}
    >
      {number}
    </div>
  )
}
