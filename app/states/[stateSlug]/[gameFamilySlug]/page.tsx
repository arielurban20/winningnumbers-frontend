import { notFound } from "next/navigation"
import Link from "next/link"
import { getStateBySlug, getStateGames } from "@/lib/api/states"
import { getDrawResult, getPast365Draws } from "@/lib/api/draws"
import { getMostFrequent, getLeastFrequent } from "@/lib/api/stats"
import { groupGamesByFamily, findGamesByFamilySlug, buildSessionUrl } from "@/lib/utils/groupGames"
import { getStateName } from "@/lib/utils/buildLotteryLinks"
import { SessionResultBlock } from "@/components/cards"
import { PastDrawsTable } from "@/components/tables"
import { NumberStatsCards } from "@/components/stats"
import { JsonLd, FAQSection } from "@/components/seo"
import { SEOTextBlock, Breadcrumbs, Container } from "@/components/layout"
import { GameLogo } from "@/components/cards/GameLogo"
import { generateGameFamilyMetadata, getCanonicalUrl } from "@/lib/seo/metadata"
import { generateBreadcrumbSchema, generateFAQSchema } from "@/lib/seo/jsonLd"
import { getFAQsForGame } from "@/content/faq"
import { getGameGuide } from "@/content/gameGuides"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, History, ArrowRight, Calendar, Info, ChevronRight } from "lucide-react"
import type { Metadata } from "next"
import type { DrawResult, PastDraw, StatItem } from "@/types/api"

interface GameFamilyPageProps {
  params: Promise<{ stateSlug: string; gameFamilySlug: string }>
}

export async function generateMetadata({
  params,
}: GameFamilyPageProps): Promise<Metadata> {
  const { stateSlug, gameFamilySlug } = await params
  const state = await getStateBySlug(stateSlug)
  const games = await getStateGames(stateSlug)
  const matchingGames = findGamesByFamilySlug(games, gameFamilySlug)

  if (!state || matchingGames.length === 0) {
    return { title: "Game Not Found" }
  }

  const families = groupGamesByFamily(matchingGames, undefined, stateSlug, state?.name)
  const family = families[0]

  return generateGameFamilyMetadata(
    family?.familyName || gameFamilySlug,
    state.name,
    stateSlug,
    gameFamilySlug
  )
}

