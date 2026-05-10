"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ResultNumbersRow } from "@/components/numbers"
import { GameLogo } from "./GameLogo"
import { StatusBadge } from "./StatusBadge"
import { formatDrawDate } from "@/lib/utils/formatDate"
import { formatJackpot, formatJackpotChange } from "@/lib/utils/formatCurrency"
import { ArrowUp, ArrowDown, Trophy, Calendar } from "lucide-react"
import { NextDrawCountdown } from "./NextDrawCountdown"
import type { DrawResult } from "@/types/api"

interface NationalGameCardProps {
  draw: DrawResult
  href?: string
  featured?: boolean
}

/**
 * Detect if this is a Powerball draw
 */
function isPowerball(draw: DrawResult): boolean {
  const name = (draw.game_name || draw.game?.name || "").toLowerCase()
  const slug = (draw.game_slug || draw.game?.slug || "").toLowerCase()
  return name.includes("powerball") || slug.includes("powerball")
}

/**
 * Premium featured card for Powerball/Mega Millions
 * Powerball uses red branding, Mega Millions uses gold branding
 * Mobile-optimized with compact layout
 */
export function NationalGameCard({
  draw,
  href,
  featured = true,
}: NationalGameCardProps) {
  const mainNumbers = draw.main_numbers || []
  const mainItems = draw.main_items
  const bonusItems = draw.bonus_items || []
  const secondaryExtras = Array.isArray(draw.secondary_drawings)
    ? draw.secondary_drawings
    : draw.secondary_drawing
    ? [draw.secondary_drawing]
    : []
  const extraItems = [...(draw.extra_items || []), ...secondaryExtras]
  const jackpotChange = formatJackpotChange(draw.jackpot_change)
  const gameName = draw.game_name || draw.game?.name || "Lottery"
  
  const isRedBranding = isPowerball(draw)

  const content = (
    <Card
      className={`group h-full overflow-hidden transition-all duration-300 hover:shadow-2xl ${
        featured
          ? isRedBranding
            ? "border-2 border-lottery-red/30 bg-gradient-to-br from-card via-card to-lottery-red/5"
            : "border-2 border-lottery-gold/30 bg-gradient-to-br from-card via-card to-lottery-gold/5"
          : "border-border/50"
      }`}
    >
      {/* Gradient Header - Compact on mobile */}
      <CardHeader className="relative pb-3 sm:pb-5 p-4 sm:p-6">
        <div className={`absolute inset-0 ${
          isRedBranding 
            ? "bg-gradient-to-br from-lottery-red/10 via-lottery-red/5 to-transparent"
            : "bg-gradient-to-br from-lottery-gold/10 via-lottery-gold/5 to-transparent"
        }`} />
        <div className="relative flex items-start justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <GameLogo
              logoUrl={draw.logo_url}
              logo={draw.logo}
              iconUrl={draw.icon_url}
              gameName={gameName}
              gameSlug={draw.game_slug || draw.game?.slug}
              isMultistate={true}
              size="lg"
              className="sm:scale-100"
            />
            <div>
              <h2 className="text-lg sm:text-2xl font-bold tracking-tight">{gameName}</h2>
              <div className="mt-0.5 sm:mt-1 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {formatDrawDate(draw.draw_date)}
              </div>
            </div>
          </div>
          <StatusBadge statusColor={draw.draw_status_color} />
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 sm:gap-6 p-4 pt-0 sm:p-6 sm:pt-0">
        {/* Jackpot Section - Compact on mobile */}
        {draw.jackpot_next && (
          <div className={`relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-5 ${
            isRedBranding
              ? "bg-gradient-to-br from-lottery-red/20 via-lottery-red/10 to-transparent"
              : "bg-gradient-to-br from-lottery-gold/20 via-lottery-gold/10 to-transparent"
          }`}>
            <div className={`absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl ${
              isRedBranding ? "bg-lottery-red/15" : "bg-lottery-gold/10"
            }`} />
            <div className="relative text-center">
              <div className={`flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-muted-foreground`}>
                <Trophy className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isRedBranding ? "text-lottery-red" : "text-lottery-gold"}`} />
                Estimated Jackpot
              </div>
              <p className={`mt-1 sm:mt-2 text-2xl sm:text-4xl font-bold tracking-tight ${
                isRedBranding ? "text-lottery-red" : "text-lottery-gold"
              }`}>
                {formatJackpot(draw.jackpot_next)}
              </p>
              {jackpotChange.text && (
                <p className="mt-1 sm:mt-2 flex items-center justify-center gap-1 text-xs sm:text-sm font-medium">
                  {jackpotChange.isIncrease ? (
                    <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-lottery-green" />
                  ) : (
                    <ArrowDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                  )}
                  <span
                    className={
                      jackpotChange.isIncrease
                        ? "text-lottery-green"
                        : "text-destructive"
                    }
                  >
                    {jackpotChange.text}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Winning Numbers - Centered */}
        <div className="text-center">
          <p className="mb-2.5 sm:mb-4 text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Winning Numbers
          </p>
          <ResultNumbersRow
            mainNumbers={mainNumbers}
            mainItems={mainItems}
            bonusItems={bonusItems}
            extraItems={extraItems}
            statusColor={draw.draw_status_color}
            size="md"
            centered={true}
          />
        </div>

        {/* Next draw - Compact on mobile */}
        {(draw.next_draw_text || draw.next_draw_relative || draw.countdown_seconds != null) && (
          <div className="flex items-center gap-2 sm:gap-3 rounded-lg sm:rounded-xl bg-muted/50 p-3 sm:p-4">
            <NextDrawCountdown
              countdown_seconds={draw.countdown_seconds}
              next_draw_at_local={draw.next_draw_at_local}
              next_draw_timezone={draw.next_draw_timezone}
              next_draw_relative={draw.next_draw_relative}
              next_draw_text={draw.next_draw_text}
              variant="full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block h-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-xl">
        {content}
      </Link>
    )
  }

  return content
}
