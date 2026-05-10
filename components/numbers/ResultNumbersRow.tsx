"use client"

import { cn } from "@/lib/utils"
import { NumberBall } from "./NumberBall"
import { BonusBall } from "./BonusBall"
import { ExtraItemsRow } from "./ExtraItemsRow"
import { SecondaryDrawingsList } from "./SecondaryDrawingBlock"
import { PokerLottoCards, isPokerLotto } from "./PokerLottoCards"
import { TwoByTwoBalls, isTwoByTwo } from "./TwoByTwoBalls"
import { parseExtrasWithBonusBalls } from "@/lib/utils/parseSecondaryDrawings"
import type { BonusItem, ExtraItem, MainItem } from "@/types/api"
import type { DrawStatusColor } from "@/types/lottery"
import { Plus } from "lucide-react"

interface ResultNumbersRowProps {
  mainNumbers: number[]
  mainItems?: MainItem[]
  bonusItems?: BonusItem[]
  extraItems?: ExtraItem[]
  statusColor: DrawStatusColor
  size?: "sm" | "md" | "lg"
  centered?: boolean
  showExtras?: boolean
  className?: string
  gameSlug?: string
}

function isBullsEyeLabel(label: string | undefined): boolean {
  if (!label) return false
  const normalized = label.toLowerCase()
  return (
    normalized.includes("bulls-eye") ||
    normalized.includes("bullseye") ||
    normalized.includes("bulls eye")
  )
}

function isPegaLabel(label: string | undefined): boolean {
  if (!label) return false
  const normalized = label.toLowerCase().trim()
  return normalized === "pega" || normalized.startsWith("pega ")
}

export function ResultNumbersRow({
  mainNumbers,
  mainItems,
  bonusItems = [],
  extraItems = [],
  statusColor,
  size = "md",
  centered = true,
  showExtras = true,
  className,
  gameSlug,
}: ResultNumbersRowProps) {
  const normalizedGameSlug = (gameSlug || "").toLowerCase()
  const isPegaGame =
    normalizedGameSlug.startsWith("pega-2-") ||
    normalizedGameSlug.startsWith("pega-3-") ||
    normalizedGameSlug.startsWith("pega-4-")

  const isPokerLottoGame = isPokerLotto(gameSlug, extraItems)
  const isTwoByTwoGame = isTwoByTwo(gameSlug, extraItems)

  if (isPokerLottoGame) {
    return (
      <div className={cn("space-y-3", className)}>
        <PokerLottoCards
          extraItems={extraItems}
          mainNumbers={mainNumbers}
          size={size}
          centered={centered}
        />
      </div>
    )
  }

  if (isTwoByTwoGame) {
    return (
      <div className={cn("space-y-3", className)}>
        <TwoByTwoBalls
          extraItems={extraItems}
          mainNumbers={mainNumbers}
          size={size}
          centered={centered}
        />
      </div>
    )
  }

  const mainItemsHasHighlight = !!mainItems?.some((item) => item.is_highlighted === true)
  const hasInPlaceSignals =
    mainItemsHasHighlight ||
    extraItems.some((e) => {
      const type = (e.type ?? "").toLowerCase()
      return type === "marked_special_main" || type === "in_place_bonus" || isBullsEyeLabel(e.label) || isPegaLabel(e.label)
    })

  const filteredExtraItems = extraItems.filter((e) => {
    const type = (e.type ?? "").toLowerCase()
    if (type === "marked_special_main" || type === "in_place_bonus") {
      return false
    }

    if (
      hasInPlaceSignals &&
      type !== "secondary_drawing" &&
      (isBullsEyeLabel(e.label) || isPegaLabel(e.label))
    ) {
      return false
    }

    return true
  })

  const { bonusBalls, secondaryDrawings, regularExtras } = parseExtrasWithBonusBalls(filteredExtraItems)

  const MULTIPLIER_BALL_GUARD = [
    "xtra",
    "power play",
    "powerplay",
    "megaplier",
    "multiplier",
    "ez match",
    "kicker",
    "all star bonus",
    "multiplicador",
  ]

  const apiRealBonusItems = bonusItems
    .filter((b) => !MULTIPLIER_BALL_GUARD.some((m) => (b.label ?? "").toLowerCase().includes(m)))
    .filter((b) => {
      const isInPlaceLabel = isBullsEyeLabel(b.label) || isPegaLabel(b.label)
      if (!hasInPlaceSignals || !isInPlaceLabel) return true
      // Puerto Rico Pega now comes with explicit bonus_items from API and
      // must always render as a separate bonus ball.
      if (isPegaGame && isPegaLabel(b.label)) return true
      return false
    })

  const apiBadgeExtras: ExtraItem[] = bonusItems
    .filter((b) => MULTIPLIER_BALL_GUARD.some((m) => (b.label ?? "").toLowerCase().includes(m)))
    .map((b) => ({
      label: b.label,
      value: b.value,
      color_hex: b.color_hex,
    }))

  const allBonusItems = [...apiRealBonusItems, ...bonusBalls]
  const allRegularExtras = [...regularExtras, ...apiBadgeExtras]

  const hasBonusItems = allBonusItems.length > 0
  const hasRegularExtras = allRegularExtras.length > 0
  const hasSecondaryDrawings = secondaryDrawings.length > 0

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "flex flex-wrap items-center gap-2",
          centered && "justify-center"
        )}
      >
        {mainItems && mainItems.length > 0
          ? mainItems.map((item, idx) => {
              const num = item.value ?? item.number ?? 0
              const shouldHighlight = item.is_highlighted === true
              return (
                <NumberBall
                  key={`main-${idx}`}
                  number={num}
                  statusColor={statusColor}
                  size={size}
                  colorHex={shouldHighlight ? (item.color_hex || "#ef4444") : undefined}
                  isHighlighted={shouldHighlight}
                />
              )
            })
          : mainNumbers.map((num, idx) => (
              <NumberBall
                key={`main-${idx}`}
                number={num}
                statusColor={statusColor}
                size={size}
              />
            ))}

        {hasBonusItems && (
          <>
            <div
              className={cn(
                "flex items-center justify-center text-muted-foreground/60",
                size === "sm" && "mx-0.5",
                size === "md" && "mx-1",
                size === "lg" && "mx-1.5"
              )}
              aria-hidden="true"
            >
              <Plus
                className={cn(
                  size === "sm" && "h-3 w-3",
                  size === "md" && "h-4 w-4",
                  size === "lg" && "h-5 w-5"
                )}
              />
            </div>
            {allBonusItems.map((bonus, idx) => (
              <BonusBall
                key={`bonus-${idx}`}
                number={bonus.value ?? bonus.number ?? 0}
                colorHex={bonus.color_hex}
                label={bonus.label}
                size={size}
              />
            ))}
          </>
        )}
      </div>

      {showExtras && hasRegularExtras && (
        <ExtraItemsRow items={allRegularExtras} centered={centered} />
      )}

      {showExtras && hasSecondaryDrawings && (
        <SecondaryDrawingsList
          drawings={secondaryDrawings}
          statusColor={statusColor}
          size={size === "lg" ? "md" : "sm"}
          centered={centered}
        />
      )}
    </div>
  )
}
