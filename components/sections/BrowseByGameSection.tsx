'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
// ChevronDown, ChevronUp - temporarily removed with View All button
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { GameLogo } from '@/components/cards/GameLogo'
import { cn } from '@/lib/utils'
import type { IndividualGameItem } from '@/lib/api/gameFamilies'

// Re-export for backwards compatibility
export type { IndividualGameItem as GameFamilyInfo }

interface BrowseByGameSectionProps {
  games: IndividualGameItem[]
  className?: string
}

const INITIAL_DISPLAY_COUNT = 6  // Show 6 games initially

export function BrowseByGameSection({ games = [], className }: BrowseByGameSectionProps) {
  const [search, setSearch] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  // Ensure games is always an array
  const safeGames = Array.isArray(games) ? games : []

  const filteredGames = useMemo(() => {
    if (!search.trim()) return safeGames
    const query = search.toLowerCase().trim()
    return safeGames.filter((g) =>
      g.gameName.toLowerCase().includes(query) ||
      g.stateName.toLowerCase().includes(query) ||
      g.stateAbbr.toLowerCase().includes(query) ||
      (g.sessionLabel && g.sessionLabel.toLowerCase().includes(query))
    )
  }, [safeGames, search])

  const displayedGames = useMemo(() => {
    if (isExpanded || search.trim()) return filteredGames
    return filteredGames.slice(0, INITIAL_DISPLAY_COUNT)
  }, [filteredGames, isExpanded, search])

  const hasMore = filteredGames.length > INITIAL_DISPLAY_COUNT
  const showingAll = isExpanded || search.trim() || !hasMore

  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {/* Header with Search */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight lg:text-3xl">
            Browse Lottery Results by Game
          </h2>
          <p className="mt-1 text-sm sm:text-base text-muted-foreground">
            Find lottery results by game type, including Pick 3, Pick 4, Cash 5, Lotto, Powerball, Mega Millions, and more.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search lottery games..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Games Grid - Compact cards */}
      {displayedGames.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {displayedGames.map((game, index) => (
            <GameCard 
              key={`${game.gameSlug}-${game.stateSlug}-${index}`} 
              game={game} 
              priority={index < 6}  // First 6 logos load with priority
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            No lottery games found.
          </CardContent>
        </Card>
      )}

      {/* View All / Show Less Button - TEMPORARILY HIDDEN */}
      {/* TODO: Re-enable when requested
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
                View All Games
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
      */}
    </div>
  )
}

function GameCard({ game, priority = false }: { game: IndividualGameItem; priority?: boolean }) {
  return (
    <Link href={game.href} className="group block">
      <Card className="h-full border-border/50 bg-card/50 transition-all hover:border-primary/30 hover:bg-card hover:shadow-md">
        <CardContent className="flex items-center gap-2 p-2 sm:p-3">
          {/* Logo - compact size */}
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center">
            <GameLogo
              logoUrl={game.logoUrl}
              gameName={game.gameName}
              gameSlug={game.familySlug}
              stateSlug={game.stateSlug}
              isMultistate={game.isMultistate}
              size="sm"
              priority={priority}
            />
          </div>

          {/* Game Info */}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-xs sm:text-sm truncate leading-tight">
              {game.sessionLabel 
                ? `${game.gameName.replace(new RegExp(`\\s*${game.sessionLabel}\\s*$`, 'i'), '')} ${game.sessionLabel}`
                : game.gameName
              }
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {game.isMultistate ? 'Multi-State' : game.stateAbbr}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
