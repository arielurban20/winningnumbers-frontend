"use client"

import { cn } from "@/lib/utils"
import { ExtraItemBadge } from "./ExtraItemBadge"
import type { ExtraItem } from "@/types/api"

interface ExtraItemsRowProps {
  items: ExtraItem[]
  centered?: boolean
  className?: string
}

/**
 * Row component for displaying extra items (Power Play, Megaplier, Fireball, etc.)
 * with consistent alignment under the number balls
 */
export function ExtraItemsRow({
  items,
  centered = true,
  className,
}: ExtraItemsRowProps) {
  if (!items || items.length === 0) return null

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 max-w-full",
        centered ? "justify-center" : "justify-start",
        className
      )}
    >
      {items.map((item, idx) => (
        <ExtraItemBadge
          key={`extra-${idx}`}
          label={item.label}
          value={item.value}
          colorHex={item.color_hex}
        />
      ))}
    </div>
  )
}
