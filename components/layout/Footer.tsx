import Link from "next/link"
import Image from "next/image"
import { POPULAR_STATES, buildStateUrl } from "@/lib/utils/buildLotteryLinks"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/30">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-10 w-10">
                <Image
                  src="/logo.png"
                  alt="Winning Numbers"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>
            <p className="max-w-md text-sm text-muted-foreground leading-relaxed">
              Get the latest lottery results, winning numbers, and statistics for 
              Powerball, Mega Millions, and state lotteries across the United States.
            </p>
          </div>

          {/* National Games */}
          <div className="space-y-4">
            <h3 className="font-semibold">National Games</h3>
            <ul className="space-y-2.5">
              <li>
                <Link
                  href="/games/powerball"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Powerball
                </Link>
              </li>
              <li>
                <Link
                  href="/games/mega-millions"
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Mega Millions
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular States - Using verified slugs */}
          <div className="space-y-4">
            <h3 className="font-semibold">Popular States</h3>
            <ul className="space-y-2.5">
              {POPULAR_STATES.map((state) => (
                <li key={state.slug}>
                  <Link
                    href={buildStateUrl(state.slug)}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {state.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/states"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  View All States
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 rounded-xl border border-border/50 bg-card/50 p-5">
          <p className="text-sm font-medium">Disclaimer</p>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            This website is for informational purposes only. Lottery results shown
            are unofficial. Please verify winning numbers with your official state lottery
            commission before claiming prizes. Play responsibly.
          </p>
        </div>

        {/* Legal Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t pt-8 text-sm">
          <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </Link>
          <Link href="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/cookie-policy" className="text-muted-foreground hover:text-foreground transition-colors">
            Cookie Policy
          </Link>
          <Link href="/disclaimer" className="text-muted-foreground hover:text-foreground transition-colors">
            Disclaimer
          </Link>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>&copy; {currentYear} Winning Numbers. All rights reserved.</p>
          <p>
            Gambling problem? Call{" "}
            <a href="tel:1-800-522-4700" className="font-medium text-foreground underline underline-offset-4 hover:text-primary">
              1-800-522-4700
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
