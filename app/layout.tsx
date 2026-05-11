import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import { BackToTopButton } from "@/components/layout/BackToTopButton"
import { ScrollToTop } from "@/components/layout/ScrollToTop"
import { RouteContent } from "@/components/layout/RouteContent"
import { CookieConsentBanner } from "@/components/legal"
import "./globals.css"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://winningnumbers.us"

export const metadata: Metadata = {
  title: {
    default: "Winning Numbers | Latest Lottery Results Today",
    template: "%s | Winning Numbers",
  },
  description:
    "Get the latest lottery results including Powerball, Mega Millions, and state lotteries. View winning numbers, past draws, and number frequency statistics.",
  keywords: [
    "lottery results",
    "winning numbers",
    "Powerball",
    "Mega Millions",
    "state lottery",
    "lottery numbers",
    "US lottery",
  ],
  authors: [{ name: "Winning Numbers" }],
  creator: "Winning Numbers",
  metadataBase: new URL(siteUrl),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/android-icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-icon-57x57.png", sizes: "57x57" },
      { url: "/apple-icon-60x60.png", sizes: "60x60" },
      { url: "/apple-icon-72x72.png", sizes: "72x72" },
      { url: "/apple-icon-76x76.png", sizes: "76x76" },
      { url: "/apple-icon-114x114.png", sizes: "114x114" },
      { url: "/apple-icon-120x120.png", sizes: "120x120" },
      { url: "/apple-icon-144x144.png", sizes: "144x144" },
      { url: "/apple-icon-152x152.png", sizes: "152x152" },
      { url: "/apple-icon-180x180.png", sizes: "180x180" },
    ],
    other: [
      { rel: "manifest", url: "/manifest.json" },
    ],
  },
  other: {
    "msapplication-TileColor": "#ffffff",
    "msapplication-TileImage": "/ms-icon-144x144.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Winning Numbers",
    title: "Winning Numbers | Latest Lottery Results Today",
    description:
      "Get the latest lottery results including Powerball, Mega Millions, and state lotteries.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Winning Numbers | Latest Lottery Results Today",
    description:
      "Get the latest lottery results including Powerball, Mega Millions, and state lotteries.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable} bg-background`} style={{ scrollBehavior: "auto" }} suppressHydrationWarning>
      <head>
        {/* Minimal critical CSS — only what globals.css cannot handle before paint.
            Removed height/min-height from html and body to fix the iOS/Android
            "scroll creep" bug where the browser miscalculates the initial scroll
            offset when those values conflict with -webkit-fill-available. */}
        <style suppressHydrationWarning>
          {`
            html, body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
              background-color: oklch(0.985 0.002 240);
              color: oklch(0.145 0.02 260);
            }
            /* Force scroll-behavior: auto to prevent Next.js navigation issues.
               Tailwind v4 preflight may set scroll-behavior: smooth on html,
               which breaks SPA route transitions in Next.js App Router. */
            html { scroll-behavior: auto !important; }
            html.dark, html.dark body {
              background-color: oklch(0.12 0.015 260);
              color: oklch(0.95 0.01 250);
            }
            body {
              display: flex;
              flex-direction: column;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
            }
            a { color: inherit; text-decoration: none; }
          `}
        </style>
      </head>
      <body className="font-sans antialiased flex flex-col bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ScrollToTop />
          <Header />
          <RouteContent>{children}</RouteContent>
          <Footer />
          <BackToTopButton />
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  )
}
