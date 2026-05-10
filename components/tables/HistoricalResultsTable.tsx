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
import { ResultNumbersRow } from "@/components/numbers/ResultNumbersRow"
import { EmptyState } from "@/components/feedback"
import { formatDrawDate } from "@/lib/utils/formatDate"
import { formatJackpot } from "@/lib/utils/formatCurrency"
import {
  drawsToCSVRows,
  rowsToCSVString,
  generateCSVFilename,
  downloadCSV,
} from "@/lib/utils/csv"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import type { HistoricalResult } from "@/types/api"

interface HistoricalResultsTableProps {
  results: HistoricalResult[]
  gameName: string
  gameSlug?: string
  stateName: string
  sessionName?: string
  pageSize?: number
  startDate?: string
  endDate?: string
}

export function HistoricalResultsTable({
  results,
  gameName,
  gameSlug,
  stateName,
  sessionName,
  pageSize = 20,
  startDate,
  endDate,
}: HistoricalResultsTableProps) {
  const [page, setPage] = useState(1)

  if (results.length === 0) {
    return <EmptyState type="no-results" />
  }

  const totalPages = Math.ceil(results.length / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentResults = results.slice(startIndex, endIndex)

  const handleExportCSV = () => {
    const rows = drawsToCSVRows(results, stateName, gameName, sessionName)
    const csvContent = rowsToCSVString(rows)
    const filename = generateCSVFilename(gameName, stateName, startDate, endDate)
    downloadCSV(csvContent, filename)
  }

  return (
    <div className="space-y-4">
      {/* Export button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV ({results.length} results)
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Date</TableHead>
              <TableHead>Numbers</TableHead>
              <TableHead className="hidden w-32 lg:table-cell">Jackpot</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentResults.map((result, idx) => (
              <TableRow key={`${result.id}-${idx}`}>
                <TableCell className="font-medium">
                  {formatDrawDate(result.draw_date)}
                </TableCell>

                {/* Centralized renderer — handles main, bonus, extras, Fireball, secondary drawings */}
                <TableCell>
                  <ResultNumbersRow
                    mainNumbers={result.main_numbers || []}
                    mainItems={result.main_items}
                    bonusItems={result.bonus_items}
                    extraItems={result.extra_items}
                    statusColor="gray"
                    gameSlug={gameSlug || result.game_slug}
                    size="sm"
                    centered={false}
                    showExtras={true}
                  />
                </TableCell>

                <TableCell className="hidden lg:table-cell">
                  {result.jackpot_next ? (
                    <span className="text-sm font-medium">
                      {formatJackpot(result.jackpot_next)}
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
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, results.length)} of{" "}
            {results.length} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
