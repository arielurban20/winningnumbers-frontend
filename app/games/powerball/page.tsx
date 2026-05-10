import { Suspense } from "react"
import Link from "next/link"
import { getPowerballMega, getPast365National } from "@/lib/api/draws"
import { getMostFrequent, getLeastFrequent } from "@/lib/api/stats"
import { NationalGameCard } from "@/components/cards"
import { NationalCardSkeleton } from "@/components/feedback"
import { PastDrawsTable } from "@/components/tables"
import { NumberStatsCards } from "@/components/stats"
import { Breadcrumbs, SEOTextBlock, Container } from "@/components/layout"
import { JsonLd, FAQSection } from "@/components/seo"
import { generateBreadcrumbSchema } from "@/lib/seo/jsonLd"
import { POPULAR_STATES, buildStateUrl } from "@/lib/utils/buildLotteryLinks"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, MapPin, HelpCircle, Info, Clock, Calendar, History, BarChart3 } from "lucide-react"
import type { Metadata } from "next"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

// Revalidate every 60 seconds to ensure fresh lottery results
export const revalidate = 60

export const metadata: Metadata = {
  title: "Powerball Results Today | Latest Winning Numbers",
  description: "Get the latest Powerball winning numbers, jackpot amounts, and past draw results. Updated after every drawing. Check your tickets now!",
  alternates: {
    canonical: `${siteUrl}/games/powerball`,
  },
  openGraph: {
    title: "Powerball Results Today | Latest Winning Numbers",
    description: "Get the latest Powerball winning numbers, jackpot amounts, and past draw results. Updated after every drawing.",
    url: `${siteUrl}/games/powerball`,
    type: "website",
  },
}

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Powerball" },
]

const powerballFAQ = [
  {
    question: "When are Powerball drawings held?",
    answer: "Powerball drawings are held three times a week on Monday, Wednesday, and Saturday at 10:59 PM ET.",
  },
  {
    question: "How do I play Powerball?",
    answer: "Pick 5 numbers from 1-69 for the white balls and 1 number from 1-26 for the red Powerball. Match all 6 to win the jackpot!",
  },
  {
    question: "What is Power Play?",
    answer: "Power Play is an optional multiplier that can increase non-jackpot prizes by 2x, 3x, 4x, 5x, or 10x (when jackpot is under $150 million).",
  },
  {
    question: "What are the odds of winning Powerball?",
    answer: "The odds of winning the Powerball jackpot are approximately 1 in 292.2 million. The overall odds of winning any prize are about 1 in 24.9.",
  },
]

async function PowerballContent() {
  try {
    const [pbData, pastDraws, hotNumbers, coldNumbers] = await Promise.all([
      getPowerballMega(),
      getPast365National("powerball"),
      getMostFrequent("powerball", 365, 10),
      getLeastFrequent("powerball", 365, 10),
    ])

    return (
      <>
        {/* Latest Result */}
        <section className="mb-12">
          {pbData.powerball ? (
            <div className="max-w-2xl">
              <NationalGameCard draw={pbData.powerball} featured />
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Info className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Powerball Results Unavailable</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Results are temporarily unavailable. Please check back soon.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Hot/Cold Numbers */}
        {(hotNumbers.length > 0 || coldNumbers.length > 0) && (
          <section className="mb-12">
            <div className="mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold tracking-tight">Number Statistics</h2>
            </div>
            <NumberStatsCards
              hotNumbers={hotNumbers}
              coldNumbers={coldNumbers}
              gameName="Powerball"
            />
          </section>
        )}

        {/* Past Results */}
        {pastDraws.length > 0 ? (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold tracking-tight">Past Powerball Results</h2>
              </div>
              <Badge variant="secondary">{pastDraws.length} draws</Badge>
            </div>
            <PastDrawsTable draws={pastDraws} showSession={false} />
          </section>
        ) : (
          <section className="mb-12">
            <Card className="border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="mb-4 h-10 w-10 text-muted-foreground/50" />
                <p className="text-lg font-medium">Past Results Temporarily Unavailable</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Historical Powerball results are temporarily unavailable. Check back soon.
                </p>
              </CardContent>
            </Card>
          </section>
        )}
      </>
    )
  } catch (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Info className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-lg font-medium">Unable to Load Results</p>
          <p className="mt-1 text-sm text-muted-foreground">
            We encountered an issue loading the results. Please try again later.
          </p>
        </CardContent>
      </Card>
    )
  }
}

