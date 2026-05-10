"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/feedback"
import { buildStateUrl } from "@/lib/utils/buildLotteryLinks"
import { MapPin, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { State } from "@/types/api"

interface StateSearchGridProps {
  states: State[]
  /** Compact mode for homepage - smaller cards, more columns */
  compact?: boolean
}

export function StateSearchGrid({ states, compact = false }: StateSearchGridProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredStates = useMemo(() => {
    if (!searchQuery.trim()) return states

    const query = searchQuery.toLowerCase().trim()
    return states.filter((state) =>
      state.name.toLowerCase().includes(query) ||
      state.slug.toLowerCase().includes(query) ||
      (state.abbreviation && state.abbreviation.toLowerCase().includes(query))
    )
  }, [states, searchQuery])

  if (states.length === 0) {
    return (
      <EmptyState
        type="no-data"
        title="States Unavailable"
        description="State lottery information is temporarily unavailable. Please check back later."
      />
    )
  }

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search states..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          {filteredStates.length === 0 
            ? "No states found" 
            : `Showing ${filteredStates.length} state${filteredStates.length !== 1 ? "s" : ""}`
          }
        </p>
      )}

      {/* States Grid - Compact on mobile */}
      {filteredStates.length === 0 ? (
        <EmptyState
          type="empty"
          title="No States Found"
          description={`No states match "${searchQuery}". Try a different search term.`}
        />
      ) : (
        <div className={cn(
          "grid gap-2 sm:gap-3",
          // Mobile: 2 columns compact, Desktop: 4 columns
          compact 
            ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
            : "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
        )}>
          {filteredStates.map((state) => (
            <StateCard key={state.slug} state={state} compact={compact} />
          ))}
        </div>
      )}
    </section>
  )
}

/**
 * Individual state card - Compact mobile design
 */
function StateCard({ state, compact }: { state: State; compact?: boolean }) {
  return (
    <Link
      href={buildStateUrl(state.slug)}
      className={cn(
        "group flex items-center justify-between rounded-xl border border-border/50 bg-card/50",
        "transition-all duration-200 hover:border-primary/30 hover:bg-card hover:shadow-md",
        compact ? "p-2.5 sm:p-3" : "p-3 sm:p-4"
      )}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className={cn(
          "flex items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground flex-shrink-0",
          compact ? "h-8 w-8 sm:h-9 sm:w-9" : "h-9 w-9 sm:h-11 sm:w-11"
        )}>
          <MapPin className={cn(compact ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5")} />
        </div>
        <div className="min-w-0">
          <span className={cn(
            "font-medium truncate block",
            compact ? "text-sm" : "text-sm sm:text-base"
          )}>
            {state.name}
          </span>
          {state.abbreviation && !compact && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              ({state.abbreviation})
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {state.has_today_results === true && (
          <span
            className="relative flex h-2.5 w-2.5"
            title="New results today"
            aria-label="New results today"
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
        )}
        <ChevronRight className={cn(
          "text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary",
          compact ? "h-4 w-4" : "h-4 w-4 sm:h-5 sm:w-5"
        )} />
      </div>
    </Link>
  )
}
