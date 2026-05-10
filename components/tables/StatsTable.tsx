"use client"

import { Progress } from "@/components/ui/progress"
import { EmptyState } from "@/components/feedback"
import { formatDrawDate } from "@/lib/utils/formatDate"
import { Flame, Snowflake } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StatItem } from "@/types/api"

interface StatsTableProps {
  stats: StatItem[]
  title?: string
  type?: "most" | "least"
  /** Pass true when stats is empty due to backend being unreachable */
  backendUnavailable?: boolean
}

export function StatsTable({
  stats,
  title,
  type = "most",
  backendUnavailable = false,
}: StatsTableProps) {
  const isMost = type === "most"

  const defaultTitle = isMost
    ? "Top 10 Most Drawn Numbers"
    : "Top 10 Least Drawn Numbers"
  const displayTitle = title ?? defaultTitle

  if (stats.length === 0) {
    if (backendUnavailable) {
      return (
        <EmptyState
          type="no-stats"
          title="Statistics unavailable"
          description="The stats backend could not be reached. Connect the backend or check API_BASE_URL to see real frequency data."
        />
      )
    }
    return <EmptyState type="no-stats" />
  }

  const maxCount = Math.max(...stats.map((s) => s.count))

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border px-4 py-3",
          isMost
            ? "border-red-500/20 bg-gradient-to-r from-red-500/8 to-amber-500/5 dark:from-red-500/12 dark:to-amber-500/8"
            : "border-cyan-500/20 bg-gradient-to-r from-blue-500/8 to-cyan-500/5 dark:from-blue-500/12 dark:to-cyan-500/8"
        )}
      >
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            isMost
              ? "bg-gradient-to-br from-red-400 to-amber-500 shadow-[0_0_16px_rgba(239,68,68,0.4)]"
              : "bg-gradient-to-br from-blue-400 to-cyan-500 shadow-[0_0_16px_rgba(6,182,212,0.4)]"
          )}
        >
          {isMost ? (
            <Flame className="h-5 w-5 text-white" />
          ) : (
            <Snowflake className="h-5 w-5 text-white" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold leading-tight">{displayTitle}</h3>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
              isMost
                ? "bg-red-500/10 text-red-600 ring-1 ring-red-500/20 dark:text-red-400"
                : "bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20 dark:text-cyan-400"
            )}
          >
            {isMost ? <Flame className="h-3 w-3" /> : <Snowflake className="h-3 w-3" />}
            {isMost ? "Hot" : "Cold"}
          </span>
        </div>
      </div>

      {/* List — card-per-row, no heavy table */}
      <div className="space-y-2">
        {stats.map((stat, idx) => {
          const barPct = maxCount > 0 ? (stat.count / maxCount) * 100 : 0
          const displayPct =
            typeof stat.percentage === "number" ? stat.percentage : barPct
          const isTop3 = idx < 3

          return (
            <div
              key={`${stat.number}-${idx}`}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-150",
                "hover:shadow-sm",
                isMost
                  ? "border-red-500/10 bg-red-500/3 hover:border-red-500/20 hover:bg-red-500/6 dark:bg-red-500/5 dark:hover:bg-red-500/8"
                  : "border-blue-500/10 bg-blue-500/3 hover:border-blue-500/20 hover:bg-blue-500/6 dark:bg-blue-500/5 dark:hover:bg-blue-500/8"
              )}
            >
              {/* Rank badge */}
              <div className="w-6 shrink-0 text-center">
                {isTop3 ? (
                  <span
                    className={cn(
                      "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold",
                      idx === 0
                        ? isMost
                          ? "bg-gradient-to-br from-red-400 to-amber-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                          : "bg-gradient-to-br from-blue-400 to-cyan-500 text-white shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                        : idx === 1
                        ? isMost
                          ? "bg-red-500/20 text-red-600 dark:text-red-400"
                          : "bg-blue-500/20 text-blue-600 dark:text-blue-400"
                        : isMost
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400"
                    )}
                  >
                    {idx + 1}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    {idx + 1}
                  </span>
                )}
              </div>

              {/* Number ball — warm red/orange gradient (hot) or cool blue/cyan (cold) */}
              <div
                className={cn(
                  "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  "text-sm font-extrabold tabular-nums text-white transition-transform duration-150",
                  "group-hover:scale-110",
                  isMost
                    ? "bg-gradient-to-br from-red-400 via-orange-400 to-amber-400 shadow-[0_2px_10px_rgba(239,68,68,0.35)] dark:shadow-[0_2px_14px_rgba(239,68,68,0.5)]"
                    : "bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 shadow-[0_2px_10px_rgba(59,130,246,0.35)] dark:shadow-[0_2px_14px_rgba(6,182,212,0.5)]"
                )}
                role="img"
                aria-label={`Number ${stat.number}`}
              >
                {stat.number}
              </div>

              {/* Progress + count — takes remaining space */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {stat.type === "bonus" ? "bonus draws" : "draws"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tabular-nums">
                      {stat.count}×
                    </span>
                    <span
                      className={cn(
                        "min-w-[3rem] text-right text-xs font-semibold tabular-nums",
                        isMost
                          ? "text-red-600 dark:text-red-400"
                          : "text-blue-600 dark:text-blue-400"
                      )}
                    >
                      {displayPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Progress
                  value={barPct}
                  className={cn(
                    "h-1.5",
                    isMost
                      ? "[&>div]:bg-gradient-to-r [&>div]:from-red-400 [&>div]:via-orange-400 [&>div]:to-amber-400"
                      : "[&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:via-blue-400 [&>div]:to-cyan-400"
                  )}
                />
              </div>

              {/* Last drawn date */}
              {stat.last_drawn && (
                <div className="hidden shrink-0 text-right sm:block">
                  <span className="text-xs text-muted-foreground">
                    {formatDrawDate(stat.last_drawn)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
