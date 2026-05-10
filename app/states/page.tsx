import { Suspense } from "react"
import Link from "next/link"
import { getStates } from "@/lib/api/states"
import { StateSearchGrid } from "@/components/states/StateSearchGrid"
import { JsonLd } from "@/components/seo"
import { SEOTextBlock, Breadcrumbs, Container } from "@/components/layout"
import { CardSkeleton } from "@/components/feedback"
import { generateStatesMetadata, getCanonicalUrl } from "@/lib/seo/metadata"
import { generateItemListSchema, generateBreadcrumbSchema } from "@/lib/seo/jsonLd"
import { Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = generateStatesMetadata()

async function StatesGrid() {
  const states = await getStates({ includeTodayResults: true })
  return <StateSearchGrid states={states} />
}

export default async function StatesPage() {
  const states = await getStates({ includeTodayResults: true })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "States", url: getCanonicalUrl("/states") },
  ])

  const itemListSchema = generateItemListSchema(
    "US States with Lottery Games",
    states.map((state) => ({
      name: state.name,
      url: getCanonicalUrl(`/states/${state.slug}`),
    }))
  )

  return (
    <>
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />

      {/* Hero Section - Compact on mobile */}
      <section className="border-b bg-gradient-to-b from-muted/50 to-background">
        <Container className="py-8 sm:py-12">
          <Breadcrumbs items={[{ label: "States" }]} />
          
          <div className="mt-4 sm:mt-6 flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/10">
              <Globe className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Lottery Results by State
              </h1>
              <p className="mt-1.5 sm:mt-2 text-sm sm:text-lg text-muted-foreground max-w-2xl">
                Select your state to view lottery results, winning numbers, past draws, and statistics for all available games.
              </p>
            </div>
          </div>

          {/* Quick Stats - Compact pills on mobile */}
          <div className="mt-5 sm:mt-8 flex flex-wrap gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-card border px-3 py-1.5 sm:px-4 sm:py-2">
              <span className="text-lg sm:text-2xl font-bold text-primary">{states.length}</span>
              <span className="text-xs sm:text-sm text-muted-foreground">States</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-card border px-3 py-1.5 sm:px-4 sm:py-2">
              <span className="text-lg sm:text-2xl font-bold text-lottery-green">100+</span>
              <span className="text-xs sm:text-sm text-muted-foreground">Games</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full bg-card border px-3 py-1.5 sm:px-4 sm:py-2">
              <span className="text-lg sm:text-2xl font-bold text-lottery-gold">Daily</span>
              <span className="text-xs sm:text-sm text-muted-foreground">Updates</span>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-8 sm:py-12">
        {/* States Grid with Search */}
        <Suspense
          fallback={
            <div className="space-y-4 sm:space-y-6">
              <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-muted" />
              <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {[...Array(12)].map((_, i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          }
        >
          <StatesGrid />
        </Suspense>

        {/* National Games CTA */}
        <section className="mt-12 sm:mt-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold">National Lottery Games</h2>
              <p className="mt-1 text-sm sm:text-base text-muted-foreground">Check the biggest jackpots in America</p>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <Button asChild size="sm" className="sm:h-10 sm:px-4">
                <Link href="/games/powerball">Powerball Results</Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="sm:h-10 sm:px-4">
                <Link href="/games/mega-millions">Mega Millions Results</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* SEO Content */}
        <section className="mt-12 sm:mt-16 space-y-6 sm:space-y-8 border-t pt-8 sm:pt-12">
          <SEOTextBlock
            title="State Lottery Information"
            content={[
              "Each US state operates its own lottery system with unique games and drawing schedules. Popular games include Pick 3, Pick 4, Cash 5, and state-specific jackpot games.",
              "Select your state above to view all available lottery games, latest winning numbers, past draws, and number frequency statistics.",
            ]}
          />

          <SEOTextBlock
            title="National vs State Lotteries"
            content={[
              "While Powerball and Mega Millions are available in most states, each state also offers its own unique lottery games. State games typically have better odds and more frequent drawings.",
              "Some states also participate in regional multi-state games. Check your state page for complete game availability.",
            ]}
          />
        </section>
      </Container>
    </>
  )
}
