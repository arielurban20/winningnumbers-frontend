"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { GameLogo } from "./GameLogo"
import { SessionResultBlock } from "./SessionResultBlock"
import { ChevronRight, ArrowRight } from "lucide-react"
import type { GameFamily } from "@/types/api"

interface GroupedGameCardProps {
  family: GameFamily
  href?: string
  id?: string
}

/**
 * Premium grouped game card with multiple sessions
 * Each session block links to its individual session page
 * Mobile-optimized with compact layout
 */
export function GroupedGameCard({ family, href, id }: GroupedGameCardProps) {
  const sessionsWithDraws = family.sessions.filter((s) => s.latestDraw)
  const stateSlug = family.state_slug || ""
  const familySlug = family.familySlug

  return (
    <Card
      id={id}
      className="group h-full scroll-mt-24 overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:scroll-mt-28"
    >
      {/* Card Header with gradient - Compact on mobile */}
      <CardHeader className="relative p-3 pb-2 sm:p-6 sm:pb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <GameLogo
              logoUrl={family.logo_url}
              logo={family.logo}
              iconUrl={family.icon_url}
              gameName={family.familyName}
              gameSlug={familySlug}
              stateSlug={stateSlug}
              size="md"
              className="sm:scale-100"
            />
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-bold leading-tight tracking-tight truncate">
                {family.familyName}
              </h3>
              {family.state_name && (
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{family.state_name}</p>
              )}
            </div>
          </div>
          {href && (
            <Button asChild variant="ghost" size="sm" className="shrink-0 h-8 px-2 sm:h-9 sm:px-3 hidden sm:flex">
              <Link href={href}>
                View Details
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4 pt-0 p-3 sm:p-6 sm:pt-0">
        {sessionsWithDraws.map((session, idx) => (
          <div key={session.sessionSlug}>
            {idx > 0 && <Separator className="mb-3 sm:mb-4" />}
            <SessionResultBlock
              sessionName={session.sessionName}
              sessionDisplaySlug={session.sessionDisplaySlug}
              stateSlug={stateSlug}
              familySlug={familySlug}
              draw={session.latestDraw!}
              gameSlug={session.sessionSlug}
              showSessionName={family.sessions.length > 1}
              clickable={family.sessions.length > 1}
            />
          </div>
        ))}

        {sessionsWithDraws.length === 0 && (
          <div className="rounded-lg bg-muted/50 py-6 sm:py-8 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              No recent draws available
            </p>
          </div>
        )}

        {/* Family page link for multi-session cards */}
        {href && sessionsWithDraws.length > 0 && (
          <div className="pt-1 sm:pt-2 text-center">
            <Button asChild variant="outline" size="sm" className="w-full h-8 text-xs sm:h-9 sm:text-sm sm:w-auto">
              <Link href={href}>
                View All Results
                <ArrowRight className="ml-1 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
