"use client"

import { cn } from "@/lib/utils"
import type { ExtraItem } from "@/types/api"

interface PokerLottoCardsProps {
  extraItems: ExtraItem[]
  mainNumbers?: (string | number)[]
  size?: "xs" | "sm" | "md" | "lg"
  centered?: boolean
  className?: string
}

// Map suit names to symbols
const SUIT_SYMBOLS: Record<string, string> = {
  spades: "♠",
  clubs: "♣",
  hearts: "♥",
  diamonds: "♦",
}

// Suit colors - spades/clubs are black, hearts/diamonds are red
const SUIT_COLORS: Record<string, string> = {
  spades: "#111111",
  clubs: "#111111",
  hearts: "#d32f2f",
  diamonds: "#d32f2f",
}

interface CardData {
  rank: string
  suit: string
  colorHex: string
}

/**
 * Extract card data from extra_items
 * API format: { label: "Card", value: "3", suit: "clubs", color_hex: "#111111" }
 */
function extractCards(extraItems: ExtraItem[]): CardData[] {
  const cards: CardData[] = []
  
  for (const item of extraItems) {
    // Check if this is a card item
    const label = String(item.label || "").toLowerCase()
    if (!label.includes("card") && !item.suit) continue
    
    // Get suit directly from the suit field
    const suit = item.suit?.toLowerCase() || ""
    if (!suit || !SUIT_SYMBOLS[suit]) continue
    
    // Get rank from value field
    const rank = String(item.value || "").toUpperCase()
    if (!rank) continue
    
    // Get color from API or use default based on suit
    const colorHex = item.color_hex || SUIT_COLORS[suit] || "#111111"
    
    cards.push({ rank, suit, colorHex })
  }
  
  return cards
}

/**
 * Poker Lotto card display component
 * Renders playing cards with rank and suit symbols
 */
export function PokerLottoCards({
  extraItems,
  mainNumbers = [],
  size = "md",
  centered = true,
  className,
}: PokerLottoCardsProps) {
  const cards = extractCards(extraItems)
  
  // If no cards found in extra_items, component shouldn't render
  if (cards.length === 0) {
    return null
  }

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-2",
      centered && "justify-center",
      className
    )}>
      {cards.map((card, idx) => (
        <div
          key={idx}
          className={cn(
            "relative flex flex-col items-center justify-center rounded bg-white shadow-sm transition-transform hover:scale-105",
            "border",
            size === "xs" && "h-9 w-6 gap-0",
            size === "sm" && "h-12 w-9 gap-0",
            size === "md" && "h-16 w-11 gap-0.5",
            size === "lg" && "h-20 w-14 gap-1"
          )}
          style={{ 
            borderColor: card.colorHex,
            boxShadow: `0 2px 4px rgba(0,0,0,0.1), 0 0 0 1px ${card.colorHex}20`
          }}
        >
          {/* Rank */}
          <span
            className={cn(
              "font-bold leading-none",
              size === "xs" && "text-[10px]",
              size === "sm" && "text-sm",
              size === "md" && "text-lg",
              size === "lg" && "text-xl"
            )}
            style={{ color: card.colorHex }}
          >
            {card.rank}
          </span>
          {/* Suit symbol */}
          <span
            className={cn(
              "leading-none",
              size === "xs" && "text-xs",
              size === "sm" && "text-base",
              size === "md" && "text-xl",
              size === "lg" && "text-2xl"
            )}
            style={{ color: card.colorHex }}
          >
            {SUIT_SYMBOLS[card.suit]}
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * Check if a game is Poker Lotto based on slug or extra_items
 */
export function isPokerLotto(gameSlug?: string, extraItems?: ExtraItem[]): boolean {
  // Check slug
  if (gameSlug) {
    const slug = gameSlug.toLowerCase()
    if (slug.includes("poker-lotto") || slug.includes("poker_lotto")) {
      return true
    }
  }
  
  // Check extra_items for card data with suit field
  if (extraItems && extraItems.length > 0) {
    return extraItems.some(item => {
      const label = String(item.label || "").toLowerCase()
      return label.includes("card") && item.suit && SUIT_SYMBOLS[item.suit.toLowerCase()]
    })
  }
  
  return false
}
