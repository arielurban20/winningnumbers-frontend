"use client"

import { cn } from "@/lib/utils"
import { ExtraItemBadge } from "./ExtraItemBadge"
import type { ExtraItem } from "@/types/api"

interface ExtraItemsRowProps {
  items: ExtraItem[]
  centered?: boolean
  className?: string
}

type ExtraDisplayKind = "add_on" | "multiplier" | "other"

function normalize(value?: string | null): string {
  return String(value || "")
    .trim()
    .toLowerCase()
}

function classifyExtra(item: ExtraItem): ExtraDisplayKind {
  const type = normalize(item.type)
  const label = normalize(item.name || item.label)

  if (type === "add_on") return "add_on"
  if (type === "multiplier") return "multiplier"

  if (
    label.includes("kicker") ||
    label.includes("ez match") ||
    label.includes("ezmatch") ||
    label.includes("fireball") ||
    label.includes("wild ball") ||
    label.includes("super ball") ||
    label.includes("sum it up")
  ) {
    return "add_on"
  }

  if (
    label.includes("power play") ||
    label.includes("powerplay") ||
    label.includes("megaplier") ||
    label.includes("multiplier") ||
    label.includes("all star bonus") ||
    label.includes("xtra")
  ) {
    return "multiplier"
  }

  return "other"
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

  const normalizedItems = items
    .map((item) => ({
      ...item,
      label: item.name || item.label || "Extra",
      _kind: classifyExtra(item),
    }))
    .filter((item) => item.label && String(item.value ?? "").trim().length > 0)
    .sort((a, b) => {
      const rank: Record<ExtraDisplayKind, number> = {
        add_on: 0,
        multiplier: 1,
        other: 2,
      }
      return rank[a._kind] - rank[b._kind]
    })

  if (normalizedItems.length === 0) return null

  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 max-w-full",
        centered ? "justify-center" : "justify-start",
        className
      )}
    >
      {normalizedItems.map((item, idx) => (
        <ExtraItemBadge
          key={`extra-${idx}`}
          label={item.label}
          value={item.value}
          colorHex={item.color_hex}
          className={cn(item._kind === "add_on" && "bg-primary/10 border-primary/30 text-primary")}
        />
      ))}
    </div>
  )
}
