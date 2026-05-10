"use client"

import { cn } from "@/lib/utils"
import type { DrawStatusColor } from "@/types/lottery"

interface StatusBadgeProps {
  statusColor: DrawStatusColor
  className?: string
}

/**
 * Premium status badge for Current/Previous draw indication
 */
export function StatusBadge({ statusColor, className }: StatusBadgeProps) {
  const isCurrent = statusColor === "green"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        "transition-all duration-200",
        isCurrent
          ? "bg-lottery-green/15 text-lottery-green border border-lottery-green/30"
          : "bg-muted text-muted-foreground border border-border",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isCurrent ? "bg-lottery-green animate-pulse" : "bg-muted-foreground/50"
        )}
      />
      {isCurrent ? "Current" : "Previous"}
    </span>
  )
}
