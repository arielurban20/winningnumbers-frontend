import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GameLogo } from "@/components/cards/GameLogo"
import { formatJackpot } from "@/lib/utils/formatCurrency"
import { buildStateUrl, buildFamilyUrl, buildNationalGameUrl } from "@/lib/utils/buildLotteryLinks"
import { Clock, Trophy, ArrowRight } from "lucide-react"
import type { DrawResult } from "@/types/api"

interface UpcomingDrawingsSectionProps {
  draws: DrawResult[]
}

export function UpcomingDrawingsSection({ draws }: UpcomingDrawingsSectionProps) {
  // Only include draws that have next draw info
  const upcoming = draws
    .filter(
      (d) =>
        d &&
        (d.next_draw_text || d.next_draw_relative || d.next_draw_at_local)
    )
    // Deduplicate by game slug
    .filter(
      (d, idx, arr) =>
        arr.findIndex((x) => (x.game_slug || x.game?.slug) === (d.game_slug || d.game?.slug)) === idx
    )
    .slice(0, 8)

  if (upcoming.length === 0) return null

  return (
    <section aria-labelledby="upcoming-drawings-heading">
      <div className="mb-4 sm:mb-6">
        <h2
          id="upcoming-drawings-heading"
          className="text-xl sm:text-2xl font-bold tracking-tight lg:text-3xl"
        >
          Upcoming Drawings
        </h2>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">
          See which lottery games are drawing next.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {upcoming.map((draw, idx) => (
          <UpcomingDrawCard key={draw.id ?? idx} draw={draw} />
        ))}
      </div>
    </section>
  )
}

function UpcomingDrawCard({ draw }: { draw: DrawResult }) {
  const gameSlug = draw.game_slug || draw.game?.slug || ""
  const gameName = draw.game_name || draw.game?.name || "Lottery"
  const stateSlug = draw.state_slug || draw.state?.slug || ""
  const stateName = draw.state_name || draw.state?.name || ""
  const isMultistate = draw.game?.slug === "powerball" || draw.game?.slug === "mega-millions" ||
    gameSlug === "powerball" || gameSlug === "mega-millions"

  const stateLabel = isMultistate ? "Multi-State" : stateName || ""

  const nextDrawLabel =
    draw.next_draw_relative ||
    draw.next_draw_text ||
    (draw.next_draw_at_local
      ? new Date(draw.next_draw_at_local).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })
      : "")

  let href = "/games"
  if (gameSlug === "powerball" || gameSlug === "mega-millions") {
    href = buildNationalGameUrl(gameSlug)
  } else if (stateSlug && gameSlug) {
    href = buildFamilyUrl(stateSlug, gameSlug)
  } else if (stateSlug) {
    href = buildStateUrl(stateSlug)
  }

  const jackpot = draw.jackpot_next ? formatJackpot(draw.jackpot_next) : null

  return (
    <Link
      href={href}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
      aria-label={`Upcoming drawing for ${gameName}`}
    >
      <Card className="h-full border-border/50 bg-card/50 transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-md">
        <CardContent className="flex flex-col gap-3 p-4">
          {/* Game identity */}
          <div className="flex items-center gap-3">
            <GameLogo
              logoUrl={draw.logo_url}
              logo={draw.logo}
              iconUrl={draw.icon_url}
              gameName={gameName}
              gameSlug={gameSlug}
              isMultistate={isMultistate}
              size="sm"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-semibold leading-tight truncate">{gameName}</h3>
              {stateLabel && (
                <p className="text-xs text-muted-foreground truncate">{stateLabel}</p>
              )}
            </div>
          </div>

          {/* Jackpot */}
          {jackpot && (
            <div className="flex items-center gap-1.5 text-sm">
              <Trophy className="h-3.5 w-3.5 shrink-0 text-lottery-gold" />
              <span className="font-semibold text-lottery-gold truncate">{jackpot}</span>
            </div>
          )}

          {/* Next draw time */}
          {nextDrawLabel && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3 shrink-0" />
              <span className="truncate">{nextDrawLabel}</span>
            </div>
          )}

          {/* CTA */}
          <div className="mt-auto pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full justify-between px-2 text-xs text-muted-foreground group-hover:text-primary transition-colors"
              tabIndex={-1}
            >
              View Game
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
