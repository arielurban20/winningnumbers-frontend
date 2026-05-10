"use client"

import Link from "next/link"
import { GameLogo } from "@/components/cards/GameLogo"
import { cn } from "@/lib/utils"
import { buildBestMultiStateGameUrl } from "@/lib/utils/buildLotteryLinks"

interface MultiStateGame {
  name: string
  slug: string
  description?: string
}

// Multi-state games with verified routes
// Each game either has a /games/{slug} page or links to a real state page
const MULTI_STATE_GAMES: MultiStateGame[] = [
  {
    name: "Powerball",
    slug: "powerball",
    description: "America's Game",
  },
  {
    name: "Mega Millions",
    slug: "mega-millions",
    description: "Dream Big",
  },
  {
    name: "Lotto America",
    slug: "lotto-america",
    description: "Multi-State Lotto",
  },
  {
    name: "2by2",
    slug: "2by2",
    description: "Daily Drawings",
  },
]

interface MultiStateGamesSectionProps {
  className?: string
}

/**
 * Multi-State Games Section
 * 
 * Displays a grid of multi-state lottery games with logos.
 * Mobile: Compact 4-column grid (no carousel)
 * Desktop: 8-column grid
 */
export function MultiStateGamesSection({ className }: MultiStateGamesSectionProps) {
  return (
    <section className={cn("space-y-4 sm:space-y-6", className)}>
      <div className="space-y-1 sm:space-y-2">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
          Multi-State Lottery Games
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Popular lottery games played across multiple states.
        </p>
      </div>

      {/* Compact responsive grid - 4 cols mobile, 6 tablet, 8 desktop */}
      <div className="grid grid-cols-4 gap-1 sm:gap-1.5 md:grid-cols-6 lg:grid-cols-8">
        {MULTI_STATE_GAMES.map((game) => (
          <MultiStateGameCard key={game.slug} game={game} />
        ))}
      </div>
    </section>
  )
}

function MultiStateGameCard({ game }: { game: MultiStateGame }) {
  // Use safe URL builder that links to real result pages - never 404
  const href = buildBestMultiStateGameUrl(game.slug)

  return (
    <Link href={href} className="block group h-full">
      <div className={cn(
        "relative flex items-center justify-center h-full w-full",
        "aspect-[2/1] sm:aspect-auto sm:h-16 lg:h-20",
        "px-1 sm:px-2",
        "border border-border rounded-lg bg-card/50",
        "transition-all duration-200 hover:border-primary/50 hover:bg-card/80 hover:shadow-md",
        "overflow-hidden"
      )}>
        {/* Logo fills the button with object-contain */}
        <GameLogo
          gameName={game.name}
          gameSlug={game.slug}
          isMultistate={true}
          size="xl"
          className="w-[85%] h-[75%] transition-transform duration-200 group-hover:scale-105"
        />
        
        {/* Accessible game name - hidden visually but available for screen readers */}
        <span className="sr-only">{game.name}</span>
      </div>
    </Link>
  )
}

/**
 * Compact version for sidebars or smaller spaces
 */
export function MultiStateGamesCompact({ className }: { className?: string }) {
  // Only show main games in compact view (Powerball and Mega Millions have pages)
  const mainGames = MULTI_STATE_GAMES.slice(0, 4)

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        National Games
      </h3>
      <div className="flex flex-wrap gap-2">
        {mainGames.map((game) => {
          const href = buildBestMultiStateGameUrl(game.slug)
          return (
            <Link
              key={game.slug}
              href={href}
              className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <GameLogo gameName={game.name} gameSlug={game.slug} isMultistate={true} size="sm" />
              <span>{game.name}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