export default async function GameFamilyPage({ params }: GameFamilyPageProps) {
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

  // Fetch latest draws for matching games
  const drawResults = new Map<string, DrawResult>()
  const drawPromises = matchingGames.map(async (game) => {
    try {
      const draw = await getDrawResult(game.slug, stateSlug)
      if (draw) {
        drawResults.set(game.slug, draw)
      }
    } catch {
      // Skip failed draws
    }
  })
  await Promise.all(drawPromises)

  // Group into family - pass stateSlug for proper URL building
  const families = groupGamesByFamily(matchingGames, drawResults, stateSlug, state.name)
  const family = families[0]

  if (!family) {
    notFound()
  }

  // Fetch past draws and stats for each session
  const pastDrawsMap = new Map<string, PastDraw[]>()
  const hotNumbersMap = new Map<string, StatItem[]>()
  const coldNumbersMap = new Map<string, StatItem[]>()
  
  const pastDrawsPromises = family.sessions.map(async (session) => {
    try {
      const [draws, hot, cold] = await Promise.all([
        getPast365Draws(stateSlug, session.sessionSlug),
        getMostFrequent(session.sessionSlug, 365, 10),
        getLeastFrequent(session.sessionSlug, 365, 10),
      ])
      pastDrawsMap.set(session.sessionSlug, draws)
      hotNumbersMap.set(session.sessionSlug, hot)
      coldNumbersMap.set(session.sessionSlug, cold)
    } catch {
      pastDrawsMap.set(session.sessionSlug, [])
      hotNumbersMap.set(session.sessionSlug, [])
      coldNumbersMap.set(session.sessionSlug, [])
    }
  })
  await Promise.all(pastDrawsPromises)
  
  // For display, use the first session's stats or combine if single session
  const firstSessionSlug = family.sessions[0]?.sessionSlug || ""
  const hotNumbers = hotNumbersMap.get(firstSessionSlug) || []
  const coldNumbers = coldNumbersMap.get(firstSessionSlug) || []

  const hasMultipleSessions = family.sessions.length > 1
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"
  const stateName = getStateName(state)
  const faqs = getFAQsForGame(gameFamilySlug)
  const guide = getGameGuide(gameFamilySlug)

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "States", url: getCanonicalUrl("/states") },
    { name: state.name, url: getCanonicalUrl(`/states/${stateSlug}`) },
    { name: family.familyName, url: getCanonicalUrl(`/states/${stateSlug}/${gameFamilySlug}`) },
  ])

  const faqSchema = faqs.length > 0 ? generateFAQSchema(faqs) : null

  return (
    <>
      <JsonLd data={faqSchema ? [breadcrumbSchema, faqSchema] : breadcrumbSchema} />

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <Container className="py-10">
          <Breadcrumbs
            items={[
              { label: "States", href: "/states" },
              { label: stateName, href: `/states/${stateSlug}` },
              { label: family.familyName },
            ]}
          />

          <div className="mt-6 flex items-start gap-4 sm:gap-6">
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
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {family.familyName} Results
              </h1>
              <p className="mt-1 text-lg text-muted-foreground">
                {stateName} Lottery
              </p>
              {hasMultipleSessions && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {family.sessions.map((s) => (
                    <Badge key={s.sessionSlug} variant="secondary">
                      {s.sessionName}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm" className="bg-card">
              <Link href={`/states/${stateSlug}/${gameFamilySlug}/stats`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Number Statistics
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="bg-card">
              <Link href={`/states/${stateSlug}/${gameFamilySlug}/historical`}>
                <History className="mr-2 h-4 w-4" />
                Historical Results
              </Link>
            </Button>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        {/* Session Navigation (for multi-session games) */}
        {hasMultipleSessions && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-semibold">Jump to Session</h2>
            <div className="flex flex-wrap gap-2">
              {family.sessions.map((session) => (
                <Button
                  key={session.sessionSlug}
                  asChild
                  variant="outline"
                  size="sm"
                  className="group"
                >
                  <Link href={buildSessionUrl(stateSlug, gameFamilySlug, session.sessionDisplaySlug || "")}>
                    {session.sessionName}
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              ))}
            </div>
          </section>
        )}

        {/* Latest Results */}
        <section className="mb-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Latest Results</h2>
          </div>
          <Card className="overflow-hidden border-border/50">
            <CardContent className="divide-y p-6">
              {family.sessions.map((session, idx) => (
                <div key={session.sessionSlug} className={idx > 0 ? "pt-6" : ""}>
                  {session.latestDraw ? (
                    <SessionResultBlock
                      sessionName={session.sessionName}
                      sessionDisplaySlug={session.sessionDisplaySlug}
                      stateSlug={stateSlug}
                      familySlug={gameFamilySlug}
                      draw={session.latestDraw}
                      showSessionName={hasMultipleSessions}
                      clickable={hasMultipleSessions}
                    />
                  ) : (
                    <div className="flex items-center justify-center gap-3 rounded-lg bg-muted/50 py-8 text-muted-foreground">
                      <Info className="h-5 w-5" />
                      {hasMultipleSessions && (
                        <span className="font-medium">{session.sessionName}:</span>
                      )}
                      No recent results available
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Past 365 Draws */}
        <section className="mb-16">
          <div className="mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Past 365 Days</h2>
          </div>
          
          {hasMultipleSessions ? (
            <Tabs defaultValue={family.sessions[0].sessionSlug}>
              <TabsList className="mb-6 flex-wrap">
                {family.sessions.map((session) => (
                  <TabsTrigger key={session.sessionSlug} value={session.sessionSlug}>
                    {session.sessionName}
                  </TabsTrigger>
                ))}
              </TabsList>
              {family.sessions.map((session) => (
                <TabsContent key={session.sessionSlug} value={session.sessionSlug}>
                  <PastDrawsTable
                    draws={pastDrawsMap.get(session.sessionSlug) || []}
                    showSession={false}
                  />
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <PastDrawsTable
              draws={pastDrawsMap.get(family.sessions[0]?.sessionSlug) || []}
              showSession={false}
            />
          )}
        </section>

        {/* Hot/Cold Numbers */}
        {(hotNumbers.length > 0 || coldNumbers.length > 0) && (
          <section className="mb-16">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight">Number Statistics</h2>
              <Button asChild variant="outline" size="sm">
                <Link href={`/states/${stateSlug}/${gameFamilySlug}/stats`}>
                  View Full Stats
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <NumberStatsCards
              hotNumbers={hotNumbers}
              coldNumbers={coldNumbers}
              gameName={family.familyName}
            />
            {hasMultipleSessions && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Showing stats for {family.sessions[0]?.sessionName}. View individual session pages for session-specific statistics.
              </p>
            )}
          </section>
        )}

        {/* How to Play */}
        <section className="mb-16 space-y-6">
          <SEOTextBlock
            title={`About ${family.familyName}`}
            content={guide.description}
          />

          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent">
              <h3 className="text-lg font-semibold">How to Play</h3>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {guide.howToPlay.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-muted-foreground">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {idx + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ul>
              {guide.odds && (
                <p className="mt-6 rounded-lg bg-muted/50 p-4 text-sm">
                  <strong>Jackpot Odds:</strong> {guide.odds}
                </p>
              )}
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        {faqs.length > 0 && (
          <section className="mb-16">
            <FAQSection faqs={faqs} />
          </section>
        )}

        {/* Related Games */}
        <section className="rounded-2xl bg-muted/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">More {stateName} Games</h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href={`/states/${stateSlug}`}>
                View All Games
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/games/powerball">Powerball</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/games/mega-millions">Mega Millions</Link>
            </Button>
          </div>
        </section>
      </Container>
    </>
  )
}
