import { Suspense } from "react"
import Link from "next/link"
import { getPowerballMega, getRecentDraws } from "@/lib/api/draws"
import { getStates } from "@/lib/api/states"
import { getAllIndividualGames } from "@/lib/api/gameFamilies"
import { NationalGameCard } from "@/components/cards"
import { NationalCardSkeleton, CardSkeleton } from "@/components/feedback"
import { SEOTextBlock, Container } from "@/components/layout"
import { JsonLd, FAQSection } from "@/components/seo"
import {
  MultiStateGamesSection,
  BrowseByGameSection,
  BrowseByStateSection,
  TodayResultsSection,
  UpcomingDrawingsSection,
  TopJackpotsSection,
  TopLotteryJackpotsTeaserSection,
  LotteryToolsSection,
} from "@/components/sections"
import { generateWebSiteSchema } from "@/lib/seo/jsonLd"
import { generateHomeMetadata } from "@/lib/seo/metadata"
import { Sparkles, TrendingUp, Shield, MapPin, Trophy, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { DrawResult } from "@/types/api"

export const metadata = generateHomeMetadata()

// Revalidate every 60 seconds to ensure fresh lottery results
export const revalidate = 60

const homeFAQ = [
  {
    question: "How often are lottery results updated?",
    answer: "Results are updated immediately after each official drawing. Powerball drawings are Mon/Wed/Sat at 10:59 PM ET, Mega Millions on Tue/Fri at 11:00 PM ET.",
  },
  {
    question: "Which lottery games can I find here?",
    answer: "We cover Powerball, Mega Millions, and state lotteries from 47 US states including Pick 3, Pick 4, Cash 5, Lotto, and many more.",
  },
  {
    question: "How do I check my lottery tickets?",
    answer: "Navigate to your state page, find your game, and compare your numbers with the winning numbers shown. Always verify with official sources before claiming.",
  },
]



async function NationalGames() {
  try {
    const data = await getPowerballMega()

    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {data.powerball && (
          <NationalGameCard
            draw={data.powerball}
            href="/games/powerball"
            featured
          />
        )}
        {data.mega_millions && (
          <NationalGameCard
            draw={data.mega_millions}
            href="/games/mega-millions"
            featured
          />
        )}
        {!data.powerball && !data.mega_millions && (
          <div className="lg:col-span-2">
            <Card className="border-dashed">
              <CardContent className="py-12 text-center text-muted-foreground">
                National lottery results are temporarily unavailable.
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    )
  } catch {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center text-muted-foreground">
          Unable to load national lottery results. Please try again later.
        </CardContent>
      </Card>
    )
  }
}

/**
 * Fetches recent draws and powerball/mega data, then renders
 * TodayResultsSection, UpcomingDrawingsSection, and TopJackpotsSection.
 * Uses a single data fetch pass so we don't duplicate API calls.
 */
async function DynamicHomeSections() {
  try {
    const [recentDraws, pbMega] = await Promise.all([
      getRecentDraws(16),
      getPowerballMega(),
    ])

    // Combine all available draws for upcoming + jackpots
    const nationalDraws: DrawResult[] = [
      pbMega.powerball,
      pbMega.mega_millions,
    ].filter(Boolean) as DrawResult[]

    // Today results: prefer /api/draws/recent results; if empty, use national draws as fallback
    const todayResults =
      recentDraws.length > 0 ? recentDraws : nationalDraws

    // Upcoming: all draws that have next draw info (national + state draws)
    const allDrawsForUpcoming = [...nationalDraws, ...recentDraws]

    // Top jackpots: all draws with a jackpot value
    const allDrawsForJackpots = [...nationalDraws, ...recentDraws]

    return (
      <>
        {todayResults.length > 0 && (
          <section className="mb-12 sm:mb-16 md:mb-20">
            <Container>
              <TodayResultsSection results={todayResults} />
            </Container>
          </section>
        )}
        {allDrawsForUpcoming.some(
          (d) => d.next_draw_text || d.next_draw_relative || d.next_draw_at_local
        ) && (
          <section className="mb-12 sm:mb-16 md:mb-20">
            <Container>
              <UpcomingDrawingsSection draws={allDrawsForUpcoming} />
            </Container>
          </section>
        )}
        {allDrawsForJackpots.some((d) => {
          const raw = d as DrawResult & { top_prize?: string; prize_amount?: string }
          return d.jackpot_next || raw.top_prize || raw.prize_amount
        }) && (
          <section className="mb-12 sm:mb-16 md:mb-20">
            <Container>
              <TopJackpotsSection draws={allDrawsForJackpots} />
            </Container>
          </section>
        )}
      </>
    )
  } catch {
    // Silently skip — home page should never crash because of these sections
    return null
  }
}

async function BrowseDataLoader() {
  const [states, games] = await Promise.all([
    getStates({ includeTodayResults: true }),
    getAllIndividualGames(),
  ])
  
  return { states, games }
}

async function BrowseSections() {
  const { states, games } = await BrowseDataLoader()
  
  return (
    <>
      {/* Browse by Lottery Game Section */}
      <section className="mb-12 sm:mb-16 md:mb-20">
        <Container>
          <BrowseByGameSection games={games} />
        </Container>
      </section>

      {/* Browse by State Section */}
      <section className="mb-12 sm:mb-16 md:mb-20">
        <Container>
          <BrowseByStateSection states={states} />
        </Container>
      </section>
    </>
  )
}

export default function HomePage() {
  const jsonLd = generateWebSiteSchema()

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Hero Section - Compact on mobile */}
      <section className="relative w-full overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <Container className="relative py-10 sm:py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 sm:mb-6 inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Updated after every drawing
            </div>
            <h1 className="text-balance text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Latest Lottery Results
              <span className="block text-primary">Today</span>
            </h1>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-pretty text-sm sm:text-lg text-muted-foreground">
              Get the latest winning numbers for Powerball, Mega Millions, and state 
              lotteries across the United States.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <Button asChild size="sm" className="shadow-lg shadow-primary/25 sm:h-11 sm:px-6 sm:text-base">
                <Link href="/games/powerball">
                  <Trophy className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Powerball
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="sm:h-11 sm:px-6 sm:text-base">
                <Link href="/games/mega-millions">
                  Mega Millions
                </Link>
              </Button>
              <Button asChild size="sm" variant="ghost" className="sm:h-11 sm:px-6 sm:text-base">
                <Link href="/states">
                  All States
                  <ArrowRight className="ml-1 sm:ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Main Content */}
      <div className="w-full py-12 md:py-16">
        {/* National Games Section */}
        <section className="mb-12 sm:mb-16 md:mb-20">
          <Container>
            <div className="mb-4 sm:mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight lg:text-3xl">National Lottery Games</h2>
                <p className="mt-0.5 sm:mt-1 text-sm sm:text-base text-muted-foreground">The biggest jackpots in America</p>
              </div>
            </div>
            <Suspense
              fallback={
                <div className="grid gap-6 lg:grid-cols-2">
                  <NationalCardSkeleton />
                  <NationalCardSkeleton />
                </div>
              }
            >
              <NationalGames />
            </Suspense>
          </Container>
        </section>

        {/* Multi-State Games Section */}
        <section className="mb-12 sm:mb-16 md:mb-20">
          <Container>
            <MultiStateGamesSection />
          </Container>
        </section>

        {/* Today Results + Upcoming Drawings + Top Jackpots */}
        <Suspense fallback={null}>
          <DynamicHomeSections />
        </Suspense>

        {/* Jackpot History Teaser */}
        <section className="mb-12 sm:mb-16 md:mb-20">
          <Container>
            <TopLotteryJackpotsTeaserSection />
          </Container>
        </section>

        {/* Browse by Game and State Sections */}
        <Suspense
          fallback={
            <div className="space-y-12 sm:space-y-16 md:space-y-20">
              <Container>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {[...Array(12)].map((_, i) => (
                    <CardSkeleton key={i} />
                  ))}
                </div>
              </Container>
            </div>
          }
        >
          <BrowseSections />
        </Suspense>

        {/* Features Section - Horizontal scroll on mobile, grid on desktop */}
        <section className="mb-12 sm:mb-16 md:mb-20">
          <Container>
            <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-3">
              <Card className="border-border/50 bg-card/50">
                <CardContent className="flex items-center gap-3 p-4 sm:items-start sm:gap-4 sm:pt-6">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-lottery-green/10">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-lottery-green" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">Real-Time Updates</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Results updated immediately after each drawing
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="flex items-center gap-3 p-4 sm:items-start sm:gap-4 sm:pt-6">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-primary/10">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">All 47 States</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Complete coverage of US state lotteries
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="flex items-center gap-3 p-4 sm:items-start sm:gap-4 sm:pt-6">
                  <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-lottery-gold/10">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-lottery-gold" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">Official Sources</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Verified from official state lotteries
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>

        {/* Lottery Tools Section */}
        <section className="mb-12 sm:mb-16 md:mb-20">
          <Container>
            <LotteryToolsSection />
          </Container>
        </section>

        {/* FAQ Section */}
        <Container>
          <FAQSection items={homeFAQ} title="Frequently Asked Questions" />
        </Container>

        {/* SEO Content */}
        <section className="mt-16 border-t pt-12">
          <Container>
            <div className="space-y-8">
              <SEOTextBlock
                title="About Winning Numbers"
                content={[
                  "Welcome to Winning Numbers, your trusted source for the latest winning numbers from lotteries across the United States. We provide up-to-date results for national games like Powerball and Mega Millions, as well as state-specific games including Pick 3, Pick 4, Cash 5, and many more.",
                  "Our results are updated immediately after each drawing, ensuring you have access to the most current winning numbers. Whether you're checking your tickets or researching number patterns, we've got you covered.",
                ]}
              />

              <Card className="overflow-hidden border-lottery-gold/30 bg-gradient-to-br from-lottery-gold/10 via-transparent to-transparent">
                <CardHeader>
                  <h3 className="flex items-center gap-2 text-lg font-semibold">
                    <Shield className="h-5 w-5 text-lottery-gold" />
                    Play Responsibly
                  </h3>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p>
                    Lottery games are meant to be fun. If you or someone you know has a 
                    gambling problem, call the National Problem Gambling Helpline at{" "}
                    <a href="tel:1-800-522-4700" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
                      1-800-522-4700
                    </a>
                    . The helpline is available 24/7.
                  </p>
                </CardContent>
              </Card>
            </div>
          </Container>
        </section>
      </div>
    </>
  )
}
