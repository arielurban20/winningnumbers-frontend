"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Flame, Snowflake, TrendingDown, TrendingUp } from "lucide-react"
import type { StatItem } from "@/types/api"

interface NumberStatsCardsProps {
  hotNumbers: StatItem[]
  coldNumbers: StatItem[]
  gameName?: string
  isLoading?: boolean
}

type Tone = "hot" | "cold"

function NumberBadge({ number, tone }: { number: string | number; tone: Tone }) {
  const toneClasses =
    tone === "hot"
      ? "border-red-400/40 bg-red-500/20 text-red-100"
      : "border-blue-400/40 bg-blue-500/20 text-blue-100"

  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold tabular-nums ${toneClasses}`}
    >
      {number}
    </span>
  )
}

function StatList({
  stats,
  tone,
  isLoading,
}: {
  stats: StatItem[]
  tone: Tone
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={`skeleton-${tone}-${idx}`}
            className="h-11 animate-pulse rounded-md border border-border/50 bg-muted/40"
          />
        ))}
      </div>
    )
  }

  if (stats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    )
  }

  const trendIcon =
    tone === "hot" ? (
      <TrendingUp className="h-3.5 w-3.5 text-red-300/80" />
    ) : (
      <TrendingDown className="h-3.5 w-3.5 text-blue-300/80" />
    )

  return (
    <ol className="space-y-2">
      {stats.slice(0, 10).map((stat, idx) => (
        <li
          key={`${tone}-${stat.number}-${idx}`}
          className="flex items-center justify-between rounded-md border border-border/50 bg-muted/25 px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="w-7 text-xs font-medium text-muted-foreground">#{idx + 1}</span>
            <NumberBadge number={stat.number} tone={tone} />
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-medium">Number {stat.number}</span>
              {trendIcon}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{stat.count}</span> times
          </p>
        </li>
      ))}
    </ol>
  )
}

/**
 * Hot Numbers and Cold Numbers cards
 * Compact, readable ranking lists based on last 365 days.
 */
export function NumberStatsCards({
  hotNumbers,
  coldNumbers,
  gameName = "this game",
  isLoading = false,
}: NumberStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="overflow-hidden border-red-500/20">
        <CardHeader className="bg-gradient-to-br from-red-500/8 via-red-500/4 to-transparent pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
              <Flame className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <CardTitle className="text-base">Hot Numbers</CardTitle>
              <CardDescription className="text-xs">
                Most frequent for {gameName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <StatList stats={hotNumbers} tone="hot" isLoading={isLoading} />
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-blue-500/20">
        <CardHeader className="bg-gradient-to-br from-blue-500/8 via-blue-500/4 to-transparent pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15">
              <Snowflake className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">Cold Numbers</CardTitle>
              <CardDescription className="text-xs">
                Least frequent for {gameName}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <StatList stats={coldNumbers} tone="cold" isLoading={isLoading} />
        </CardContent>
      </Card>

      <div className="col-span-full">
        <p className="text-center text-xs text-muted-foreground">
          Lottery drawings are random. Frequency statistics are informational only.
        </p>
      </div>
    </div>
  )
}
