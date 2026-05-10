"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { GameLogo } from "./GameLogo"
import { ResultNumbersRow } from "@/components/numbers"
import { StatusBadge } from "./StatusBadge"
import { formatDrawDate } from "@/lib/utils/formatDate"
import type { DrawResult } from "@/types/api"

interface LotteryResultCardProps {
  draw: DrawResult
  href?: string
}

/**
 * Single game result card - simplified version without session navigation
 */
export function LotteryResultCard({ draw, href }: LotteryResultCardProps) {
  const gameName = draw.game_name || draw.game?.name || "Lottery Game"
  const stateName = draw.state_name || draw.state?.name || ""
  const secondaryExtras = Array.isArray(draw.secondary_drawings)
    ? draw.secondary_drawings
    : draw.secondary_drawing
    ? [draw.secondary_drawing]
    : []
  const mergedExtras = [...(draw.extra_items || []), ...secondaryExtras]
  
  const content = (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GameLogo
              logoUrl={draw.logo_url}
              logo={draw.logo}
              iconUrl={draw.icon_url}
              gameName={gameName}
              gameSlug={draw.game_slug || draw.game?.slug}
              stateSlug={draw.state_slug || draw.state?.slug}
              size="sm"
            />
            <div>
              <h3 className="font-semibold leading-tight">{gameName}</h3>
              {stateName && (
                <p className="text-sm text-muted-foreground">{stateName}</p>
              )}
            </div>
          </div>
          <StatusBadge statusColor={draw.draw_status_color} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          {formatDrawDate(draw.draw_date)}
        </div>
        <ResultNumbersRow
          mainNumbers={draw.main_numbers}
          mainItems={draw.main_items}
          bonusItems={draw.bonus_items}
          extraItems={mergedExtras}
          statusColor={draw.draw_status_color}
          gameSlug={draw.game_slug || draw.game?.slug}
          size="md"
        />
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    )
  }

  return content
}
