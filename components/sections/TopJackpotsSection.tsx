import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GameLogo } from "@/components/cards/GameLogo"
import { formatJackpot } from "@/lib/utils/formatCurrency"
import { buildStateUrl, buildFamilyUrl, buildNationalGameUrl } from "@/lib/utils/buildLotteryLinks"
import { Trophy, ArrowRight } from "lucide-react"
import type { DrawResult } from "@/types/api"

interface TopJackpotsSectionProps {
  draws: DrawResult[]
}

interface JackpotEntry {
  draw: DrawResult
  jackpotRaw: string
  jackpotFormatted: string
  label: "Estimated Jackpot" | "Top Prize" | "Prize"
  href: string
}

/** Parse jackpot string to numeric for sorting */
function parseJackpotValue(str: string): number {
  const upper = str.toUpperCase().replace(/[^0-9.BMK]/g, " ").trim()
  const num = parseFloat(upper.replace(/[^0-9.]/g, ""))
  if (isNaN(num)) return 0
  if (str.toLowerCase().includes("billion") || str.includes("B")) return num * 1_000_000_000
  if (str.toLowerCase().includes("million") || str.includes("M")) return num * 1_000_000
  if (str.toLowerCase().includes("k") || str.includes("K")) return num * 1_000
  return num
}

export function TopJackpotsSection({ draws }: TopJackpotsSectionProps) {
  if (!draws || draws.length === 0) return null

  // Build jackpot entries - prefer jackpot_next, then top_prize, then prize_amount
  const entries: JackpotEntry[] = draws
    .filter((d) => {
      const raw = d as DrawResult & { top_prize?: string; prize_amount?: string }
      return d.jackpot_next || raw.top_prize || raw.prize_amount
    })
    .map((d) => {
      const raw = d as DrawResult & { top_prize?: string; prize_amount?: string }
      const gameSlug = d.game_slug || d.game?.slug || ""
      const stateSlug = d.state_slug || d.state?.slug || ""

      let jackpotRaw = ""
      let label: JackpotEntry["label"] = "Prize"

      if (d.jackpot_next) {
        jackpotRaw = d.jackpot_next
        label = "Estimated Jackpot"
      } else if (raw.top_prize) {
        jackpotRaw = raw.top_prize
        label = "Top Prize"
      } else if (raw.prize_amount) {
        jackpotRaw = raw.prize_amount
        label = "Prize"
      }

      let href = "/games"
      if (gameSlug === "powerball" || gameSlug === "mega-millions") {
        href = buildNationalGameUrl(gameSlug)
      } else if (stateSlug && gameSlug) {
        href = buildFamilyUrl(stateSlug, gameSlug)
      } else if (stateSlug) {
        href = buildStateUrl(stateSlug)
      }

      return {
        draw: d,
        jackpotRaw,
        jackpotFormatted: formatJackpot(jackpotRaw),
        label,
        href,
      }
    })
    // Remove duplicates by game slug
    .filter(
      (e, idx, arr) =>
        arr.findIndex(
          (x) =>
            (x.draw.game_slug || x.draw.game?.slug) ===
            (e.draw.game_slug || e.draw.game?.slug)
        ) === idx
    )
    // Sort by jackpot value descending
    .sort((a, b) => parseJackpotValue(b.jackpotRaw) - parseJackpotValue(a.jackpotRaw))
    .slice(0, 6)

  if (entries.length === 0) return null

  return (
    <section aria-labelledby="top-jackpots-heading">
      <div className="mb-4 sm:mb-6">
        <h2
          id="top-jackpots-heading"
          className="text-xl sm:text-2xl font-bold tracking-tight lg:text-3xl"
        >
          Top Jackpots Right Now
        </h2>
        <p className="mt-1 text-sm sm:text-base text-muted-foreground">
          Big prizes and jackpots from popular lottery games.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry, idx) => (
          <JackpotCard key={entry.draw.id ?? idx} entry={entry} />
        ))}
      </div>
    </section>
  )
}

function JackpotCard({ entry }: { entry: JackpotEntry }) {
  const { draw, jackpotFormatted, label, href } = entry
  const gameSlug = draw.game_slug || draw.game?.slug || ""
  const gameName = draw.game_name || draw.game?.name || "Lottery"
  const stateName = draw.state_name || draw.state?.name || ""
  const isMultistate =
    gameSlug === "powerball" || gameSlug === "mega-millions"

  const nextDrawLabel = draw.next_draw_relative || draw.next_draw_text || ""

  return (
    <Link
      href={href}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
      aria-label={`${gameName} jackpot: ${jackpotFormatted}`}
    >
      <Card className="h-full overflow-hidden border-border/50 bg-card/50 transition-all duration-200 hover:border-lottery-gold/30 hover:bg-card hover:shadow-md">
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
              <p className="text-xs text-muted-foreground truncate">
                {isMultistate ? "Multi-State" : stateName}
              </p>
            </div>
          </div>

          {/* Jackpot amount */}
          <div className="rounded-lg bg-lottery-gold/10 p-3 text-center">
            <div className="mb-0.5 flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <Trophy className="h-3 w-3 text-lottery-gold" />
              {label}
            </div>
            <p className="text-xl font-bold text-lottery-gold leading-tight">
              {jackpotFormatted}
            </p>
          </div>

          {/* Next draw + CTA row */}
          <div className="flex items-center justify-between">
            {nextDrawLabel ? (
              <p className="text-xs text-muted-foreground truncate">{nextDrawLabel}</p>
            ) : (
              <span />
            )}
            <Badge
              variant="outline"
              className="shrink-0 gap-1 text-[10px] text-primary border-primary/30 group-hover:border-primary transition-colors"
            >
              View
              <ArrowRight className="h-2.5 w-2.5" />
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
