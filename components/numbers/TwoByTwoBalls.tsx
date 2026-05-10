"use client"

import { cn } from "@/lib/utils"
import type { ExtraItem } from "@/types/api"

interface TwoByTwoBallsProps {
  extraItems: ExtraItem[]
  mainNumbers?: (string | number)[]
  size?: "xs" | "sm" | "md" | "lg"
  centered?: boolean
  className?: string
}

// Colors for 2by2
const RED_COLOR = "#d32f2f"
const WHITE_BG = "#f5f5f5"
const WHITE_TEXT = "#111111"

interface TwoByTwoData {
  red: (string | number)[]
  white: (string | number)[]
}

/**
 * Extract red and white numbers from extra_items
 * API format: 
 * { label: "Red Numbers", value: ["8", "26"], color_hex: "#d32f2f" }
 * { label: "White Numbers", value: ["15", "24"], color_hex: null }
 */
function extractTwoByTwoNumbers(extraItems: ExtraItem[]): TwoByTwoData {
  const red: (string | number)[] = []
  const white: (string | number)[] = []
  
  for (const item of extraItems) {
    const label = String(item.label || "").toLowerCase()
    
    // Value can be an array or a single value
    let numbers: (string | number)[] = []
    if (Array.isArray(item.value)) {
      numbers = item.value.map(v => {
        const num = parseInt(String(v), 10)
        return isNaN(num) ? v : num
      })
    } else if (item.value !== undefined && item.value !== null) {
      const strVal = String(item.value)
      // 2by2 official sources sometimes send "1-19" / "Red Numbers: 1-19".
      // Always extract all numeric tokens first.
      const numericTokens = strVal.match(/\d+/g)
      if (numericTokens && numericTokens.length > 0) {
        numbers = numericTokens.map((token) => {
          const num = parseInt(token, 10)
          return isNaN(num) ? token : num
        })
      } else if (strVal.includes(",")) {
        numbers = strVal.split(",").map(v => {
          const num = parseInt(v.trim(), 10)
          return isNaN(num) ? v.trim() : num
        })
      } else {
        const num = parseInt(strVal, 10)
        numbers = [isNaN(num) ? strVal : num]
      }
    }
    
    if (label.includes("red")) {
      red.push(...numbers)
    } else if (label.includes("white")) {
      white.push(...numbers)
    }
  }
  
  return { red, white }
}

/**
 * 2by2 lottery display component
 * Shows red balls + white balls format: 8 26 + 15 24
 */
export function TwoByTwoBalls({
  extraItems,
  mainNumbers = [],
  size = "md",
  centered = true,
  className,
}: TwoByTwoBallsProps) {
  const { red, white } = extractTwoByTwoNumbers(extraItems)
  
  // If no extra_items data, use main_numbers as fallback
  // First half red, second half white
  const hasValidExtraData =
    red.length >= 2 &&
    white.length >= 2 &&
    red.length + white.length >= 4
  
  const redNumbers = hasValidExtraData
    ? red.slice(0, 2)
    : mainNumbers.slice(0, Math.ceil(mainNumbers.length / 2))
  const whiteNumbers = hasValidExtraData
    ? white.slice(0, 2)
    : mainNumbers.slice(Math.ceil(mainNumbers.length / 2))

  // If nothing to render, return null
  if (redNumbers.length === 0 && whiteNumbers.length === 0) {
    return null
  }

  // Ball sizes - using fixed min-width/height for consistency
  const ballSizes = {
    xs: "min-w-[26px] w-[26px] h-[26px] text-[11px]",
    sm: "min-w-[30px] w-[30px] h-[30px] text-xs",
    md: "min-w-[36px] w-[36px] h-[36px] text-sm",
    lg: "min-w-[44px] w-[44px] h-[44px] text-base",
  }

  const ballClasses = cn(
    "flex items-center justify-center rounded-full font-bold flex-shrink-0",
    "transition-transform hover:scale-105",
    ballSizes[size]
  )

  const plusSizes = {
    xs: "text-xs mx-0.5",
    sm: "text-sm mx-1",
    md: "text-base mx-1.5",
    lg: "text-lg mx-2",
  }

  const plusClasses = cn(
    "font-bold text-muted-foreground flex-shrink-0",
    plusSizes[size]
  )

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-1 sm:gap-1.5",
      centered && "justify-center",
      className
    )}>
      {/* Red Numbers */}
      {redNumbers.map((num, idx) => (
        <div
          key={`red-${idx}`}
          className={ballClasses}
          style={{ 
            backgroundColor: RED_COLOR, 
            color: "white",
            boxShadow: `0 2px 4px ${RED_COLOR}40, inset 0 1px 2px rgba(255,255,255,0.2)`
          }}
        >
          {num}
        </div>
      ))}
      
      {/* Plus sign separator */}
      {redNumbers.length > 0 && whiteNumbers.length > 0 && (
        <span className={plusClasses}>+</span>
      )}
      
      {/* White Numbers */}
      {whiteNumbers.map((num, idx) => (
        <div
          key={`white-${idx}`}
          className={cn(ballClasses, "border border-gray-300")}
          style={{ 
            backgroundColor: WHITE_BG, 
            color: WHITE_TEXT,
            boxShadow: "0 2px 4px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.5)"
          }}
        >
          {num}
        </div>
      ))}
    </div>
  )
}

/**
 * Check if a game is 2by2 based on slug or extra_items
 */
export function isTwoByTwo(gameSlug?: string, extraItems?: ExtraItem[]): boolean {
  // Check slug
  if (gameSlug) {
    const slug = gameSlug.toLowerCase()
    if (slug.includes("2by2") || slug === "2-by-2") {
      return true
    }
  }
  
  // Check extra_items for Red/White Number labels
  if (extraItems && extraItems.length > 0) {
    const hasRed = extraItems.some(item => {
      const label = String(item.label || "").toLowerCase()
      return label.includes("red") && label.includes("number")
    })
    const hasWhite = extraItems.some(item => {
      const label = String(item.label || "").toLowerCase()
      return label.includes("white") && label.includes("number")
    })
    return hasRed && hasWhite
  }
  
  return false
}
