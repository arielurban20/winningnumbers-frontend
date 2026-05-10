import { cn } from "@/lib/utils"

interface ContainerProps {
  children: React.ReactNode
  className?: string
  /** Use narrow max-width for text-heavy content like hero sections */
  narrow?: boolean
  /** Render as a different HTML element (default: div) */
  as?: "div" | "main" | "section" | "article" | "aside" | "header" | "footer"
}

/**
 * Consistent page container with proper desktop centering and responsive padding.
 * - max-w-screen-2xl (1536px) for main content
 * - Responsive horizontal padding
 * - Auto-centered
 */
export function Container({ children, className, narrow = false, as: Component = "div" }: ContainerProps) {
  return (
    <Component
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16",
        narrow ? "max-w-4xl" : "max-w-screen-2xl",
        className
      )}
    >
      {children}
    </Component>
  )
}
