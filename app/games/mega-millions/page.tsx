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
  title: "Mega Millions Results Today",
  description: "Get the latest Mega Millions winning numbers, jackpot amounts, and past draw results. Updated after every drawing. Check your tickets now!",
  alternates: {
    canonical: `${siteUrl}/games/mega-millions`,
  },
  openGraph: {
    title: "Mega Millions Results Today",
    description: "Get the latest Mega Millions winning numbers, jackpot amounts, and past draw results. Updated after every drawing.",
    url: `${siteUrl}/games/mega-millions`,
    type: "website",
  },
}

const breadcrumbs = [
  { label: "Home", href: "/" },
  { label: "Mega Millions" },
]

const megaMillionsFAQ = [
  {
    question: "When are Mega Millions drawings held?",
    answer: "Mega Millions drawings are held twice a week on Tuesday and Friday at 11:00 PM ET.",
  },
  {
    question: "How do I play Mega Millions?",
    answer: "Pick 5 numbers from 1-70 for the white balls and 1 number from 1-25 for the gold Mega Ball. Match all 6 to win the jackpot!",
  },
  {
    question: "What is Megaplier?",
    answer: "Megaplier is an optional feature that can multiply non-jackpot prizes by 2x, 3x, 4x, or 5x for an additional $1 per play.",
  },
  {
    question: "What are the odds of winning Mega Millions?",
    answer: "The odds of winning the Mega Millions jackpot are approximately 1 in 302.6 million. The overall odds of winning any prize are about 1 in 24.",
  },
]

async function MegaMillionsContent() {
  try {
    const [mmData, pastDraws, hotNumbers, coldNumbers] = await Promise.all([
      getPowerballMega(),
      getPast365National("mega-millions"),
      getMostFrequent("mega-millions", 365, 10),
      getLeastFrequent("mega-millions", 365, 10),
    ])

    return (
      <>
        {/* Latest Result */}
        <section className="mb-12">
          {mmData.mega_millions ? (
            <div className="max-w-2xl">
              <NationalGameCard draw={mmData.mega_millions} featured />
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Info className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-lg font-medium">Mega Millions Results Unavailable</p>
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
              <BarChart3 className="h-6 w-6 text-lottery-gold" />
              <h2 className="text-2xl font-bold tracking-tight">Number Statistics</h2>
            </div>
            <NumberStatsCards
              hotNumbers={hotNumbers}
              coldNumbers={coldNumbers}
              gameName="Mega Millions"
            />
          </section>
        )}

        {/* Past Results */}
        {pastDraws.length > 0 ? (
          <section className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-6 w-6 text-lottery-gold" />
                <h2 className="text-2xl font-bold tracking-tight">Past Mega Millions Results</h2>
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
                  Historical Mega Millions results are temporarily unavailable. Check back soon.
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

export default function MegaMillionsPage() {
  const jsonLd = generateBreadcrumbSchema(
    breadcrumbs.map((b) => ({
      name: b.label,
      url: b.href ? `${siteUrl}${b.href}` : `${siteUrl}/games/mega-millions`,
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
            Mega Millions Results Today
          </h1>
          <p className="text-pretty text-lg text-muted-foreground max-w-2xl">
            Get the latest Mega Millions winning numbers and jackpot information. 
            Results are updated immediately after each drawing.
          </p>
        </section>

        {/* Dynamic Content */}
        <Suspense fallback={<NationalCardSkeleton />}>
          <MegaMillionsContent />
        </Suspense>

        {/* Info Cards */}
        <section className="mb-12 grid gap-6 md:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-lottery-gold/10 to-transparent">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-lottery-gold" />
                <h2 className="font-semibold">How to Play Mega Millions</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
                <p className="text-sm text-muted-foreground">Select 5 white ball numbers from 1 to 70</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</span>
                <p className="text-sm text-muted-foreground">Select 1 gold Mega Ball number from 1 to 25</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</span>
                <p className="text-sm text-muted-foreground">Add Megaplier to multiply non-jackpot prizes</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lottery-gold text-xs font-bold text-lottery-gold-foreground">4</span>
                <p className="text-sm text-muted-foreground">Match all 6 numbers to win the jackpot!</p>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-lottery-gold/10 to-transparent">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-lottery-gold" />
                <h2 className="font-semibold">Drawing Schedule</h2>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Days</p>
                  <p className="text-muted-foreground">Tuesday, Friday</p>
                </div>
                <div>
                  <p className="font-medium">Time</p>
                  <p className="text-muted-foreground">11:00 PM ET</p>
                </div>
                <div>
                  <p className="font-medium">Sales Cut-off</p>
                  <p className="text-muted-foreground">1-2 hours before</p>
                </div>
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">Atlanta, GA</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Play in Your State - Using verified state links */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-lottery-gold" />
            <h2 className="text-xl font-semibold">Play Mega Millions in Your State</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {POPULAR_STATES.map((state) => (
              <Button key={state.slug} asChild variant="outline" size="sm">
                <Link href={buildStateUrl(state.slug)}>{state.name}</Link>
              </Button>
            ))}
            <Button asChild variant="default" size="sm" className="bg-lottery-gold text-lottery-gold-foreground hover:bg-lottery-gold/90">
              <Link href="/states">
                All States
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection items={megaMillionsFAQ} title="Mega Millions FAQ" />

        {/* SEO Content */}
        <section className="mt-12 space-y-8 border-t pt-8">
          <SEOTextBlock
            title="About Mega Millions"
            content={[
              "Mega Millions is one of America's two biggest lottery games, known for creating record-breaking jackpots. The game is played in 45 states, Washington D.C., and the U.S. Virgin Islands.",
              "The current Mega Millions format launched in 2017 with the 5/70 + 1/25 matrix. The largest Mega Millions jackpot ever won was $1.537 billion in October 2018.",
            ]}
          />
        </section>

        {/* Related Links */}
        <section className="mt-8 rounded-xl bg-muted/50 p-6">
          <h2 className="text-lg font-semibold mb-4">More Lottery Results</h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/games/powerball">Powerball Results</Link>
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
