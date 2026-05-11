import { notFound } from "next/navigation"
import Link from "next/link"
import { getStates, getStateGames } from "@/lib/api/states"
import { getDrawResult, getPast365 } from "@/lib/api/draws"
import { getMostFrequent, getLeastFrequent } from "@/lib/api/stats"
import { groupGamesByFamily, findSessionInFamily } from "@/lib/utils/groupGames"
import { buildFamilyUrl, buildSessionUrl, buildStatsUrl, buildHistoricalUrl, getStateName } from "@/lib/utils/buildLotteryLinks"
import { Breadcrumbs, SEOTextBlock, Container } from "@/components/layout"
import { PastDrawsTable } from "@/components/tables"
import { NumberStatsCards } from "@/components/stats"
import { ResultNumbersRow } from "@/components/numbers"
import { StatusBadge, GameLogo } from "@/components/cards"
import { JsonLd } from "@/components/seo"
import { generateBreadcrumbSchema } from "@/lib/seo/jsonLd"
import { getCanonicalUrl } from "@/lib/seo/metadata"
import { formatDrawDate } from "@/lib/utils/formatDate"
import { formatJackpot } from "@/lib/utils/formatCurrency"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/feedback"
import { NextDrawCountdown } from "@/components/cards/NextDrawCountdown"
import { Calendar, Trophy, ArrowRight, ChevronRight, BarChart3, History, Layers } from "lucide-react"
import type { Metadata } from "next"

interface SessionPageProps {
  params: Promise<{
    stateSlug: string
    gameFamilySlug: string
    sessionSlug: string
  }>
}

export async function generateMetadata({ params }: SessionPageProps): Promise<Metadata> {
  const { stateSlug, gameFamilySlug, sessionSlug } = await params
  
  const [states, games] = await Promise.all([
    getStates(),
    getStateGames(stateSlug),
  ])
  
  const state = states.find((s) => s.slug === stateSlug)
  const families = groupGamesByFamily(games, undefined, stateSlug, state?.name)
  const family = families.find((f) => f.familySlug === gameFamilySlug)
  const session = family ? findSessionInFamily(family, sessionSlug) : undefined
  
  if (!state || !family || !session) {
    return { title: "Session Not Found" }
  }
  
  const sessionName = session.game.name
  const stateName = state.name
  const canonicalUrl = getCanonicalUrl(`/states/${stateSlug}/${gameFamilySlug}/${sessionSlug}`)
  
  return {
    title: `${sessionName} ${stateName} Results Today | Winning Numbers`,
    description: `Get the latest ${sessionName} lottery results for ${stateName}. View today's winning numbers, past draws, and statistics.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${sessionName} ${stateName} Results Today`,
      description: `Latest ${sessionName} winning numbers and results for ${stateName}.`,
      url: canonicalUrl,
      type: "website",
    },
  }
}

