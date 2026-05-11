"use client"

import Link from "next/link"
import { ResultNumbersRow } from "@/components/numbers"
import { StatusBadge } from "./StatusBadge"
import { formatDrawDate } from "@/lib/utils/formatDate"
import { formatJackpot } from "@/lib/utils/formatCurrency"
import { Calendar, Trophy, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NextDrawCountdown } from "./NextDrawCountdown"
import type { DrawResult } from "@/types/api"

interface SessionResultBlockProps {
  sessionName: string
  sessionDisplaySlug?: string
  stateSlug: string
  familySlug: string
  draw: DrawResult
  showSessionName?: boolean
  clickable?: boolean
  gameSlug?: string
  variant?: "default" | "compact" | "individualCompact"
}

/**
 * Premium session result block within a grouped card
 * Now clickable to navigate to individual session pages
 * Mobile-optimized with compact layout
 */
export function SessionResultBlock({
  sessionName,
  sessionDisplaySlug,
  stateSlug,
  familySlug,
  draw,
  showSessionName = true,
  clickable = true,
  gameSlug,
  variant = "default",
}: SessionResultBlockProps) {
  const mainNumbers = draw.main_numbers || []
  const mainItems = draw.main_items
  const bonusItems = draw.bonus_items || []
  const secondaryExtras = Array.isArray(draw.secondary_drawings)
    ? draw.secondary_drawings
    : draw.secondary_drawing
    ? [draw.secondary_drawing]
    : []
  const extraItems = [...(draw.extra_items || []), ...secondaryExtras]
  
  const sessionUrl = sessionDisplaySlug 
    ? `/states/${stateSlug}/${familySlug}/${sessionDisplaySlug}`
    : `/states/${stateSlug}/${familySlug}`

  const isMainSession = sessionName === "Main" || !sessionName
  const isCompactVariant = variant === "compact" || variant === "individualCompact"
  const isIndividualCompact = variant === "individualCompact"
  const hasSecondaryDrawings =
    secondaryExtras.length > 0 ||
    extraItems.some((item) => item?.type === "secondary_drawing")
  const visibleMainCount = mainItems?.length || mainNumbers.length

  const numberSize = (() => {
    if (!isCompactVariant) return "sm" as const
    if (isIndividualCompact) {
      if (visibleMainCount <= 6 && !hasSecondaryDrawings) return "sm" as const
      return "md" as const
    }
    if (visibleMainCount <= 3 && !hasSecondaryDrawings) return "xs" as const
    if (visibleMainCount <= 5 && !hasSecondaryDrawings) return "sm" as const
    return "md" as const
  })()

  return (
    <div
      className={isIndividualCompact
        ? "flex flex-col gap-2 rounded-lg bg-muted/20 px-2.5 py-2.5 sm:px-3 sm:py-3 md:gap-2.5 md:px-3.5 md:py-3.5 lg:rounded-xl lg:bg-muted/25 lg:px-4 lg:py-4"
        : isCompactVariant
        ? "flex flex-col gap-2 sm:gap-2.5 rounded-lg bg-muted/25 px-2.5 py-2.5 sm:px-3 sm:py-3"
        : "flex flex-col gap-2.5 sm:gap-4 rounded-lg sm:rounded-xl bg-muted/30 p-3 sm:p-4"}
    >
      {/* Session header - Compact on mobile */}
      <div className={isIndividualCompact
        ? "flex flex-wrap items-center justify-between gap-1.5 md:gap-2"
        : isCompactVariant
        ? "flex flex-wrap items-center justify-between gap-1.5 sm:gap-2.5"
        : "flex flex-wrap items-center justify-between gap-2 sm:gap-3"}>
        <div className="flex items-center gap-2 sm:gap-3">
          {showSessionName && !isMainSession && (
            <span className={isIndividualCompact
              ? "inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground sm:px-2 sm:text-xs"
              : isCompactVariant
              ? "inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-secondary-foreground sm:px-2 sm:text-xs"
              : "inline-flex items-center rounded-md sm:rounded-lg bg-secondary px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs sm:text-sm font-semibold text-secondary-foreground"}>
              {sessionName}
            </span>
          )}
          <span className={isIndividualCompact
            ? "flex items-center gap-1 text-[11px] text-muted-foreground sm:text-xs md:text-sm"
            : isCompactVariant
            ? "flex items-center gap-1 text-[11px] text-muted-foreground sm:text-xs"
            : "flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground"}>
            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            {formatDrawDate(draw.draw_date)}
          </span>
        </div>
        <StatusBadge
          statusColor={draw.draw_status_color}
          className={isCompactVariant ? "px-2 py-0.5 text-[10px] sm:text-xs md:text-xs" : undefined}
        />
      </div>

      {/* Centered numbers section - Smaller on mobile */}
      <div className={isCompactVariant ? "flex justify-center py-0.5 sm:py-1 md:py-1.5" : "flex justify-center py-1 sm:py-2"}>
        <ResultNumbersRow
          mainNumbers={mainNumbers}
          mainItems={mainItems}
          bonusItems={bonusItems}
          extraItems={extraItems}
          statusColor={draw.draw_status_color}
          gameSlug={gameSlug || draw.game_slug || draw.game?.slug}
          size={numberSize}
          centered={true}
        />
      </div>

      {/* Jackpot and next draw info - Compact on mobile */}
      {(draw.jackpot_next || draw.next_draw_text || draw.next_draw_relative || draw.countdown_seconds != null) && (
        <div className={isIndividualCompact
          ? "mx-auto flex w-full max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-md bg-background/50 px-2.5 py-1.5 text-[11px] sm:gap-x-4 sm:px-3 sm:py-2 sm:text-xs md:text-sm"
          : isCompactVariant
          ? "mx-auto flex w-full max-w-lg flex-wrap items-center justify-center gap-x-3 gap-y-1 rounded-md bg-background/50 px-2 py-1.5 text-[11px] sm:gap-x-4 sm:px-2.5 sm:py-2 sm:text-xs"
          : "flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-1.5 sm:gap-y-2 rounded-md sm:rounded-lg bg-background/50 p-2 sm:p-3 text-xs sm:text-sm"}>
          {draw.jackpot_next && (
            <div className={isCompactVariant ? "flex items-center gap-1.5" : "flex items-center gap-1.5 sm:gap-2"}>
              <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-lottery-gold" />
              <span className="font-bold text-lottery-gold">
                {formatJackpot(draw.jackpot_next)}
              </span>
            </div>
          )}
          {(draw.next_draw_text || draw.next_draw_relative || draw.countdown_seconds != null) && (
            <NextDrawCountdown
              countdown_seconds={draw.countdown_seconds}
              next_draw_at_local={draw.next_draw_at_local}
              next_draw_timezone={draw.next_draw_timezone}
              next_draw_relative={draw.next_draw_relative}
              next_draw_text={draw.next_draw_text}
              variant="compact"
              className={isIndividualCompact
                ? "text-muted-foreground text-[11px] sm:text-xs md:text-sm"
                : isCompactVariant
                ? "text-muted-foreground text-[11px] sm:text-xs"
                : "text-muted-foreground"}
            />
          )}
        </div>
      )}

      {/* View session link - Compact on mobile */}
      {clickable && !isMainSession && (
        <div className="flex justify-center">
          <Button asChild variant="ghost" size="sm" className={isCompactVariant ? "text-primary h-7 text-[11px] sm:h-8 sm:text-xs" : "text-primary h-7 text-xs sm:h-9 sm:text-sm"}>
            <Link href={sessionUrl}>
              View {sessionName}
              <ArrowRight className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
