import type { Metadata } from "next"
import Link from "next/link"
import { Container, Breadcrumbs } from "@/components/layout"
import { JsonLd } from "@/components/seo"
import { generateBreadcrumbSchema, generateItemListSchema } from "@/lib/seo/jsonLd"
import { getCanonicalUrl } from "@/lib/seo/metadata"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GameLogo } from "@/components/cards/GameLogo"
import { Trophy, Sparkles, ArrowRight, MapPin, DollarSign, Calendar } from "lucide-react"

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

export const metadata: Metadata = {
  title: "All Lottery Games | Powerball, Mega Millions & State Lotteries",
  description: "Browse lottery games available across the United States including Powerball, Mega Millions, Pick 3, Pick 4, Cash 5, and state-specific games.",
  alternates: {
    canonical: getCanonicalUrl("/games"),
  },
  openGraph: {
    title: "All Lottery Games | Powerball, Mega Millions & State Lotteries",
    description: "Browse lottery games available across the United States including Powerball, Mega Millions, and state-specific games.",
    url: getCanonicalUrl("/games"),
    type: "website",
  },
}

const nationalGames = [
  {
    name: "Powerball",
    slug: "powerball",
    description: "America's favorite lottery with massive jackpots starting at $20 million.",
    href: "/games/powerball",
    jackpotStart: "$20 Million",
    drawDays: "Mon, Wed, Sat",
    states: "45 states + DC, PR, USVI",
  },
  {
    name: "Mega Millions",
    slug: "mega-millions",
    description: "One of the world's biggest lotteries with jackpots that can reach over $1 billion.",
    href: "/games/mega-millions",
    jackpotStart: "$20 Million",
    drawDays: "Tue, Fri",
    states: "45 states + DC, USVI",
  },
]

const gameTypes = [
  {
    name: "Pick 3",
    aliases: ["Play 3", "Daily 3", "Cash 3", "Numbers"],
    description: "Match 3 numbers for daily prizes. Multiple play types available.",
    icon: "P3",
  },
  {
    name: "Pick 4",
    aliases: ["Play 4", "Daily 4", "Cash 4", "Win 4"],
    description: "Match 4 numbers for bigger daily prizes. Various play options.",
    icon: "P4",
  },
  {
    name: "Cash 5",
    aliases: ["Fantasy 5", "Take 5", "Match 5", "Rolling Cash 5"],
    description: "Pick 5 numbers from a smaller pool for better odds.",
    icon: "C5",
  },
  {
    name: "Lotto",
    aliases: ["Classic Lotto", "Lotto Texas", "SuperLotto Plus"],
    description: "Traditional lotto format with state-specific variations.",
    icon: "L",
  },
]

export default function GamesPage() {
  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Games", href: "/games" },
  ]

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: siteUrl },
    { name: "Games", url: getCanonicalUrl("/games") },
  ])

  const itemListSchema = generateItemListSchema(
    "Lottery Games in the United States",
    [
      { name: "Powerball", url: getCanonicalUrl("/games/powerball") },
      { name: "Mega Millions", url: getCanonicalUrl("/games/mega-millions") },
    ]
  )

  return (
    <>
      <JsonLd data={[breadcrumbSchema, itemListSchema]} />
      <Container className="py-8">
        <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Lottery Games
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Browse lottery games available across the United States. From national 
            jackpot games to daily number draws, find results and information for 
            all major lottery games.
          </p>
        </div>

        {/* National Games Section */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">National Games</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Multi-state jackpot games with the biggest prizes in the country.
          </p>
          
          <div className="grid gap-6 md:grid-cols-2">
            {nationalGames.map((game) => (
              <Card key={game.slug} className="group border-border/50 hover:border-primary/30 hover:shadow-lg transition-all">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <GameLogo
                        gameName={game.name}
                        gameSlug={game.slug}
                        isMultistate={true}
                        size="lg"
                      />
                      <div>
                        <CardTitle className="text-xl">{game.name}</CardTitle>
                        <CardDescription className="mt-1">{game.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-lottery-green" />
                      <div>
                        <p className="text-muted-foreground">Jackpot Starts</p>
                        <p className="font-semibold">{game.jackpotStart}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-muted-foreground">Draw Days</p>
                        <p className="font-semibold">{game.drawDays}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-muted-foreground">Available In</p>
                        <p className="font-semibold">{game.states}</p>
                      </div>
                    </div>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={game.href}>
                      View Latest Results
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Game Types Section */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight">Popular Game Types</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Common lottery game formats available in most states. Select your state to 
            find the specific games and results.
          </p>
          
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {gameTypes.map((game) => (
              <Card key={game.name} className="border-border/50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lottery-green/10 text-lottery-green font-bold">
                      {game.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{game.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{game.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {game.aliases.slice(0, 2).map((alias) => (
                          <Badge key={alias} variant="outline" className="text-xs">
                            {alias}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-muted-foreground mb-4">
              Game availability varies by state. Find games in your state:
            </p>
            <Button asChild>
              <Link href="/states">
                Browse by State
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Info Section */}
        <section className="rounded-xl border bg-muted/30 p-8">
          <h2 className="text-xl font-bold mb-4">About Lottery Games</h2>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground">
              Each state operates its own lottery with unique games, draw schedules, and 
              prize structures. National games like Powerball and Mega Millions are 
              available across most states and offer the largest jackpots.
            </p>
            <p className="text-muted-foreground mt-4">
              Daily games like Pick 3 and Pick 4 offer more frequent drawings with better 
              odds, while weekly games typically feature larger prizes. Use our state 
              pages to find specific game information, drawing schedules, and past results.
            </p>
          </div>
        </section>
      </div>
      </Container>
    </>
  )
}