export default async function SessionPage({ params }: SessionPageProps) {
  const { stateSlug, gameFamilySlug, sessionSlug } = await params
  
  // Fetch data
  const [states, games] = await Promise.all([
    getStates(),
    getStateGames(stateSlug),
  ])
  
  const state = states.find((s) => s.slug === stateSlug)
  if (!state) notFound()
  
  const families = groupGamesByFamily(games, undefined, stateSlug, state.name)
  const family = families.find((f) => f.familySlug === gameFamilySlug)
  if (!family) notFound()
  
  const session = findSessionInFamily(family, sessionSlug)
  if (!session) notFound()
  
  // Fetch session-specific data using the API game slug (sessionSlug is the real API slug)
  const [latestDraw, pastDraws, hotNumbers, coldNumbers] = await Promise.all([
    getDrawResult(session.sessionSlug, stateSlug),
    getPast365(session.sessionSlug, stateSlug),
    getMostFrequent(session.sessionSlug, 365, 10),
    getLeastFrequent(session.sessionSlug, 365, 10),
  ])
  const recentDraws = pastDraws.slice(0, 10)
  const extraSecondaryCount =
    latestDraw?.extra_items?.filter((item) => item?.type === "secondary_drawing").length || 0
  const hasLatestSecondaryDrawings =
    (latestDraw?.secondary_drawings?.length || 0) > 0 ||
    Boolean(latestDraw?.secondary_drawing) ||
    extraSecondaryCount > 0
  const latestMainCount = latestDraw?.main_numbers?.length || 0
  const isCompactNumberGame =
    latestMainCount > 0 &&
    latestMainCount <= 4 &&
    !hasLatestSecondaryDrawings &&
    (latestDraw?.bonus_items?.length || 0) <= 1
  const latestNumbersSize = isCompactNumberGame ? "md" : "lg"
  
  const sessionName = session.game.name
  const stateName = getStateName(state)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"
  
  // URLs
  const familyUrl = buildFamilyUrl(stateSlug, gameFamilySlug)
  const statsUrl = buildStatsUrl(stateSlug, gameFamilySlug)
  const historicalUrl = buildHistoricalUrl(stateSlug, gameFamilySlug)
  
  // Related sessions (other sessions in the same family)
  const relatedSessions = family.sessions.filter(
    (s) => s.sessionSlug !== session.sessionSlug
  )
  
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "States", href: "/states" },
    { label: stateName, href: `/states/${stateSlug}` },
    { label: family.familyName, href: familyUrl },
    { label: session.sessionName },
  ]
  
  const breadcrumbSchema = generateBreadcrumbSchema(
    breadcrumbs.map((b) => ({
      name: b.label,
      url: b.href ? `${siteUrl}${b.href}` : `${siteUrl}/states/${stateSlug}/${gameFamilySlug}/${sessionSlug}`,
    }))
  )

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      
      <Container className="py-8">
        <Breadcrumbs items={breadcrumbs} />
        
        {/* Hero Section */}
        <section className="mb-10 mt-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4 sm:gap-6">
              <GameLogo
                logoUrl={session.game.logo_url || family.logo_url}
                logo={session.game.logo || family.logo}
                iconUrl={session.game.icon_url || family.icon_url}
                gameName={sessionName}
                gameSlug={gameFamilySlug}
                stateSlug={stateSlug}
                size="xl"
                priority
              />
              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {sessionName} Results
                </h1>
                <p className="mt-1 text-lg text-muted-foreground">
                  {stateName} Lottery
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">{session.sessionName}</Badge>
                  <Badge variant="outline">{family.familyName} Family</Badge>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={familyUrl}>
                  <Layers className="mr-1 h-4 w-4" />
                  All {family.familyName}
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={statsUrl}>
                  <BarChart3 className="mr-1 h-4 w-4" />
                  Stats
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={historicalUrl}>
                  <History className="mr-1 h-4 w-4" />
                  Historical
                </Link>
              </Button>
            </div>
          </div>
        </section>
        
        {/* Latest Result */}
        <section className="mb-12">
          <Card className="mx-auto w-full max-w-3xl overflow-hidden border-2 border-primary/20">
            <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl">Latest {session.sessionName} Result</CardTitle>
                  {latestDraw && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDrawDate(latestDraw.draw_date)}
                    </div>
                  )}
                </div>
                {latestDraw && <StatusBadge statusColor={latestDraw.draw_status_color} />}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-5">
              {latestDraw ? (
                <div className="space-y-4">
                  {/* Centered Numbers */}
                <div className="flex justify-center py-1 sm:py-2">
                  {(() => {
                    const secondaryExtras = Array.isArray(latestDraw.secondary_drawings)
                      ? latestDraw.secondary_drawings
                      : latestDraw.secondary_drawing
                      ? [latestDraw.secondary_drawing]
                      : []
                    const mergedExtras = [...(latestDraw.extra_items || []), ...secondaryExtras]
                    return (
                    <ResultNumbersRow
                      mainNumbers={latestDraw.main_numbers || []}
                      mainItems={latestDraw.main_items}
                      bonusItems={latestDraw.bonus_items || []}
                      extraItems={mergedExtras}
                      statusColor={latestDraw.draw_status_color}
                      gameSlug={latestDraw.game_slug}
                      size={latestNumbersSize}
                      centered={true}
                    />
                    )
                  })()}
                </div>
                  
                  {/* Jackpot & Next Draw */}
                  {(latestDraw.jackpot_next || latestDraw.next_draw_text || latestDraw.next_draw_relative || latestDraw.countdown_seconds != null) && (
                    <div className="mx-auto flex w-full max-w-xl flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-lg bg-muted/50 px-3 py-2.5 sm:gap-x-5 sm:px-4 sm:py-3">
                      {latestDraw.jackpot_next && (
                        <div className="flex items-center gap-2 text-center">
                          <Trophy className="h-4 w-4 text-lottery-gold" />
                          <span className="text-sm text-muted-foreground">Jackpot:</span>
                          <span className="text-base font-bold text-lottery-gold sm:text-lg">
                            {formatJackpot(latestDraw.jackpot_next)}
                          </span>
                        </div>
                      )}
                      {(latestDraw.next_draw_text || latestDraw.next_draw_relative || latestDraw.countdown_seconds != null) && (
                        <NextDrawCountdown
                          countdown_seconds={latestDraw.countdown_seconds}
                          next_draw_at_local={latestDraw.next_draw_at_local}
                          next_draw_timezone={latestDraw.next_draw_timezone}
                          next_draw_relative={latestDraw.next_draw_relative}
                          next_draw_text={latestDraw.next_draw_text}
                          variant="compact"
                          className="text-xs text-muted-foreground sm:text-sm"
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  type="no-data"
                  title="No Recent Results"
                  description={`No recent ${session.sessionName} results available.`}
                />
              )}
            </CardContent>
          </Card>
        </section>
        
        {/* Recent Results (Last 10 Draws) */}
        {recentDraws.length > 0 && (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Recent Results</h2>
                <p className="mt-1 text-sm text-muted-foreground">Last 10 draws</p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={historicalUrl}>
                  View Full Historical Data
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <PastDrawsTable draws={recentDraws} showSession={false} gameSlug={session.sessionSlug} />
          </section>
        )}

        {/* Hot/Cold Numbers */}
        {(hotNumbers.length > 0 || coldNumbers.length > 0) && (
          <section className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Number Statistics</h2>
              <p className="mt-1 text-sm text-muted-foreground">Based on the last 365 days</p>
            </div>
            <NumberStatsCards
              hotNumbers={hotNumbers}
              coldNumbers={coldNumbers}
              gameName={sessionName}
            />
          </section>
        )}

        {/* Related Sessions */}
        {relatedSessions.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-bold">Other {family.familyName} Sessions</h2>
            <div className="flex flex-wrap gap-3">
              {relatedSessions.map((s) => (
                <Button
                  key={s.sessionSlug}
                  asChild
                  variant="outline"
                  className="group"
                >
                  <Link href={buildSessionUrl(stateSlug, gameFamilySlug, s.sessionDisplaySlug || "")}>
                    {s.sessionName}
                    <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
              ))}
            </div>
          </section>
        )}
        
        {/* SEO Content */}
        <section className="border-t pt-8">
          <SEOTextBlock
            title={`About ${sessionName}`}
            content={[
              `${sessionName} is part of the ${family.familyName} lottery game family in ${stateName}. Check back after each drawing for the latest winning numbers.`,
              `View all ${family.familyName} sessions including ${family.sessions.map(s => s.sessionName).join(", ")} for complete coverage of this game.`,
            ]}
          />
        </section>
        
        {/* Back to Family Link */}
        <section className="mt-8">
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href={familyUrl}>
              <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
              Back to All {family.familyName} Results
            </Link>
          </Button>
        </section>
      </Container>
    </>
  )
}
