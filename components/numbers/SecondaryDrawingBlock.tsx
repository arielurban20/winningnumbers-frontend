"use client"

import { cn } from "@/lib/utils"
import { NumberBall } from "./NumberBall"
import type { SecondaryDrawing } from "@/lib/utils/parseSecondaryDrawings"
import type { DrawStatusColor } from "@/types/lottery"

interface SecondaryDrawingBlockProps {
  drawing: SecondaryDrawing
  statusColor: DrawStatusColor
  size?: "xs" | "sm" | "md" | "lg"
  centered?: boolean
  className?: string
}

/**
 * Renders a secondary drawing (like Double Play) as a proper number row
 * instead of a small badge. Used for games like NJ Pick 6, FL Lotto, etc.
 */
export function SecondaryDrawingBlock({
  drawing,
  statusColor,
  size = "sm",
  centered = true,
  className,
}: SecondaryDrawingBlockProps) {
  const highlightedFromMainItems =
    drawing.mainItems && drawing.mainItems.length > 0
      ? drawing.mainItems.map((item, idx) => {
          const num = item.value ?? item.number ?? drawing.numbers[idx] ?? 0
          const shouldHighlight = item.is_highlighted === true
          return (
            <NumberBall
              key={`secondary-main-item-${idx}`}
              number={num}
              statusColor={statusColor}
              size={size}
              colorHex={shouldHighlight ? (item.color_hex || "#ef4444") : undefined}
              isHighlighted={shouldHighlight}
            />
          )
        })
      : null

  const inPlaceTargetPosition = (() => {
    const bonus = drawing.inPlaceBonus
    if (!bonus || drawing.numbers.length === 0) return null

    const explicitPos =
      typeof bonus.target_position === "number"
        ? bonus.target_position
        : typeof bonus.position === "number"
        ? bonus.position
        : null
    if (explicitPos && explicitPos >= 1 && explicitPos <= drawing.numbers.length) {
      return explicitPos
    }

    const rawValue = bonus.value
    const parsedValue =
      typeof rawValue === "number"
        ? rawValue
        : typeof rawValue === "string"
        ? parseInt(rawValue, 10)
        : NaN
    if (isNaN(parsedValue)) return null

    const idx = drawing.numbers.findIndex((n) => Number(n) === parsedValue)
    return idx !== -1 ? idx + 1 : null
  })()

  const highlightedValueSet = new Set(
    (drawing.highlightedMainNumbers || []).map((v) => String(v))
  )

  return (
    <div className={cn("space-y-2", className)}>
      {/* Label */}
      <div
        className={cn(
          "text-xs font-medium text-muted-foreground uppercase tracking-wider",
          centered && "text-center"
        )}
      >
        {drawing.label}
      </div>
      
      {/* Number balls */}
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5",
          centered && "justify-center"
        )}
      >
        {highlightedFromMainItems
          ? highlightedFromMainItems
          : drawing.numbers.map((num, idx) => {
              const position = idx + 1
              const matchesPosition = inPlaceTargetPosition === position
              const matchesValue = highlightedValueSet.has(String(num))
              const shouldHighlight = matchesPosition || (!inPlaceTargetPosition && matchesValue)
              const colorHex =
                (matchesPosition && drawing.inPlaceBonus?.color_hex) ||
                (shouldHighlight ? "#ef4444" : undefined)

              return (
                <NumberBall
                  key={`secondary-${idx}`}
                  number={num}
                  statusColor={statusColor}
                  size={size}
                  colorHex={colorHex || undefined}
                  isHighlighted={shouldHighlight}
                />
              )
            })}
      </div>
    </div>
  )
}

interface SecondaryDrawingsListProps {
  drawings: SecondaryDrawing[]
  statusColor: DrawStatusColor
  size?: "xs" | "sm" | "md" | "lg"
  centered?: boolean
  className?: string
}

/**
 * Renders multiple secondary drawings in a list
 */
export function SecondaryDrawingsList({
  drawings,
  statusColor,
  size = "sm",
  centered = true,
  className,
}: SecondaryDrawingsListProps) {
  if (!drawings || drawings.length === 0) return null

  return (
    <div className={cn("space-y-4 pt-2 border-t border-border/30", className)}>
      {drawings.map((drawing, idx) => (
        <SecondaryDrawingBlock
          key={`secondary-drawing-${idx}`}
          drawing={drawing}
          statusColor={statusColor}
          size={size}
          centered={centered}
        />
      ))}
    </div>
  )
}