export default function PowerballPage() {
  const jsonLd = generateBreadcrumbSchema(
    breadcrumbs.map((b) => ({
      name: b.label,
      url: b.href ? `${siteUrl}${b.href}` : `${siteUrl}/games/powerball`,
    }))
  )

  return (
    <>
      <JsonLd data={jsonLd} />

      <Container className="py-8">
        <Breadcrumbs items={breadcrumbs} />

        {/* Hero Section */}
        <section className="mb-10 mt-6">
          <h1 className="text-balance text-4xl font-bold tracking-tight mb-3">
            Powerball Results Today
          </h1>
          <p className="text-pretty text-lg text-muted-foreground max-w-2xl">
            Get the latest Powerball winning numbers and jackpot information. 
            Results are updated immediately after each drawing.
          </p>
        </section>

        {/* Dynamic Content */}
        <Suspense fallback={<NationalCardSkeleton />}>
          <PowerballContent />
        </Suspense>

        {/* Info Cards */}
        <section className="mb-12 grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-lottery-red/10 to-transparent">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-lottery-red" />
                <h2 className="font-semibold">How to Play Powerball</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lottery-red text-xs font-bold text-white">1</span>
                <p className="text-sm text-muted-foreground">Select 5 white ball numbers from 1 to 69</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lottery-red text-xs font-bold text-white">2</span>
                <p className="text-sm text-muted-foreground">Select 1 red Powerball number from 1 to 26</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lottery-red text-xs font-bold text-white">3</span>
                <p className="text-sm text-muted-foreground">Add Power Play to multiply non-jackpot prizes</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lottery-gold text-xs font-bold text-lottery-gold-foreground">4</span>
                <p className="text-sm text-muted-foreground">Match all 6 numbers to win the jackpot!</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-lottery-red/10 to-transparent">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-lottery-red" />
                <h2 className="font-semibold">Drawing Schedule</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Days</p>
                  <p className="text-muted-foreground">Mon, Wed, Sat</p>
                </div>
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-muted-foreground">10:59 PM ET</p>
                </div>
                <div>
                  <p className="font-medium">Sales Cut-off</p>
                  <p className="text-muted-foreground">1-2 hours before</p>
                </div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">Tallahassee, FL</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Play in Your State - Using verified state links */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-lottery-red" />
            <h2 className="text-xl font-semibold">Play Powerball in Your State</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_STATES.map((state) => (
              <Button key={state.slug} asChild variant="outline" size="sm">
                <Link href={buildStateUrl(state.slug)}>{state.name}</Link>
              </Button>
            ))}
            <Button asChild variant="default" size="sm" className="bg-lottery-red hover:bg-lottery-red/90">
              <Link href="/states">
                All States
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection items={powerballFAQ} title="Powerball FAQ" />

        {/* SEO Content */}
        <section className="mt-12 space-y-8 border-t pt-8">
          <SEOTextBlock
            title="About Powerball"
            content={[
              "Powerball is one of America's most popular lottery games, offering life-changing jackpots that often reach hundreds of millions of dollars. The game is played in 45 states, Washington D.C., Puerto Rico, and the U.S. Virgin Islands.",
              "The current Powerball format launched in 2015 with the 5/69 + 1/26 matrix. The largest Powerball jackpot ever won was $2.04 billion in November 2022.",
            ]}
          />
        </section>

        {/* Related Links */}
        <section className="mt-8 rounded-xl bg-muted/50 p-6">
          <h2 className="text-lg font-semibold mb-4">More Lottery Results</h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/games/mega-millions">Mega Millions Results</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/states">Browse All States</Link>
            </Button>
          </div>
        </section>
      </Container>
    </>
  )
}
