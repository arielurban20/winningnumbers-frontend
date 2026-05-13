"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

const REFRESH_AFTER_MS = 2 * 60 * 1000
const REFRESH_DEBOUNCE_MS = 1200
const REFRESH_UNLOCK_MS = 1000

function getLocalDateKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Keeps lottery data fresh when users return to an already-open tab/app.
 * Handles visibility/focus/pageshow/online and only refreshes when stale.
 */
export function FreshnessRefresh() {
  const router = useRouter()
  const lastRefreshAtRef = useRef<number>(Date.now())
  const lastTriggerAtRef = useRef<number>(0)
  const isRefreshingRef = useRef<boolean>(false)
  const lastDateKeyRef = useRef<string>(getLocalDateKey())
  const debounceTimerRef = useRef<number | null>(null)

  useEffect(() => {
    const maybeRefresh = (force = false) => {
      const now = Date.now()
      const currentDateKey = getLocalDateKey()
      const localDateChanged = currentDateKey !== lastDateKeyRef.current
      const isStale = now - lastRefreshAtRef.current >= REFRESH_AFTER_MS

      if (!force && !localDateChanged && !isStale) {
        return
      }

      if (isRefreshingRef.current) {
        return
      }

      if (now - lastTriggerAtRef.current < REFRESH_DEBOUNCE_MS) {
        return
      }

      lastTriggerAtRef.current = now
      lastRefreshAtRef.current = now
      lastDateKeyRef.current = currentDateKey
      isRefreshingRef.current = true
      router.refresh()

      window.setTimeout(() => {
        isRefreshingRef.current = false
      }, REFRESH_UNLOCK_MS)
    }

    const scheduleRefresh = (force = false) => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = window.setTimeout(() => {
        debounceTimerRef.current = null
        maybeRefresh(force)
      }, 150)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleRefresh(false)
      }
    }

    const onFocus = () => {
      scheduleRefresh(false)
    }

    const onOnline = () => {
      scheduleRefresh(false)
    }

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        scheduleRefresh(true)
        return
      }

      scheduleRefresh(false)
    }

    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("focus", onFocus)
    window.addEventListener("online", onOnline)
    window.addEventListener("pageshow", onPageShow)

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("online", onOnline)
      window.removeEventListener("pageshow", onPageShow)

      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current)
      }
    }
  }, [router])

  return null
}
