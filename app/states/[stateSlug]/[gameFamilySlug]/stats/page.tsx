import { notFound } from "next/navigation"
import Link from "next/link"
import { getStateBySlug, getStateGames } from "@/lib/api/states"
import { getStatsForGame } from "@/lib/api/stats"
import { groupGamesByFamily, findGamesByFamilySlug } from "@/lib/utils/groupGames"
import { StatsTable } from "@/components/tables"
import { JsonLd } from "@/components/seo"
import { SEOTextBlock, Breadcrumbs, Container } from "@/components/layout"
import { GameLogo } from "@/components/cards/GameLogo"
import { generateStatsMetadata, getCanonicalUrl } from "@/lib/seo/metadata"
import { generateBreadcrumbSchema } from "@/lib/seo/jsonLd"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, Zap } from "lucide-react"
import type { Metadata } from "next"

interface StatsPageProps {
  params: Promise<{ stateSlug: string; gameFamilySlug: string }>
}

export async function generateMetadata({
  params,
}: StatsPageProps): Promise<Metadata> {
  const { stateSlug, gameFamilySlug } = await params
  const state = await getStateBySlug(stateSlug)
  const games = await getStateGames(stateSlug)
  const matchingGames = findGamesByFamilySlug(games, gameFamilySlug)

  if (!state || matchingGames.length === 0) {
    return { title: "Stats Not Found" }
  }

  const families = groupGamesByFamily(matchingGames, undefined, stateSlug, state?.name)
  const family = families[0]

  return generateStatsMetadata(
    family?.familyName || gameFamilySlug,
    state.name,
    stateSlug,
    gameFamilySlug
  )
}

