import type { Metadata } from "next"
import Link from "next/link"
import { Container, Breadcrumbs } from "@/components/layout"
import { JsonLd } from "@/components/seo"
import { getCanonicalUrl } from "@/lib/seo/metadata"
import { generateWebPageSchema } from "@/lib/seo/jsonLd"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, Shield, Phone } from "lucide-react"

const PAGE_TITLE = "Disclaimer"
const PAGE_DESCRIPTION =
  "Important disclaimer for Winning Numbers. Understand the limitations and intended use of our lottery results website."
const PAGE_URL = getCanonicalUrl("/disclaimer")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
}

export default function DisclaimerPage() {
  const webPageSchema = generateWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_URL)

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Disclaimer", href: "/disclaimer" },
  ]

  return (
    <Container className="py-8">
      <JsonLd data={webPageSchema} />
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-8 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Disclaimer
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Important information about using Winning Numbers.
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <Card className="not-prose border-amber-500/30 bg-amber-500/5">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-bold">Informational Purposes Only</h2>
                  <p className="text-muted-foreground mt-2">
                    All lottery results, winning numbers, jackpot amounts, and related 
                    information displayed on this website are provided for informational 
                    purposes only. This information should not be relied upon as the sole 
                    source for any financial decisions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <section>
            <h2 className="text-xl font-bold">Verify Your Numbers</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Always verify winning numbers with official sources.</strong>{" "}
              Before claiming any prize, you must verify your numbers with:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>Your official state lottery website</li>
              <li>An authorized lottery retailer</li>
              <li>Your state lottery commission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">No Ticket Sales</h2>
            <p className="text-muted-foreground leading-relaxed">
              Winning Numbers does not sell lottery tickets. We are not a lottery operator, 
              retailer, or authorized ticket seller. To purchase lottery tickets, please 
              visit an authorized retailer in your state.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">No Official Affiliation</h2>
            <p className="text-muted-foreground leading-relaxed">
              Winning Numbers is not affiliated with, endorsed by, or connected to any 
              official state lottery commission, Powerball, Mega Millions, or any lottery 
              organization. We are an independent informational website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Accuracy Not Guaranteed</h2>
            <p className="text-muted-foreground leading-relaxed">
              While we make every effort to provide accurate and timely information, we 
              cannot guarantee the accuracy, completeness, or timeliness of lottery results 
              or any other information on this website. Errors may occur during data 
              transmission or processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">State Rules Apply</h2>
            <p className="text-muted-foreground leading-relaxed">
              Lottery games are subject to the rules and regulations of each state. 
              Prize claim deadlines, age restrictions, and game rules vary by state. 
              Check your state lottery for specific rules.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Age Restrictions</h2>
            <p className="text-muted-foreground leading-relaxed">
              You must be of legal age to play the lottery in your state. Most states 
              require players to be at least 18 years old, though some states have 
              different age requirements. It is your responsibility to ensure you meet 
              the legal age requirement.
            </p>
          </section>

          <section className="not-prose">
            <h2 className="text-xl font-bold mb-4">Play Responsibly</h2>
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Shield className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-muted-foreground">
                      Lottery games should be played for entertainment. Only spend what 
                      you can afford to lose. If you or someone you know has a gambling 
                      problem, help is available.
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-primary">
                      <Phone className="h-4 w-4" />
                      <a href="tel:1-800-522-4700" className="font-semibold hover:underline">
                        1-800-522-4700
                      </a>
                      <span className="text-muted-foreground text-sm">
                        (National Problem Gambling Helpline - Available 24/7)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-xl font-bold">Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              Winning Numbers shall not be liable for any damages arising from the use of 
              this website or reliance on any information provided. Use of this website 
              is at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Questions?</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about this disclaimer, please visit our{" "}
              <Link href="/contact" className="text-primary underline underline-offset-4">
                Contact page
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </Container>
  )
}
