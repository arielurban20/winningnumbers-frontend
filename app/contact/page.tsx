import type { Metadata } from "next"
import Link from "next/link"
import { Container, Breadcrumbs } from "@/components/layout"
import { JsonLd } from "@/components/seo"
import { getCanonicalUrl } from "@/lib/seo/metadata"
import { generateWebPageSchema } from "@/lib/seo/jsonLd"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Mail, HelpCircle, FileText, Shield } from "lucide-react"

const PAGE_TITLE = "Contact Us"
const PAGE_DESCRIPTION =
  "Contact Winning Numbers for questions, feedback, or inquiries about our lottery results website."
const PAGE_URL = getCanonicalUrl("/contact")

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
}

const helpLinks = [
  {
    icon: HelpCircle,
    title: "Frequently Asked Questions",
    description: "Find answers to common questions about using our website.",
    href: "/#faq",
  },
  {
    icon: FileText,
    title: "Terms of Service",
    description: "Review our terms and conditions for using this website.",
    href: "/terms",
  },
  {
    icon: Shield,
    title: "Privacy Policy",
    description: "Learn how we handle your information and privacy.",
    href: "/privacy-policy",
  },
]

export default function ContactPage() {
  const webPageSchema = generateWebPageSchema(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_URL)

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Contact", href: "/contact" },
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
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Contact Us
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Have questions or feedback? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-bold mb-4">Get in Touch</h2>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Email</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        For general inquiries, feedback, or support questions, please 
                        reach out to us at:
                      </p>
                      <a 
                        href="mailto:contact@winningnumbers.us" 
                        className="text-primary font-medium mt-2 inline-block hover:underline"
                      >
                        contact@winningnumbers.us
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Response Time</h2>
              <p className="text-muted-foreground">
                We aim to respond to all inquiries within 1-2 business days. For faster 
                assistance, please check our FAQ section first as it may already have the 
                answer to your question.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Important Notes</h2>
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardContent className="pt-6">
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <span className="text-amber-500 font-bold">1.</span>
                      <span>
                        We cannot provide lottery results over email. Please use our 
                        website to check results.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-500 font-bold">2.</span>
                      <span>
                        We do not sell lottery tickets. For ticket purchases, visit 
                        an authorized retailer.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-amber-500 font-bold">3.</span>
                      <span>
                        For prize claims or official lottery questions, contact your 
                        state lottery commission directly.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </section>
          </div>

          {/* Help Resources */}
          <div>
            <h2 className="text-xl font-bold mb-4">Helpful Resources</h2>
            <div className="space-y-4">
              {helpLinks.map((link) => (
                <Link key={link.href} href={link.href} className="block">
                  <Card className="transition-all hover:border-primary/30 hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <link.icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold">{link.title}</h3>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{link.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold mb-4">For Copyright Inquiries</h2>
              <p className="text-muted-foreground text-sm">
                For questions about content usage, permissions, or copyright matters, 
                please review our{" "}
                <Link href="/terms" className="text-primary underline underline-offset-4">
                  Terms of Service
                </Link>{" "}
                first, then contact us by email with your specific inquiry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}
