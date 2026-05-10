import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ResultNumbersRow } from "@/components/numbers"
import { formatDrawDate } from "@/lib/utils/formatDate"
import { buildStateUrl, buildFamilyUrl } from "@/lib/utils/buildLotteryLinks"
import { ArrowRight, CalendarDays } from "lucide-react"
import type { DrawResult } from "@/types/api"

interface TodayResultsSectionProps {
  results: DrawResult[]
}

export function TodayResultsSection({ results }: TodayResultsSectionProps) {
  if (!results || results.length === 0) return null

  // Only show cards that have actual numbers
  const validResults = results.filter(
    (r) => r && r.main_numbers && r.main_numbers.length > 0
  )

  if (validResults.length === 0) return null

  return (
    <section aria-labelledby="today-results-heading">
      <div className="mb-4 sm:mb-6">
        <h2
          id="today-results-heading"
          className="text-xl sm:text-2xl font-bold tracking-tight lg:text-3xl"
        >
          {"Today's Latest Draw Results"}
        </h2>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">
          Fresh lottery results updated after each official drawing.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {validResults.map((result, idx) => (
          <TodayResultCard key={result.id ?? idx} result={result} />
        ))}
      </div>
    </section>
  )
}

function TodayResultCard({ result }: { result: DrawResult }) {
  const stateSlug = result.state_slug || result.state?.slug || ""
  const gameSlug = result.game_slug || result.game?.slug || ""
  const gameName = result.game_name || result.game?.name || "Lottery"
  const stateName = result.state_name || result.state?.name || ""

  // Detect session label from draw_type or draw_time
  const drawType = result.draw_type || ""
  const sessionLabel = getSessionLabel(drawType, result.draw_time)

  const href =
    stateSlug && gameSlug
      ? buildFamilyUrl(stateSlug, gameSlug)
      : stateSlug
        ? buildStateUrl(stateSlug)
        : null

  const isCurrentDraw = result.draw_status_color === "green"

  const content = (
    <Card className="group h-full border-border/50 bg-card/50 transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-md">
      <CardContent className="flex flex-col gap-3 p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {stateName && (
              <p className="text-xs font-medium text-muted-foreground truncate">
                {stateName}
              </p>
            )}
            <h3 className="text-sm font-semibold leading-tight truncate">{gameName}</h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <Badge
              variant={isCurrentDraw ? "default" : "secondary"}
              className="text-[10px] px-1.5 py-0"
            >
              {isCurrentDraw ? "Current" : "Previous"}
            </Badge>
            {sessionLabel && (
              <span className="text-[10px] text-muted-foreground">{sessionLabel}</span>
            )}
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span>{formatDrawDate(result.draw_date)}</span>
        </div>

        {/* Numbers */}
        <ResultNumbersRow
          mainNumbers={result.main_numbers || []}
          mainItems={result.main_items}
          bonusItems={result.bonus_items || []}
          extraItems={result.extra_items || []}
          statusColor={result.draw_status_color ?? "gray"}
          size="sm"
          centered={false}
          showExtras={false}
          gameSlug={gameSlug}
        />

        {/* View link */}
        {href && (
          <div className="mt-auto flex justify-end">
            <span className="flex items-center gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View Results
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) {
    return (
      <Link
        href={href}
        className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
        aria-label={`View results for ${gameName}${stateName ? ` in ${stateName}` : ""}`}
      >
        {content}
      </Link>
    )
  }

  return content
}

function getSessionLabel(drawType: string, drawTime?: string): string {
  if (!drawType && !drawTime) return ""
  const combined = `${drawType} ${drawTime || ""}`.toLowerCase()
  if (combined.includes("midday") || combined.includes("noon") || combined.includes("day"))
    return "Midday"
  if (combined.includes("evening") || combined.includes("night"))
    return "Evening"
  if (combined.includes("morning") || combined.includes("early"))
    return "Morning"
  return ""
}
