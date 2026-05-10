import type { CSVExportRow } from "@/types/lottery"
import type { HistoricalResult, PastDraw, BonusItem, ExtraItem } from "@/types/api"
import { formatDateForCSV } from "./formatDate"

/**
 * Convert draw results to CSV export rows
 */
export function drawsToCSVRows(
  draws: (HistoricalResult | PastDraw)[],
  stateName: string,
  gameName: string,
  sessionName?: string
): CSVExportRow[] {
  return draws.map((draw) => ({
    date: formatDateForCSV(draw.draw_date),
    state: stateName,
    game: gameName,
    session: sessionName || "",
    main_numbers: draw.main_numbers.join("-"),
    bonus_items: formatBonusItemsForCSV(draw.bonus_items),
    extra_items: formatExtraItemsForCSV(draw.extra_items),
    jackpot_next: draw.jackpot_next || "",
  }))
}

/**
 * Format bonus items for CSV
 */
function formatBonusItemsForCSV(items: BonusItem[]): string {
  if (!items || items.length === 0) return ""
  return items.map((item) => `${item.label}: ${item.number}`).join("; ")
}

/**
 * Format extra items for CSV
 */
function formatExtraItemsForCSV(items: ExtraItem[]): string {
  if (!items || items.length === 0) return ""
  return items.map((item) => `${item.label}: ${item.value}`).join("; ")
}

/**
 * Convert CSV rows to CSV string
 */
export function rowsToCSVString(rows: CSVExportRow[]): string {
  const headers = [
    "date",
    "state",
    "game",
    "session",
    "main_numbers",
    "bonus_items",
    "extra_items",
    "jackpot_next",
  ]
  
  const csvLines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header as keyof CSVExportRow]
          // Escape quotes and wrap in quotes if contains comma
          if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`
          }
          return value
        })
        .join(",")
    ),
  ]
  
  return csvLines.join("\n")
}

/**
 * Generate CSV filename
 */
export function generateCSVFilename(
  gameName: string,
  stateName: string,
  startDate?: string,
  endDate?: string
): string {
  const parts = [
    gameName.toLowerCase().replace(/\s+/g, "-"),
    stateName.toLowerCase().replace(/\s+/g, "-"),
  ]
  
  if (startDate && endDate) {
    parts.push(`${startDate}-to-${endDate}`)
  }
  
  return `${parts.join("-")}.csv`
}

/**
 * Trigger CSV download in browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.style.display = "none"
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
