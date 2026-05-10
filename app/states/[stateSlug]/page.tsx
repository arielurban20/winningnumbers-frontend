import { notFound } from "next/navigation"
import Link from "next/link"
import { getStateBySlug, getStateGames } from "@/lib/api/states"
import { getDrawResult } from "@/lib/api/draws"
import { groupGamesByFamily, sortGameFamiliesForDesktopLayout } from "@/lib/utils/groupGames"
import { GroupedGameCard } from "@/components/cards"
import { StateDrawingScheduleTable } from "@/components/tables"
import { JsonLd } from "@/components/seo"
import { SEOTextBlock, Breadcrumbs, Container } from "@/components/layout"
import { EmptyState } from "@/components/feedback"
import { generateStateMetadata, getCanonicalUrl } from "@/lib/seo/metadata"
import { generateBreadcrumbSchema, generateItemListSchema } from "@/lib/seo/jsonLd"
import { getStateName } from "@/lib/utils/buildLotteryLinks"
import { MapPin, Gamepad2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { DrawResult } from "@/types/api"
import type { Metadata } from "next"

interface StatePageProps {
  params: Promise<{ stateSlug: string }>
}

export async function generateMetadata({
  params,
}: StatePageProps): Promise<Metadata> {
  const { stateSlug } = await params
  const state = await getStateBySlug(stateSlug)
  
  if (!state) {
    return { title: "State Not Found" }
  }

  return generateStateMetadata(state.name, stateSlug)
}

export default async function StatePage({ params }: StatePageProps) {
  const { stateSlug } = await params
  const [state, games] = await Promise.all([
    getStateBySlug(stateSlug),
    getStateGames(stateSlug),
  ])

  if (!state) {
    notFound()
  }

  // Variants marked display_in_parent_only are rendered inside parent cards,
  // not as standalone game cards in the state grid.
  const visibleGames = games.filter((game) => {
    const displayInParentOnly = (game as { display_in_parent_only?: boolean | string }).display_in_parent_only
    if (displayInParentOnly === true) return false
    if (typeof displayInParentOnly === "string") {
      return displayInParentOnly.toLowerCase() !== "true"
    }
    return true
  })

  // Fetch latest draws for all games
  const drawResults = new Map<string, DrawResult>()
  
  const drawPromises = visibleGames.slice(0, 20).map(async (game) => {
    try {
      const draw = await getDrawResult(game.slug, stateSlug)
      if (draw) {
        drawResults.set(game.slug, draw)
      }
    } catch (error) {
      // Skip failed draws silently
    }
  })
  await Promise.all(drawPromises)

  // Group games by family - pass stateSlug for proper URL building
  const gameFamilies = groupGamesByFamily(visibleGames, drawResults, stateSlug, state.name)
  // Desktop-only display sort: smaller/shorter cards first, tall multi-session cards later.
  const desktopSortedGameFamilies = sortGameFamiliesForDesktopLayout(gameFamilies)
  
  // Get properly formatted state name
  const stateName = getStateName(state)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "States", url: getCanonicalUrl("/states") },
    { name: stateName, url: getCanonicalUrl(`/states/${stateSlug}`) },
  ])

  const itemListSchema = generateItemListSchema(
    `${state.name} Lottery Games`,
    gameFamilies.map((family) => ({
      name: family.familyName,
      url: getCanonicalUrl(`/states/${stateSlug}/${family.familySlug}`),
    }))
  )

  return (
    <>
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />

      {/* Hero Section - Compact on mobile */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <Container className="py-8 sm:py-12">
          <Breadcrumbs
            items={[
              { label: "States", href: "/states" },
              { label: stateName },
            ]}
          />
          
          <div className="mt-4 sm:mt-6 flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10">
              <MapPin className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                {stateName} Lottery Results
              </h1>
              <p className="mt-1.5 sm:mt-2 text-sm sm:text-lg text-muted-foreground max-w-2xl">
                View the latest winning numbers for all {stateName} lottery games.
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-5 sm:mt-8 flex flex-wrap gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-card border px-3 py-1.5 sm:px-4 sm:py-2">
              <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              <span className="text-lg sm:text-xl font-semibold">{gameFamilies.length}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">Games</span>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-8 sm:py-12">
        {/* Games Grid */}
        {gameFamilies.length === 0 ? (
          <EmptyState
            type="no-data"
            title="No Games Available"
            description={`We don't have lottery games for ${stateName} at this time.`}
          />
        ) : (
          <section className="mb-12 sm:mb-16">
            <div className="mb-4 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {stateName} Lottery Games
              </h2>
              <p className="mt-0.5 sm:mt-1 text-sm sm:text-base text-muted-foreground">
                Click a game to view detailed results and history
              </p>
            </div>
            <div className="grid gap-3 sm:gap-6 md:hidden">
              {gameFamilies.map((family) => (
                <GroupedGameCard
                  key={family.familySlug}
                  family={family}
                  href={`/states/${stateSlug}/${family.familySlug}`}
                />
              ))}
            </div>
            <div className="hidden gap-3 sm:gap-6 md:grid md:grid-cols-2 lg:grid-cols-3">
              {desktopSortedGameFamilies.map((family) => (
                <GroupedGameCard
                  key={family.familySlug}
                  family={family}
                  href={`/states/${stateSlug}/${family.familySlug}`}
                />
              ))}
            </div>
          </section>
        )}

        {/* Quick Links - Compact chips on mobile */}
        {gameFamilies.length > 0 && (
          <section className="mb-12 sm:mb-16 rounded-xl sm:rounded-2xl bg-muted/50 p-4 sm:p-6">
            <h2 className="mb-3 sm:mb-4 text-sm sm:text-lg font-semibold">Quick Links</h2>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {gameFamilies.slice(0, 12).map((family) => (
                <Button
                  key={family.familySlug}
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm bg-card"
                >
                  <Link href={`/states/${stateSlug}/${family.familySlug}`}>
                    {family.familyName}
                  </Link>
                </Button>
              ))}
            </div>
          </section>
        )}

        {/* National Games CTA */}
        <section className="mb-12 sm:mb-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">National Lottery Games</h2>
              <p className="mt-0.5 sm:mt-1 text-sm sm:text-base text-muted-foreground">
                Also available in {stateName}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button asChild size="sm" className="sm:h-10 sm:px-4">
                <Link href="/games/powerball">Powerball</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="sm:h-10 sm:px-4">
                <Link href="/games/mega-millions">Mega Millions</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Browse Other States */}
        <section className="mb-12 sm:mb-16">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-lg font-semibold">Browse Other States</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/states">
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Drawing Schedule Table */}
        {gameFamilies.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <StateDrawingScheduleTable
              stateName={stateName}
              stateSlug={stateSlug}
              gameFamilies={gameFamilies}
            />
          </section>
        )}

        {/* SEO Content */}
        <section className="space-y-6 sm:space-y-8 border-t pt-8 sm:pt-12">
          <SEOTextBlock
            title={`About ${stateName} Lottery`}
            content={[
              `The ${stateName} Lottery offers a variety of games with drawings throughout the week. Players can participate in daily games like Pick 3 and Pick 4, as well as multi-state games like Powerball and Mega Millions.`,
              `All results shown are unofficial. Please verify your numbers with the official ${stateName} Lottery website before claiming any prizes.`,
            ]}
          />

          <SEOTextBlock
            title="How to Check Your Numbers"
            content={[
              `Select a game above to view the latest winning numbers and past draws. Each game page also shows number frequency statistics to help you analyze drawing patterns.`,
              `You can access historical results going back several years and export the data to CSV for your own analysis.`,
            ]}
          />
        </section>
      </Container>
    </>
  )
}
