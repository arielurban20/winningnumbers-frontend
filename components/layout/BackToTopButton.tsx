"use client"

import { useState, useEffect } from "react"
import { ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface BackToTopButtonProps {
  /** Scroll threshold in pixels before showing the button */
  threshold?: number
  className?: string
}

/**
 * Back to Top Button
 *
 * Floating action button that appears after scrolling past the threshold.
 * Designed to be clearly visible in both light and dark mode with a vibrant
 * primary-blue background, glow shadow, and smooth fade+slide transition.
 */
export function BackToTopButton({
  threshold = 400,
  className,
}: BackToTopButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > threshold)
    handleScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [threshold])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={cn(
        // Base layout
        "fixed bottom-24 right-4 z-50",
        "flex h-12 w-12 items-center justify-center",
        "rounded-full",
        // Vivid background — visible in both light and dark mode
        "bg-primary text-primary-foreground",
        // Shadow with a color-matched glow
        "shadow-[0_4px_14px_0_rgba(0,0,0,0.25),0_0_0_1px_rgba(255,255,255,0.08)]",
        "dark:shadow-[0_4px_20px_0_rgba(0,80,255,0.35),0_0_0_1px_rgba(255,255,255,0.06)]",
        // Hover state
        "hover:brightness-110 hover:shadow-[0_6px_20px_0_rgba(0,0,0,0.3),0_0_16px_4px_rgba(var(--primary),0.4)]",
        "active:scale-95",
        // Smooth entrance/exit
        "transition-all duration-300 ease-in-out",
        isVisible
          ? "translate-y-0 opacity-100 pointer-events-auto"
          : "translate-y-6 opacity-0 pointer-events-none",
        className
      )}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  )
}
