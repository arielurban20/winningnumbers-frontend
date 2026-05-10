"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ResultNumbersRow } from "@/components/numbers/ResultNumbersRow"
import { EmptyState } from "@/components/feedback"
import { formatDrawDate } from "@/lib/utils/formatDate"
import { formatJackpot } from "@/lib/utils/formatCurrency"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import type { PastDraw } from "@/types/api"

interface PastDrawsTableProps {
  draws: PastDraw[]
  pageSize?: number
  showSession?: boolean
  gameSlug?: string
}

export function PastDrawsTable({
  draws,
  pageSize = 10,
  showSession = false,
  gameSlug,
}: PastDrawsTableProps) {
  const [page, setPage] = useState(1)

  if (draws.length === 0) {
    return <EmptyState type="no-results" />
  }

  const totalPages = Math.ceil(draws.length / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentDraws = draws.slice(startIndex, endIndex)

  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-0">
        {/* Mobile: Stacked cards view */}
        <div className="md:hidden">
          <div className="divide-y divide-border/50">
            {currentDraws.map((draw, idx) => (
              <MobileDrawCard
                key={`${draw.id}-${idx}`}
                draw={draw}
                showSession={showSession}
                gameSlug={gameSlug}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Table view */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="w-36 font-semibold">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Date
                  </div>
                </TableHead>
                {showSession && (
                  <TableHead className="w-24 font-semibold">Session</TableHead>
                )}
                <TableHead className="font-semibold">Winning Numbers</TableHead>
                <TableHead className="w-36 font-semibold text-right">Jackpot</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDraws.map((draw, idx) => (
                <TableRow
                  key={`${draw.id}-${idx}`}
                  className="transition-colors hover:bg-muted/30"
                >
                  <TableCell className="font-medium">
                    {formatDrawDate(draw.draw_date)}
                  </TableCell>

                  {showSession && (
                    <TableCell className="text-sm text-muted-foreground">
                      {extractSession(draw.game_name)}
                    </TableCell>
                  )}

                  {/* Centralized renderer — handles main, bonus, extras, secondary drawings */}
                  <TableCell>
                    <ResultNumbersRow
                      mainNumbers={draw.main_numbers || []}
                      mainItems={draw.main_items}
                      bonusItems={draw.bonus_items}
                      extraItems={draw.extra_items}
                      statusColor={draw.draw_status_color}
                      gameSlug={gameSlug || draw.game_slug}
                      size="sm"
                      centered={false}
                      showExtras={true}
                    />
                  </TableCell>

                  <TableCell className="text-right">
                    {draw.jackpot_next ? (
                      <span className="font-semibold text-lottery-gold">
                        {formatJackpot(draw.jackpot_next)}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2.5 sm:px-4 sm:py-3">
            <p className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {startIndex + 1}-{Math.min(endIndex, draws.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{draws.length}</span>
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 px-2 sm:px-3"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Previous</span>
              </Button>
              <span className="text-xs sm:text-sm font-medium px-1 sm:px-2">
                {page}/{totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 px-2 sm:px-3"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Mobile stacked card view for a single draw
 */
function MobileDrawCard({
  draw,
  showSession,
  gameSlug,
}: {
  draw: PastDraw
  showSession: boolean
  gameSlug?: string
}) {
  return (
    <div className="p-3 space-y-2.5">
      {/* Header row: Date and Jackpot */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-medium">{formatDrawDate(draw.draw_date)}</span>
          {showSession && (
            <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
              {extractSession(draw.game_name)}
            </span>
          )}
        </div>
        {draw.jackpot_next && (
          <span className="text-sm font-semibold text-lottery-gold">
            {formatJackpot(draw.jackpot_next)}
          </span>
        )}
      </div>

      {/* Centralized renderer for all number types */}
      <ResultNumbersRow
        mainNumbers={draw.main_numbers || []}
        mainItems={draw.main_items}
        bonusItems={draw.bonus_items}
        extraItems={draw.extra_items}
        statusColor={draw.draw_status_color}
        gameSlug={gameSlug || draw.game_slug}
        size="sm"
        centered={false}
        showExtras={true}
      />
    </div>
  )
}

function extractSession(gameName: string): string {
  const patterns = [/\s+(Day|Night|Midday|Evening|Morning|Afternoon)$/i]
  for (const pattern of patterns) {
    const match = gameName.match(pattern)
    if (match) return match[1]
  }
  return "-"
}
