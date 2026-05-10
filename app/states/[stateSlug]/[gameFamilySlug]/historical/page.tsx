"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import useSWR from "swr"
import { HistoricalResultsTable } from "@/components/tables"
import { DateRangeFilter } from "@/components/filters"
import { Breadcrumbs, Container } from "@/components/layout"
import { TableSkeleton, EmptyState, ErrorState } from "@/components/feedback"
import { GameLogo } from "@/components/cards/GameLogo"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Info } from "lucide-react"
import { getDateDaysAgo, getTodayISO } from "@/lib/utils/formatDate"
import { 
  resolveHistoricalGameSlug, 
  getAllFamilyHistoricalGames,
  type HistoricalGame 
} from "@/lib/utils/resolveHistoricalGameSlug"
import { getStateName } from "@/lib/utils/buildLotteryLinks"
import type { HistoricalResult, State } from "@/types/api"

// Client-side fetcher
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
  return res.json()
}

export default function HistoricalPage() {
  const params = useParams()
  const stateSlug = params.stateSlug as string
  const gameFamilySlug = params.gameFamilySlug as string

  // Date range state
  const [startDate, setStartDate] = useState(() => getDateDaysAgo(30))
  const [endDate, setEndDate] = useState(() => getTodayISO())
  const [appliedStart, setAppliedStart] = useState(startDate)
  const [appliedEnd, setAppliedEnd] = useState(endDate)
  
  // Resolved game slug for API
  const [resolvedGameSlug, setResolvedGameSlug] = useState<string | null>(null)
  const [availableGames, setAvailableGames] = useState<HistoricalGame[]>([])

  // Fetch state info
  const { data: states } = useSWR<State[]>(
    "/api/internal/states",
    fetcher
  )
  const state = states?.find((s) => s.slug === stateSlug)
  const stateName = state ? getStateName(state) : stateSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  // Fetch available historical games
  const { data: historicalGames, isLoading: loadingGames } = useSWR<HistoricalGame[]>(
    "/api/internal/historical/games",
    fetcher
  )

  // Resolve the correct game slug when historical games are loaded
  useEffect(() => {
    if (historicalGames && historicalGames.length > 0) {
      const resolved = resolveHistoricalGameSlug(
        gameFamilySlug,
        null, // No session for family page
        stateSlug,
        historicalGames
      )
      setResolvedGameSlug(resolved)
      
      // Also get all games for this family (for multi-session games)
      const familyGames = getAllFamilyHistoricalGames(
        gameFamilySlug,
        stateSlug,
        historicalGames
      )
      setAvailableGames(familyGames)
    }
  }, [historicalGames, gameFamilySlug, stateSlug])

  // Fetch historical results only when we have a resolved slug
  const {
    data: results,
    error: resultsError,
    isLoading: loadingResults,
    mutate,
  } = useSWR<HistoricalResult[]>(
    resolvedGameSlug && appliedStart && appliedEnd
      ? `/api/internal/historical/results?game_slug=${encodeURIComponent(resolvedGameSlug)}&start_date=${appliedStart}&end_date=${appliedEnd}`
      : null,
    fetcher
  )

  const handleApplyFilter = useCallback(() => {
    setAppliedStart(startDate)
    setAppliedEnd(endDate)
  }, [startDate, endDate])

  const familyName = gameFamilySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")

  // Determine loading state
  const isLoading = loadingGames || (resolvedGameSlug && loadingResults)
  
  // Determine if historical data is unavailable for this game
  const noHistoricalDataAvailable = 
    historicalGames && 
    historicalGames.length > 0 && 
    !resolvedGameSlug &&
    availableGames.length === 0

  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[
          { label: "States", href: "/states" },
          { label: stateName, href: `/states/${stateSlug}` },
          { label: familyName, href: `/states/${stateSlug}/${gameFamilySlug}` },
          { label: "Historical" },
        ]}
      />

      {/* Header */}
      <section className="mb-8">
        <div className="flex items-start gap-4 sm:gap-6">
          <GameLogo
            gameName={familyName}
            gameSlug={gameFamilySlug}
            stateSlug={stateSlug}
            size="xl"
          />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {familyName} Historical Results
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              {stateName} Lottery - Search and export past results
            </p>
          </div>
        </div>
      </section>

      {/* Back Link */}
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link href={`/states/${stateSlug}/${gameFamilySlug}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Link>
      </Button>

      {/* Show unavailable message if no historical data for this game */}
      {noHistoricalDataAvailable ? (
        <div className="rounded-xl border bg-muted/30 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Info className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Historical Data Not Available</h2>
          <p className="mt-2 text-muted-foreground">
            Historical results are not currently available for {familyName} in {stateName}.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please check back later or view another game.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link href={`/states/${stateSlug}/${gameFamilySlug}`}>
              View Latest Results
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Date Filter */}
          <section className="mb-8">
            <DateRangeFilter
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onApply={handleApplyFilter}
              isLoading={isLoading || false}
            />
          </section>

          {/* Results */}
          <section className="mb-12">
            {isLoading ? (
              <TableSkeleton rows={10} />
            ) : resultsError ? (
              <ErrorState
                title="Failed to Load Results"
                description="Unable to fetch historical results. Please try again."
                onRetry={() => mutate()}
              />
            ) : results && results.length === 0 ? (
              <EmptyState
                type="no-results"
                title="No Results Found"
                description={`No historical results found for ${familyName} between the selected dates. Try expanding your date range.`}
              />
            ) : (
              <HistoricalResultsTable
                results={results || []}
                gameName={familyName}
                stateName={stateName}
                startDate={appliedStart}
                endDate={appliedEnd}
              />
            )}
          </section>

          {/* Multi-session info */}
          {availableGames.length > 1 && (
            <section className="mb-8 rounded-lg border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> {familyName} has multiple sessions available: {" "}
                {availableGames.map((g) => g.game_name).join(", ")}. 
                Currently showing results for {availableGames.find(g => g.game_slug === resolvedGameSlug)?.game_name || "the primary session"}.
              </p>
            </section>
          )}
        </>
      )}

      {/* Info */}
      <section className="border-t pt-8">
        <h2 className="mb-4 text-xl font-semibold">About Historical Data</h2>
        <p className="text-muted-foreground">
          Search for past lottery results by date range. Use the Export CSV button 
          to download the filtered results for your own analysis. All data shown is 
          unofficial - please verify with your official {stateName} Lottery website.
        </p>
      </section>
    </Container>
  )
}

/**
 * Format a state slug into a readable name
 */
function formatStateName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