export default async function StatsPage({ params }: StatsPageProps) {
  const { stateSlug, gameFamilySlug } = await params
  const [state, games] = await Promise.all([
    getStateBySlug(stateSlug),
    getStateGames(stateSlug),
  ])

  if (!state) {
    notFound()
  }

  const matchingGames = findGamesByFamilySlug(games, gameFamilySlug)

  if (matchingGames.length === 0) {
    notFound()
  }

  const families = groupGamesByFamily(matchingGames, undefined, stateSlug, state.name)
  const family = families[0]

  if (!family) {
    notFound()
  }

  // The raw game slug from the API (e.g. "powerball", "cash-5").
  // getStatsForGame builds the compound slug internally: "{gameSlug}-{stateSlug}"
  // e.g. powerball-tx, cash-5-pa, mega-millions-de, jackpot-triple-play-fl
  const gameSlug = matchingGames[0].slug
  const resolvedGameSlug = `${gameSlug}-${stateSlug}`
  const mostUrl = `/api/stats/${resolvedGameSlug}/most-frequent?days=365&top=10`
  const leastUrl = `/api/stats/${resolvedGameSlug}/least-frequent?days=365&top=10`

  const {
    mostFrequent,
    leastFrequent,
    mostFrequentBonus,
    leastFrequentBonus,
    backendUnavailable,
  } = await getStatsForGame(gameSlug, stateSlug, 365, 10)

  console.log("[stats page]", {
    stateSlug,
    gameFamilySlug,
    resolvedGameSlug,
    mostUrl,
    leastUrl,
    mostFrequentLength: mostFrequent.length,
    leastFrequentLength: leastFrequent.length,
    backendUnavailable,
  })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "States", url: getCanonicalUrl("/states") },
    { name: state.name, url: getCanonicalUrl(`/states/${stateSlug}`) },
    { name: family.familyName, url: getCanonicalUrl(`/states/${stateSlug}/${gameFamilySlug}`) },
    { name: "Statistics", url: getCanonicalUrl(`/states/${stateSlug}/${gameFamilySlug}/stats`) },
  ])

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <Container className="py-8">
        <Breadcrumbs
          items={[
            { label: "States", href: "/states" },
            { label: state.name, href: `/states/${stateSlug}` },
            { label: family.familyName, href: `/states/${stateSlug}/${gameFamilySlug}` },
            { label: "Statistics" },
          ]}
        />

        {/* Header */}
        <section className="mb-8">
          <div className="flex items-start gap-4 sm:gap-6">
            <GameLogo
              logoUrl={family.logo_url}
              logo={family.logo}
              iconUrl={family.icon_url}
              gameName={family.familyName}
              gameSlug={gameFamilySlug}
              stateSlug={stateSlug}
              size="xl"
              priority
            />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {family.familyName} Number Frequency
              </h1>
              <p className="mt-2 text-lg text-muted-foreground">
                {state.name} Lottery Statistics - Past 365 Days
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

        {/* Main number stats tabs */}
        <section className="mb-12">
          <Tabs defaultValue="most">
            <TabsList className="mb-6">
              <TabsTrigger value="most" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Most Frequent
              </TabsTrigger>
              <TabsTrigger value="least" className="gap-2">
                <TrendingDown className="h-4 w-4" />
                Least Frequent
              </TabsTrigger>
            </TabsList>

            <TabsContent value="most">
              <StatsTable
                stats={mostFrequent}
                title="Top 10 Most Drawn Numbers"
                type="most"
                backendUnavailable={backendUnavailable}
              />
            </TabsContent>

            <TabsContent value="least">
              <StatsTable
                stats={leastFrequent}
                title="Top 10 Least Drawn Numbers"
                type="least"
                backendUnavailable={backendUnavailable}
              />
            </TabsContent>
          </Tabs>
        </section>

        {/* Bonus ball stats — only rendered when the backend returns bonus-type data */}
        {(mostFrequentBonus.length > 0 || leastFrequentBonus.length > 0) && (
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="text-xl font-bold">Bonus Ball Statistics</h2>
            </div>
            <p className="mb-6 text-sm text-muted-foreground">
              Frequency data for the bonus ball (e.g. Powerball, Mega Ball, Star Ball) drawn separately from main numbers.
            </p>

            {mostFrequentBonus.length === 0 && leastFrequentBonus.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                Bonus ball statistics will appear when enough historical data is available.
              </p>
            ) : (
              <Tabs defaultValue="bonus-most">
                <TabsList className="mb-6">
                  <TabsTrigger value="bonus-most" className="gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Hot Bonus Balls
                  </TabsTrigger>
                  <TabsTrigger value="bonus-least" className="gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Cold Bonus Balls
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="bonus-most">
                  {mostFrequentBonus.length > 0 ? (
                    <StatsTable
                      stats={mostFrequentBonus}
                      title="Top 10 Most Drawn Bonus Balls"
                      type="most"
                      backendUnavailable={false}
                    />
                  ) : (
                    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                      Bonus ball statistics will appear when enough historical data is available.
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="bonus-least">
                  {leastFrequentBonus.length > 0 ? (
                    <StatsTable
                      stats={leastFrequentBonus}
                      title="Top 10 Least Drawn Bonus Balls"
                      type="least"
                      backendUnavailable={false}
                    />
                  ) : (
                    <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                      Bonus ball statistics will appear when enough historical data is available.
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </section>
        )}

        {/* Disclaimer */}
        <Card className="mb-12 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-semibold">Important Note</h3>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-amber-700 dark:text-amber-300">
            <p>
              Lottery drawings are random events. Past frequency does not predict 
              future results. Each number has an equal chance of being drawn regardless 
              of how often it has appeared in the past. Play responsibly.
            </p>
          </CardContent>
        </Card>

        {/* SEO Content */}
        <section className="space-y-8 border-t pt-8">
          <SEOTextBlock
            title="Understanding Number Frequency"
            content={[
              "Number frequency statistics show how often each number has been drawn over the past year. Some players use this information to select their numbers, though it's important to remember that lottery drawings are completely random.",
              "The most frequent numbers are sometimes called 'hot' numbers, while the least frequent are called 'cold' numbers. However, these patterns are purely historical and don't influence future drawings.",
            ]}
          />

          <SEOTextBlock
            title="How to Use These Statistics"
            content={[
              "Some players prefer to choose numbers that appear frequently, believing they're 'lucky' numbers. Others prefer less common numbers, hoping they're 'due' to appear.",
              "The truth is that every number has the same mathematical probability of being drawn. Use these statistics for fun, but don't rely on them as a winning strategy.",
            ]}
          />
        </section>
      </Container>
    </>
  )
}
