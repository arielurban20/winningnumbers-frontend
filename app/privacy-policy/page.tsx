import type { Metadata } from "next"
import Link from "next/link"
import { Container, Breadcrumbs } from "@/components/layout"
import { JsonLd } from "@/components/seo"
import { getCanonicalUrl } from "@/lib/seo/metadata"
import { generateWebPageSchema } from "@/lib/seo/jsonLd"
import { Card, CardContent } from "@/components/ui/card"
import { Shield } from "lucide-react"

const PAGE_TITLE = "Privacy Policy"
const PAGE_DESCRIPTION =
  "Privacy Policy for Winning Numbers. Learn how we collect, use, and protect your information when using our lottery results website."
const PAGE_URL = getCanonicalUrl("/privacy-policy")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
}

export default function PrivacyPolicyPage() {
  const webPageSchema = generateWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_URL)

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Privacy Policy", href: "/privacy-policy" },
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
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Privacy Policy
              </h1>
              <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold">Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Winning Numbers (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the website winningnumbers.us. 
              This page informs you of our policies regarding the collection, use, and disclosure 
              of personal information when you use our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Information We Collect</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect minimal information necessary to provide our services:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Usage Data:</strong> We may collect information 
                about how you access and use the website, including your browser type, pages visited, 
                and time spent on pages.
              </li>
              <li>
                <strong className="text-foreground">Local Storage:</strong> We use browser local 
                storage to remember your preferences such as theme settings (dark/light mode) and 
                cookie consent choices.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">How We Use Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              The information we collect is used to:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>Provide and maintain our website</li>
              <li>Remember your preferences (theme, cookie consent)</li>
              <li>Analyze usage patterns to improve our services</li>
              <li>Monitor and prevent technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">Cookies and Local Storage</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and browser local storage for essential website functionality:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>
                <strong className="text-foreground">Essential Storage:</strong> Theme preferences 
                (dark/light mode), cookie consent status.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              For more information, please see our{" "}
              <Link href="/cookie-policy" className="text-primary underline underline-offset-4">
                Cookie Policy
              </Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Third-Party Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may use third-party services that collect information used to identify you. 
              These services have their own privacy policies governing the use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We value your trust and strive to use commercially acceptable means of protecting 
              any information. However, no method of transmission over the internet is 100% secure, 
              and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed">
              You have the right to:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>Clear your local storage/cookies at any time through your browser settings</li>
              <li>Opt out of non-essential cookies via our cookie consent banner</li>
              <li>Contact us with questions about your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our website is not directed to individuals under the age of 18. We do not knowingly 
              collect personal information from children. If you are a parent or guardian and believe 
              your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes 
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Contact Us</h2>
            <Card className="not-prose">
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy, please visit our{" "}
                  <Link href="/contact" className="text-primary underline underline-offset-4">
                    Contact page
                  </Link>.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </Container>
  )
}
