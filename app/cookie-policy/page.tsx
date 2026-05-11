import type { Metadata } from "next"
import Link from "next/link"
import { Container, Breadcrumbs } from "@/components/layout"
import { JsonLd } from "@/components/seo"
import { getCanonicalUrl } from "@/lib/seo/metadata"
import { generateWebPageSchema } from "@/lib/seo/jsonLd"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Cookie, CheckCircle2 } from "lucide-react"

const PAGE_TITLE = "Cookie Policy"
const PAGE_DESCRIPTION =
  "Cookie Policy for Winning Numbers. Learn about the cookies and local storage we use on our lottery results website."
const PAGE_URL = getCanonicalUrl("/cookie-policy")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
}

const cookieTypes = [
  {
    name: "Theme Preference",
    purpose: "Remembers your dark/light mode preference",
    type: "Local Storage",
    duration: "Persistent",
    essential: true,
  },
  {
    name: "Cookie Consent",
    purpose: "Stores your cookie consent choice",
    type: "Local Storage",
    duration: "Persistent",
    essential: true,
  },
]

export default function CookiePolicyPage() {
  const webPageSchema = generateWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_URL)

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Cookie Policy", href: "/cookie-policy" },
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
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Cookie Policy
              </h1>
              <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold">What Are Cookies?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cookies are small text files that are stored on your device when you visit 
              a website. They are widely used to make websites work efficiently and provide 
              information to website owners. We also use browser local storage, which works 
              similarly to cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">How We Use Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and local storage for essential website functionality. Currently, 
              we only use essential storage that is necessary for the website to function properly.
            </p>
          </section>

          <section className="not-prose">
            <h2 className="text-xl font-bold mb-6">Cookies We Use</h2>
            <div className="space-y-4">
              {cookieTypes.map((cookie) => (
                <Card key={cookie.name} className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{cookie.name}</h3>
                      {cookie.essential && (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Essential
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Purpose:</dt>
                        <dd>{cookie.purpose}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Type:</dt>
                        <dd>{cookie.type}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Duration:</dt>
                        <dd>{cookie.duration}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold">Essential vs Non-Essential Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Essential cookies</strong> are necessary 
              for the website to function properly. These cannot be disabled without affecting 
              website functionality.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Currently, we do not use any non-essential cookies such as analytics or 
              marketing cookies. If this changes in the future, we will update this policy 
              and provide options to manage your preferences.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Managing Cookies</h2>
            <p className="text-muted-foreground leading-relaxed">
              You can manage cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="text-muted-foreground space-y-2">
              <li>View what cookies are stored and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block all cookies from specific sites</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Please note that blocking essential cookies may affect website functionality.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Cookie Consent</h2>
            <p className="text-muted-foreground leading-relaxed">
              When you first visit our website, you will see a cookie consent banner. You can 
              choose to accept all cookies or reject non-essential cookies. Your choice is 
              stored in local storage so we remember your preference.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Cookie Policy from time to time. Any changes will be posted 
              on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have questions about our use of cookies, please visit our{" "}
              <Link href="/contact" className="text-primary underline underline-offset-4">
                Contact page
              </Link>{" "}
              or review our{" "}
              <Link href="/privacy-policy" className="text-primary underline underline-offset-4">
                Privacy Policy
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </Container>
  )
}
