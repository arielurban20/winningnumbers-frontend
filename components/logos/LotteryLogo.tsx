"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { resolveLotteryLogo } from "@/lib/logos"
import type { LogoSize } from "@/types/logos"

interface LotteryLogoProps {
  gameName: string
  gameSlug?: string
  stateName?: string
  stateSlug?: string
  logoUrl?: string
  size?: LogoSize
  priority?: boolean
  className?: string
}

const SIZE_MAP: Record<LogoSize, { container: string; image: number; text: string }> = {
  xs: { container: "h-6 w-6", image: 24, text: "text-[8px]" },
  sm: { container: "h-8 w-8", image: 32, text: "text-[10px]" },
  md: { container: "h-10 w-10", image: 40, text: "text-xs" },
  lg: { container: "h-12 w-12", image: 48, text: "text-sm" },
  xl: { container: "h-16 w-16", image: 64, text: "text-base" },
}

/**
 * LotteryLogo Component
 * 
 * Displays a lottery game logo with intelligent fallback to initials.
 * Uses the logo resolver to find the best matching logo.
 * 
 * Features:
 * - Automatic logo resolution based on game/state
 * - Fallback to styled initials
 * - Optimized image loading with Next.js Image
 * - Dark/light mode support
 * - No layout shift (fixed dimensions)
 */
export function LotteryLogo({
  gameName,
  gameSlug,
  stateName,
  stateSlug,
  logoUrl,
  size = "md",
  priority = false,
  className,
}: LotteryLogoProps) {
  const resolved = resolveLotteryLogo({
    gameName,
    gameSlug,
    stateSlug,
    stateName,
    logoUrl,
    fallbackToInitials: true,
  })

  const sizeConfig = SIZE_MAP[size]

  // Render fallback initials
  if (resolved.isFallback || !resolved.src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg font-bold text-white",
          sizeConfig.container,
          sizeConfig.text,
          resolved.fallbackBgColor || "bg-primary",
          className
        )}
        role="img"
        aria-label={resolved.alt}
      >
        {resolved.initials || gameName.charAt(0).toUpperCase()}
      </div>
    )
  }

  // Check if the logo is an SVG
  const isSvg = resolved.src.endsWith(".svg")
  
  // For SVGs, we can use img tag for better rendering
  // For other formats, use Next.js Image for optimization
  if (isSvg) {
    return (
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-lg bg-background",
          sizeConfig.container,
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolved.src}
          alt={resolved.alt}
          className="h-full w-full object-contain p-0.5"
          loading={priority ? "eager" : "lazy"}
          width={sizeConfig.image}
          height={sizeConfig.image}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-lg bg-background",
        sizeConfig.container,
        className
      )}
    >
      <Image
        src={resolved.src}
        alt={resolved.alt}
        width={sizeConfig.image}
        height={sizeConfig.image}
        className="object-contain p-0.5"
        priority={priority}
        unoptimized={resolved.src.startsWith("http")}
      />
    </div>
  )
}

/**
 * LotteryLogoWithLabel Component
 * 
 * Displays a lottery logo with a text label underneath or beside it.
 */
export function LotteryLogoWithLabel({
  gameName,
  gameSlug,
  stateName,
  stateSlug,
  logoUrl,
  size = "md",
  priority = false,
  className,
  labelPosition = "right",
}: LotteryLogoProps & { labelPosition?: "bottom" | "right" }) {
  return (
    <div
      className={cn(
        "flex items-center",
        labelPosition === "bottom" ? "flex-col gap-1" : "flex-row gap-2",
        className
      )}
    >
      <LotteryLogo
        gameName={gameName}
        gameSlug={gameSlug}
        stateName={stateName}
        stateSlug={stateSlug}
        logoUrl={logoUrl}
        size={size}
        priority={priority}
      />
      <span className={cn(
        "font-medium",
        labelPosition === "bottom" ? "text-center text-xs" : "text-sm"
      )}>
        {gameName}
      </span>
    </div>
  )
}
