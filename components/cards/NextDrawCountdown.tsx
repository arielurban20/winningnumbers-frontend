"use client"

import { useEffect, useRef, useState } from "react"
import { Timer } from "lucide-react"

// Timezone slug -> human-readable label
const TIMEZONE_LABELS: Record<string, string> = {
  "America/New_York": "Eastern Time",
  "America/Chicago": "Central Time",
  "America/Denver": "Mountain Time",
  "America/Phoenix": "Arizona Time",
  "America/Los_Angeles": "Pacific Time",
  "America/Puerto_Rico": "Atlantic Time",
  "America/Anchorage": "Alaska Time",
  "Pacific/Honolulu": "Hawaii Time",
}

function tzLabel(tz?: string): string {
  if (!tz) return ""
  return TIMEZONE_LABELS[tz] || tz
}

function formatDuration(seconds: number): { compact: string; full: string } {
  if (seconds <= 0) {
    return { compact: "Drawing now", full: "Drawing now" }
  }

  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60

  const compact =
    h > 0
      ? `${h}h ${m}m`
      : m > 0
        ? `${m}m ${s}s`
        : `${s}s`

  const full =
    h > 0
      ? `${h} hour${h !== 1 ? "s" : ""} ${m} minute${m !== 1 ? "s" : ""} from now`
      : m > 0
        ? `${m} minute${m !== 1 ? "s" : ""} ${s} second${s !== 1 ? "s" : ""} from now`
        : `${s} second${s !== 1 ? "s" : ""} from now`

  return { compact, full }
}

interface NextDrawCountdownProps {
  /** Seconds until next draw (preferred for live countdown) */
  countdown_seconds?: number
  /** ISO datetime string for next draw in local time */
  next_draw_at_local?: string
  /** Timezone string e.g. "America/New_York" */
  next_draw_timezone?: string
  /** Human-readable relative text e.g. "in 2 days" */
  next_draw_relative?: string
  /** Fallback text e.g. "Next draw: Wednesday" */
  next_draw_text?: string
  /** compact = one-liner for cards; full = expanded for detail pages */
  variant?: "compact" | "full"
  className?: string
}

/**
 * Displays and counts down to the next lottery draw.
 *
 * Priority:
 *  1. countdown_seconds  -> live countdown updated every second (<1h) or minute (>=1h)
 *  2. next_draw_relative -> static text (e.g. "in 2 days")
 *  3. next_draw_text     -> fallback static text
 *  4. Nothing            -> render nothing
 *
 * Variants:
 *  compact  (cards)   : "Next: Sun 1:35 pm | 35m 22s"
 *  full (detail page) : "Next: Sun, May 3, 2026, 1:35 pm Eastern Time (GMT-5:00) · 35 minutes from now"
 */
export function NextDrawCountdown({
  countdown_seconds,
  next_draw_at_local,
  next_draw_timezone,
  next_draw_relative,
  next_draw_text,
  variant = "compact",
  className,
}: NextDrawCountdownProps) {
  const [remaining, setRemaining] = useState<number | null>(
    typeof countdown_seconds === "number" ? countdown_seconds : null
  )
  // Track whether we are mounted on the client so date formatting
  // uses the client's locale/timezone (avoids SSR hydration mismatch)
  const [mounted, setMounted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof countdown_seconds !== "number") return

    setRemaining(countdown_seconds)

    function tick(secs: number) {
      if (secs <= 0) {
        setRemaining(0)
        return
      }
      // Update every second when under 1 hour, else every 60 seconds
      const delay = secs < 3600 ? 1000 : 60000
      timerRef.current = setTimeout(() => {
        const next = secs - (secs < 3600 ? 1 : 60)
        setRemaining(Math.max(0, next))
        tick(Math.max(0, next))
      }, delay)
    }

    tick(countdown_seconds)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [countdown_seconds])

  // Format the next_draw_at_local date for display.
  // Only format after mount so server and client use the same initial value,
  // preventing the hydration mismatch caused by timezone differences.
  let dateLabel = ""
  if (mounted && next_draw_at_local) {
    try {
      const d = new Date(next_draw_at_local)
      if (!isNaN(d.getTime())) {
        if (variant === "compact") {
          // "Sun 1:35 pm"
          dateLabel = d.toLocaleDateString("en-US", {
            weekday: "short",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
        } else {
          // "Sun, May 3, 2026, 1:35 pm Eastern Time"
          const tz = tzLabel(next_draw_timezone)
          dateLabel = d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }) + (tz ? ` ${tz}` : "")
        }
      }
    } catch {
      // ignore parse errors
    }
  }

  // Build countdown string
  let countdownLabel = ""
  if (remaining !== null) {
    const { compact, full } = formatDuration(remaining)
    countdownLabel = variant === "compact" ? compact : full
  } else if (next_draw_relative) {
    countdownLabel = next_draw_relative
  }

  // Nothing to show
  if (!dateLabel && !countdownLabel && !next_draw_text) return null

  if (variant === "compact") {
    const parts = [dateLabel, countdownLabel].filter(Boolean)
    const display = parts.length > 0 ? parts.join(" | ") : next_draw_text

    return (
      <span className={className}>
        Next: <span className="text-foreground font-medium">{display}</span>
      </span>
    )
  }

  // Full variant
  const fullParts = [dateLabel, countdownLabel].filter(Boolean)
  const fullDisplay =
    fullParts.length > 0 ? fullParts.join(" · ") : next_draw_text

  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Timer className="h-4 w-4 shrink-0" />
        <span>Next Drawing</span>
      </div>
      <p className="mt-0.5 text-base font-semibold">{fullDisplay}</p>
    </div>
  )
}
