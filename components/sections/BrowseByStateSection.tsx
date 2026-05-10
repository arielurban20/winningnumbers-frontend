"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Search, X, ChevronDown, ChevronUp, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { buildStateUrl, POPULAR_STATES } from "@/lib/utils/buildLotteryLinks"
import type { State } from "@/types/api"

interface BrowseByStateSectionProps {
  states: State[]
  className?: string
}

const INITIAL_DISPLAY_COUNT = 12

export function BrowseByStateSection({ states, className }: BrowseByStateSectionProps) {
  const [search, setSearch] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)

  // Sort states: popular first, then alphabetically
  const sortedStates = useMemo(() => {
    const popularSlugs = POPULAR_STATES.map((s) => s.slug)
    return [
      ...states.filter((s) => popularSlugs.includes(s.slug)),
      ...states.filter((s) => !popularSlugs.includes(s.slug)).sort((a, b) => 
        a.name.localeCompare(b.name)
      ),
    ]
  }, [states])

  const filteredStates = useMemo(() => {
    if (!search.trim()) return sortedStates
    const query = search.toLowerCase().trim()
    return sortedStates.filter((s) =>
      s.name.toLowerCase().includes(query) ||
      s.slug.toLowerCase().includes(query) ||
      s.abbreviation?.toLowerCase().includes(query)
    )
  }, [sortedStates, search])

  const displayedStates = useMemo(() => {
    if (isExpanded || search.trim()) return filteredStates
    return filteredStates.slice(0, INITIAL_DISPLAY_COUNT)
  }, [filteredStates, isExpanded, search])

  const hasMore = filteredStates.length > INITIAL_DISPLAY_COUNT
  const showingAll = isExpanded || search.trim() || !hasMore

  return (
    <div className={cn("space-y-4 sm:space-y-6", className)}>
      {/* Header with Search */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight lg:text-3xl">
            Lottery Results by State
          </h2>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Select a state to view the latest lottery results, past drawings, schedules, and number statistics.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search states..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* States Grid */}
      {displayedStates.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
          {displayedStates.map((state) => (
            <StateCard key={state.slug} state={state} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No states found.
          </CardContent>
        </Card>
      )}

      {/* View All / Show Less Button */}
      {hasMore && !search.trim() && (
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            {showingAll ? (
              <>
                Show Less
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                View All {states.length} States
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

function StateCard({ state }: { state: State }) {
  return (
    <Link
      href={buildStateUrl(state.slug)}
      className="group flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-card/50 p-2.5 sm:p-4 transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-md"
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground shrink-0">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
        <span className="font-medium text-sm sm:text-base truncate">{state.name}</span>
      </div>
      {state.has_today_results === true && (
        <span
          className="relative flex h-2.5 w-2.5 shrink-0"
          title="New results today"
          aria-label="New results today"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
      )}
    </Link>
  )
}
