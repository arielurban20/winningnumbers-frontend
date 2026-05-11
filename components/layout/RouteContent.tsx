"use client"

import { usePathname } from "next/navigation"

interface RouteContentProps {
  children: React.ReactNode
}

/**
 * Forces a fresh page-content mount per pathname.
 * This prevents stale client state from persisting when users navigate
 * with browser back/forward across dynamic state/game/session routes.
 */
export function RouteContent({ children }: RouteContentProps) {
  const pathname = usePathname()

  return (
    <main key={pathname} className="flex-1">
      {children}
    </main>
  )
}

