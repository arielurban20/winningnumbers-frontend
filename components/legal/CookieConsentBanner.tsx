"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Cookie, X } from "lucide-react"
import { cn } from "@/lib/utils"

const COOKIE_CONSENT_KEY = "cookie-consent"
const COOKIE_CONSENT_VERSION = "1"

type ConsentState = "pending" | "accepted" | "rejected"

interface CookieConsent {
  state: ConsentState
  version: string
  timestamp: number
}

/**
 * Cookie Consent Banner
 * 
 * Shows a non-intrusive banner on first visit asking for cookie consent.
 * Stores consent in localStorage.
 * 
 * Features:
 * - Accept All / Reject Non-Essential options
 * - Link to cookie policy
 * - Dark/light mode support
 * - Mobile responsive
 * - Does not block the entire site
 */
export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    
    if (stored) {
      try {
        const consent: CookieConsent = JSON.parse(stored)
        // If consent version matches and state is not pending, don't show banner
        if (consent.version === COOKIE_CONSENT_VERSION && consent.state !== "pending") {
          return
        }
      } catch {
        // Invalid stored data, show banner
      }
    }

    // Small delay before showing banner for better UX
    const timer = setTimeout(() => {
      setIsAnimating(true)
      setIsVisible(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [])

  const handleConsent = (state: ConsentState) => {
    const consent: CookieConsent = {
      state,
      version: COOKIE_CONSENT_VERSION,
      timestamp: Date.now(),
    }
    
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consent))
    
    // Animate out
    setIsAnimating(false)
    setTimeout(() => setIsVisible(false), 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 p-4 transition-all duration-300",
        isAnimating 
          ? "translate-y-0 opacity-100" 
          : "translate-y-full opacity-0"
      )}
    >
      <Card className="mx-auto max-w-4xl border-border/50 bg-card/95 p-4 shadow-2xl backdrop-blur-lg sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          {/* Icon */}
          <div className="hidden shrink-0 sm:block">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold">Cookie Preferences</h3>
              <button
                onClick={() => handleConsent("rejected")}
                className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground sm:hidden"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground">
              We use essential cookies to remember your preferences like theme settings.
              By clicking &quot;Accept All&quot;, you consent to our use of cookies. 
              Learn more in our{" "}
              <Link 
                href="/cookie-policy" 
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Cookie Policy
              </Link>
              .
            </p>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConsent("rejected")}
              className="order-2 sm:order-1"
            >
              Reject Non-Essential
            </Button>
            <Button
              size="sm"
              onClick={() => handleConsent("accepted")}
              className="order-1 sm:order-2"
            >
              Accept All
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

/**
 * Hook to check if user has given cookie consent
 */
export function useCookieConsent(): ConsentState | null {
  const [consent, setConsent] = useState<ConsentState | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (stored) {
      try {
        const data: CookieConsent = JSON.parse(stored)
        setConsent(data.state)
      } catch {
        setConsent(null)
      }
    }
  }, [])

  return consent
}
