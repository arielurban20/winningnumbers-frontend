"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

/**
 * ScrollToTop
 *
 * Scrolls to the top of the page only when the route CHANGES (not on the
 * initial mount). This prevents the iOS/Android "scroll creep" bug caused
 * by stale browser-restored scroll positions after navigation, while still
 * allowing the browser to handle the initial page load position normally.
 *
 * Does NOT set history.scrollRestoration — leaving that as the browser
 * default ("auto") so desktop scroll with mouse/trackpad is never blocked.
 */
export function ScrollToTop() {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    // On first mount: record the path, do nothing else.
    if (prevPath.current === null) {
      prevPath.current = pathname
      return
    }

    // Only scroll to top when the pathname actually changes.
    if (prevPath.current !== pathname) {
      prevPath.current = pathname
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior })
      })
    }
  }, [pathname])

  return null
}
