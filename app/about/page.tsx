import type { Metadata } from "next"
import Link from "next/link"
import { Container, Breadcrumbs } from "@/components/layout"
import { JsonLd } from "@/components/seo"
import { getCanonicalUrl } from "@/lib/seo/metadata"
import { generateWebPageSchema } from "@/lib/seo/jsonLd"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Info, Target, Shield, Users, ArrowRight } from "lucide-react"

const PAGE_TITLE = "About Us"
const PAGE_DESCRIPTION =
  "Learn about Winning Numbers - your trusted source for lottery results across the United States including Powerball, Mega Millions, and state lotteries."
const PAGE_URL = getCanonicalUrl("/about")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
}

const features = [
  {
    icon: Target,
    title: "Accurate Results",
    description: "We source our data from official state lottery commissions to ensure accuracy.",
  },
  {
    icon: Shield,
    title: "Verified Information",
    description: "All results are cross-referenced with official sources before publication.",
  },
  {
    icon: Users,
    title: "User-Focused",
    description: "Our platform is designed to help you quickly find and verify your numbers.",
  },
]

export default function AboutPage() {
  const webPageSchema = generateWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_URL)

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
  ]

  return (
    <Container className="py-8">
      <JsonLd data={webPageSchema} />
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-8 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Info className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              About Winning Numbers
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Your trusted source for lottery results across the United States.
          </p>
        </div>

        {/* Main Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold tracking-tight">What We Do</h2>
            <p className="text-muted-foreground leading-relaxed">
              Winning Numbers is an informational website dedicated to providing the latest 
              lottery results from across the United States. We cover national games like 
              Powerball and Mega Millions, as well as state-specific games including Pick 3, 
              Pick 4, Cash 5, Fantasy 5, and many more.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our platform allows you to check the latest winning numbers, view past drawing 
              results, analyze number frequency statistics, and find information about lottery 
              games in your state.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight">Our Mission</h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to make lottery result checking simple, fast, and reliable. Our 
              results are updated immediately after each official drawing, ensuring you 
              have access to the most current winning numbers.
            </p>
          </section>

          {/* Features Grid */}
          <section className="not-prose">
            <h2 className="text-2xl font-bold tracking-tight mb-6">Why Choose Us</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature) => (
                <Card key={feature.title} className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-2">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold tracking-tight">Important Notice</h2>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">We do not sell lottery tickets.</strong> Winning Numbers 
                  is strictly an informational website. We are not affiliated with, endorsed by, 
                  or connected to any official state lottery commission or lottery operator.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  Always verify your winning numbers with your official state lottery retailer 
                  or state lottery website before claiming any prizes. Results shown on this 
                  website are for informational purposes only.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="not-prose">
            <h2 className="text-2xl font-bold tracking-tight mb-4">Explore</h2>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/states">
                  Browse All States
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/games/powerball">Powerball Results</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/games/mega-millions">Mega Millions Results</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </Container>
  )
}
