import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getCombinedTopJackpots } from "@/lib/data/jackpotHistory"
import { Trophy, ArrowRight } from "lucide-react"

export function TopLotteryJackpotsTeaserSection() {
  const topJackpots = getCombinedTopJackpots(5)

  return (
    <section>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Top Lottery Jackpots</h2>
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">
            Biggest Powerball and Mega Millions jackpots from official records.
          </p>
        </div>
      </div>

      <Card className="border-border/60 bg-card/70">
        <CardHeader className="pb-2">
          <p className="text-xs text-muted-foreground sm:text-sm">Top 5 combined jackpots</p>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {topJackpots.map((entry) => (
            <div
              key={`${entry.gameKey}-${entry.rank}-${entry.date}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/25 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold sm:text-base">{entry.prize}</p>
                <p className="truncate text-xs text-muted-foreground sm:text-sm">
                  {entry.gameName} - {entry.date} - {entry.lotteryOrState}
                </p>
              </div>
              <Trophy className="h-4 w-4 shrink-0 text-lottery-gold sm:h-5 sm:w-5" />
            </div>
          ))}

          <div className="pt-2 flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/games/powerball/jackpot-history">
                View Powerball Jackpot History
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/games/mega-millions/jackpot-history">
                View Mega Millions Jackpot History
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
