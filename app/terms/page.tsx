import type { Metadata } from "next"
import Link from "next/link"
import { Container, Breadcrumbs } from "@/components/layout"
import { JsonLd } from "@/components/seo"
import { getCanonicalUrl } from "@/lib/seo/metadata"
import { generateWebPageSchema } from "@/lib/seo/jsonLd"
import { Card, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"

const PAGE_TITLE = "Terms of Service | Winning Numbers"
const PAGE_DESCRIPTION =
  "Terms of Service for Winning Numbers. Review the terms and conditions for using our lottery results website."
const PAGE_URL = getCanonicalUrl("/terms")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
}

export default function TermsPage() {
  const webPageSchema = generateWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_URL)

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Terms of Service", href: "/terms" },
  ]

  const lastUpdated = "April 2026"

  return (
    <Container className="py-8">
      <JsonLd data={webPageSchema} />
      <Breadcrumbs items={breadcrumbItems} />

      <div className="mt-8 max-w-4xl">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Terms of Service
              </h1>
              <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Winning Numbers (winningnumbers.us), you accept and agree 
              to be bound by these Terms of Service. If you do not agree to these terms, 
              please do not use our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Winning Numbers is an informational website that provides lottery results, 
              number statistics, and related information. We aggregate and display lottery 
              results from official state lottery sources for informational purposes only.
            </p>
            <Card className="not-prose mt-4 border-amber-500/30 bg-amber-500/5">
              <CardContent className="pt-6">
                <p className="text-muted-foreground font-medium">
                  Important: We do not sell lottery tickets. We are not a lottery operator, 
                  retailer, or official lottery organization.
                </p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="text-xl font-bold">3. Acceptable Use</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to use the website only for lawful purposes. You may not:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>Scrape, crawl, or use automated means to extract data without permission</li>
              <li>Copy, reproduce, or redistribute our content without authorization</li>
              <li>Use the website to distribute malware or engage in harmful activities</li>
              <li>Attempt to interfere with the website&apos;s operation</li>
              <li>Impersonate any person or entity</li>
              <li>Use the website for any commercial purpose without our consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">4. Informational Use Only</h2>
            <p className="text-muted-foreground leading-relaxed">
              All lottery results, statistics, and information provided on this website are 
              for informational purposes only. You should always verify winning numbers with 
              your official state lottery before claiming any prizes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">5. No Guarantee of Accuracy</h2>
            <p className="text-muted-foreground leading-relaxed">
              While we strive to provide accurate and up-to-date information, we do not 
              guarantee the accuracy, completeness, or timeliness of any information on 
              this website. Lottery results should always be verified with official sources.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">6. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The website design, layout, text content, graphics, and organization are 
              protected by copyright and other intellectual property laws. You may not 
              copy, modify, distribute, or republish any content from this website without 
              our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">7. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the fullest extent permitted by law, Winning Numbers shall not be liable 
              for any indirect, incidental, special, consequential, or punitive damages 
              arising out of your use of the website or reliance on any information provided.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">8. Responsible Gaming</h2>
            <p className="text-muted-foreground leading-relaxed">
              Lottery games should be played responsibly. If you or someone you know has 
              a gambling problem, please contact the National Problem Gambling Helpline at{" "}
              <a href="tel:1-800-522-4700" className="text-primary underline underline-offset-4">
                1-800-522-4700
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">9. Age Restrictions</h2>
            <p className="text-muted-foreground leading-relaxed">
              Lottery games have age restrictions that vary by state. This website is 
              intended for informational purposes for adults of legal lottery playing 
              age in their jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes 
              will be effective immediately upon posting to this page. Your continued use 
              of the website after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">11. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, please visit our{" "}
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
