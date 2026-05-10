"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Flame, Snowflake, AlertCircle } from "lucide-react"
import type { StatItem } from "@/types/api"

interface NumberStatsCardsProps {
  hotNumbers: StatItem[]
  coldNumbers: StatItem[]
  gameName?: string
  isLoading?: boolean
}

/**
 * Hot Numbers and Cold Numbers cards
 * Shows most and least frequent lottery numbers
 */
export function NumberStatsCards({
  hotNumbers,
  coldNumbers,
  gameName = "this game",
  isLoading = false,
}: NumberStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Hot Numbers */}
      <Card className="overflow-hidden border-lottery-red/20">
        <CardHeader className="bg-gradient-to-br from-lottery-red/10 via-lottery-red/5 to-transparent pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lottery-red/20">
              <Flame className="h-4 w-4 text-lottery-red" />
            </div>
            <div>
              <CardTitle className="text-lg">Hot Numbers</CardTitle>
              <CardDescription className="text-xs">
                Most frequent in last 365 days
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex flex-wrap justify-center gap-2 py-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-10 animate-pulse rounded-full bg-muted"
                />
              ))}
            </div>
          ) : hotNumbers.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-center gap-2">
                {hotNumbers.slice(0, 10).map((stat, idx) => (
                  <div key={`hot-${stat.number}-${idx}`} className="relative">
                    <div
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold tabular-nums text-white shadow-[0_2px_10px_rgba(239,68,68,0.4)] dark:shadow-[0_2px_14px_rgba(239,68,68,0.55)] bg-gradient-to-br from-red-400 via-orange-400 to-amber-400"
                      role="img"
                      aria-label={`Hot number ${stat.number}`}
                    >
                      {stat.number}
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {stat.count}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Numbers shown {hotNumbers.slice(0, 10).reduce((sum, s) => sum + (s.count || 0), 0)} times combined
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No hot numbers data available
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cold Numbers */}
      <Card className="overflow-hidden border-blue-500/20">
        <CardHeader className="bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20">
              <Snowflake className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Cold Numbers</CardTitle>
              <CardDescription className="text-xs">
                Least frequent in last 365 days
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="flex flex-wrap justify-center gap-2 py-4">
              {[...Array(10)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 w-10 animate-pulse rounded-full bg-muted"
                />
              ))}
            </div>
          ) : coldNumbers.length > 0 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-center gap-2">
                {coldNumbers.slice(0, 10).map((stat, idx) => (
                  <div key={`cold-${stat.number}-${idx}`} className="relative">
                    <div
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full text-sm font-extrabold tabular-nums text-white shadow-[0_2px_10px_rgba(59,130,246,0.4)] dark:shadow-[0_2px_14px_rgba(6,182,212,0.55)] bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400"
                      role="img"
                      aria-label={`Cold number ${stat.number}`}
                    >
                      {stat.number}
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
                      {stat.count}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Numbers shown {coldNumbers.slice(0, 10).reduce((sum, s) => sum + (s.count || 0), 0)} times combined
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No cold numbers data available
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <div className="col-span-full">
        <p className="text-center text-xs text-muted-foreground">
          Lottery drawings are random. Frequency data is informational and does not predict future results.
        </p>
      </div>
    </div>
  )
}
