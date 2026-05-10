"use client"

import { MouseEvent } from "react"
import { GameLogo } from "@/components/cards/GameLogo"
import { cn } from "@/lib/utils"
import { toFamilyAnchorId } from "@/lib/utils/familyAnchors"

export interface StateGameJumpFamily {
  familySlug: string
  familyName: string
  stateSlug: string
  logo_url?: string
  logo?: string
  icon_url?: string
  hasCurrentResult: boolean
}

interface StateGameJumpNavProps {
  stateName: string
  gameFamilies: StateGameJumpFamily[]
}

function scrollToFamily(targetId: string, event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault()
  const target = document.getElementById(targetId)
  if (!target) return

  const stickyOffset = 104
  const y = target.getBoundingClientRect().top + window.scrollY - stickyOffset
  window.scrollTo({ top: Math.max(y, 0), behavior: "smooth" })
}

function JumpChip({ family, compact = false }: { family: StateGameJumpFamily; compact?: boolean }) {
  const targetId = toFamilyAnchorId(family.familySlug)
  return (
    <a
      href={`#${targetId}`}
      onClick={(event) => scrollToFamily(targetId, event)}
      aria-label={`Jump to ${family.familyName} results`}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm",
        "transition-all duration-200 hover:border-primary/40 hover:bg-card hover:shadow-md hover:shadow-primary/10",
        compact ? "min-w-[220px] p-2.5" : "p-3"
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <GameLogo
          logoUrl={family.logo_url}
          logo={family.logo}
          iconUrl={family.icon_url}
          gameName={family.familyName}
          gameSlug={family.familySlug}
          stateSlug={family.stateSlug}
          size="sm"
          className="h-8 w-8 sm:h-9 sm:w-9"
        />
        <span className="truncate text-sm font-medium">{family.familyName}</span>
      </div>

      {family.hasCurrentResult && (
        <span
          className="relative flex h-2.5 w-2.5 shrink-0"
          title="Latest result available"
          aria-label="Latest result available"
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
        </span>
      )}
    </a>
  )
}

export function StateGameJumpNav({ stateName, gameFamilies }: StateGameJumpNavProps) {
  if (gameFamilies.length === 0) return null

  return (
    <section className="mb-6 sm:mb-8 rounded-xl border border-border/60 bg-muted/35 p-3 sm:rounded-2xl sm:p-5">
      <div className="mb-3 sm:mb-4">
        <h2 className="text-sm font-semibold sm:text-base">Lottery quick jump</h2>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Jump directly to any {stateName} lottery family.
        </p>
      </div>

      <div className="md:hidden">
        <div className="flex snap-x gap-2 overflow-x-auto pb-1">
          {gameFamilies.map((family) => (
            <div key={family.familySlug} className="snap-start">
              <JumpChip family={family} compact />
            </div>
          ))}
        </div>
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {gameFamilies.map((family) => (
          <JumpChip key={family.familySlug} family={family} />
        ))}
      </div>
    </section>
  )
}
